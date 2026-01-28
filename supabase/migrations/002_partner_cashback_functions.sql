-- ============================================
-- Partner Cashback Reward System
-- ============================================
-- Rules:
-- 1. 3-generation (三代) referral rewards for partners
-- 2. Tiered cashback rates based on boxes completed this month:
--    - Boxes 1-2: 20% per box
--    - Boxes 3-5: 30% per box
--    - Boxes 6-10: 50% per box
-- 3. Max 10 cashback events per partner per 30-day cycle
-- 4. If member not upgraded to partner, rewards roll up to nearest upline partner
-- 5. Differential rewards: lower tier partner's difference rolls up to higher tier partner
-- 6. Requires LY points to credit to withdrawal wallet
-- 7. Cashback count resets every 30 days

-- ============================================
-- Helper function: Get partner's current cashback tier rate
-- ============================================
CREATE OR REPLACE FUNCTION get_partner_cashback_rate(p_partner_id VARCHAR, p_current_box_count INTEGER)
RETURNS NUMERIC AS $$
BEGIN
  -- Based on how many boxes the partner has already completed this month
  IF p_current_box_count < 2 THEN
    RETURN 0.20; -- 20% for boxes 1-2
  ELSIF p_current_box_count < 5 THEN
    RETURN 0.30; -- 30% for boxes 3-5
  ELSIF p_current_box_count < 10 THEN
    RETURN 0.50; -- 50% for boxes 6-10
  ELSE
    RETURN 0; -- Max 10 boxes reached
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Helper function: Get current 30-day cycle period
-- ============================================
CREATE OR REPLACE FUNCTION get_current_cashback_cycle()
RETURNS TEXT AS $$
BEGIN
  -- Returns YYYY-MM format based on 30-day cycles from start of month
  RETURN TO_CHAR(CURRENT_DATE, 'YYYY-MM');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Helper function: Get partner's box count for current cycle
-- ============================================
CREATE OR REPLACE FUNCTION get_partner_box_count(p_partner_id VARCHAR)
RETURNS INTEGER AS $$
DECLARE
  v_box_count INTEGER;
  v_year_month TEXT;
BEGIN
  v_year_month := get_current_cashback_cycle();

  SELECT COALESCE(box_count, 0) INTO v_box_count
  FROM monthly_cashback_tracking
  WHERE partner_id = p_partner_id AND year_month = v_year_month;

  RETURN COALESCE(v_box_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Helper function: Find nearest upline partner (within 3 generations)
-- If member is not a partner, find the nearest partner in their upline
-- ============================================
CREATE OR REPLACE FUNCTION find_upline_partners(p_member_id VARCHAR, p_max_generations INTEGER DEFAULT 3)
RETURNS TABLE (
  partner_id VARCHAR,
  member_id VARCHAR,
  generation INTEGER,
  box_count INTEGER,
  cashback_rate NUMERIC
) AS $$
DECLARE
  v_current_member_id VARCHAR;
  v_current_generation INTEGER := 0;
  v_referrer_id VARCHAR;
  v_partner_record RECORD;
BEGIN
  v_current_member_id := p_member_id;

  WHILE v_current_generation < p_max_generations LOOP
    -- Get referrer of current member
    SELECT m.referrer_id INTO v_referrer_id
    FROM members m
    WHERE m.id = v_current_member_id;

    -- No more upline
    IF v_referrer_id IS NULL THEN
      EXIT;
    END IF;

    v_current_generation := v_current_generation + 1;

    -- Check if referrer is a partner
    SELECT p.id, p.member_id INTO v_partner_record
    FROM partners p
    WHERE p.member_id = v_referrer_id AND p.status = 'active';

    IF v_partner_record.id IS NOT NULL THEN
      -- Found a partner, return their info
      partner_id := v_partner_record.id;
      member_id := v_partner_record.member_id;
      generation := v_current_generation;
      box_count := get_partner_box_count(v_partner_record.id);
      cashback_rate := get_partner_cashback_rate(v_partner_record.id, box_count);
      RETURN NEXT;
    END IF;

    -- Move up to the next level
    v_current_member_id := v_referrer_id;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Main function: Process order cashback rewards
-- Called when an order is marked as delivered/completed
-- ============================================
CREATE OR REPLACE FUNCTION process_order_cashback(p_order_id VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_box_count INTEGER;
  v_order_amount NUMERIC;
  v_buyer_member_id VARCHAR;
  v_upline RECORD;
  v_prev_rate NUMERIC := 0;
  v_cashback_amount NUMERIC;
  v_differential_amount NUMERIC;
  v_partner_box_count INTEGER;
  v_year_month TEXT;
  v_result JSONB := '[]'::JSONB;
  v_reward_entry JSONB;
  v_ly_balance INTEGER;
  v_rewards_given INTEGER := 0;
BEGIN
  -- Get order details
  SELECT o.*,
         COALESCE((o.items::jsonb->0->>'quantity')::integer, 1) as item_quantity
  INTO v_order
  FROM orders o
  WHERE o.id = p_order_id;

  IF v_order IS NULL THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;

  -- Skip if order not delivered
  IF v_order.status != 'delivered' THEN
    RETURN jsonb_build_object('error', 'Order not delivered yet');
  END IF;

  v_buyer_member_id := v_order.member_id;
  v_order_amount := v_order.total_amount;
  v_box_count := v_order.item_quantity;
  v_year_month := get_current_cashback_cycle();

  -- Find upline partners (up to 3 generations)
  FOR v_upline IN SELECT * FROM find_upline_partners(v_buyer_member_id, 3) ORDER BY generation ASC LOOP
    -- Check if partner has reached max 10 cashback events
    v_partner_box_count := v_upline.box_count;

    IF v_partner_box_count >= 10 THEN
      -- Skip this partner, they've maxed out
      CONTINUE;
    END IF;

    -- Check if partner has LY points
    SELECT ly_balance INTO v_ly_balance
    FROM partners
    WHERE id = v_upline.partner_id;

    IF COALESCE(v_ly_balance, 0) <= 0 THEN
      -- No LY points, reward is invalid - skip
      CONTINUE;
    END IF;

    -- Calculate cashback for this partner
    -- Base cashback at their tier rate
    v_cashback_amount := v_order_amount * v_upline.cashback_rate;

    -- Calculate differential reward (roll-up from lower tier partners)
    IF v_prev_rate > 0 AND v_upline.cashback_rate > v_prev_rate THEN
      v_differential_amount := v_order_amount * (v_upline.cashback_rate - v_prev_rate);
      v_cashback_amount := v_differential_amount; -- Only get the difference, not full amount
    END IF;

    -- For first generation, they get full cashback at their rate
    IF v_upline.generation = 1 THEN
      v_cashback_amount := v_order_amount * v_upline.cashback_rate;
    END IF;

    -- Skip if no cashback to give
    IF v_cashback_amount <= 0 THEN
      v_prev_rate := v_upline.cashback_rate;
      CONTINUE;
    END IF;

    -- Deduct 1 LY point for this cashback
    UPDATE partners
    SET ly_balance = ly_balance - 1
    WHERE id = v_upline.partner_id;

    -- Record LY deduction
    INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
    VALUES (
      gen_random_uuid()::text,
      v_upline.partner_id,
      'deduct',
      -1,
      p_order_id,
      'cashback',
      'Cashback reward processing fee',
      NOW()
    );

    -- Add cashback to partner's cash wallet
    UPDATE partners
    SET cash_wallet_balance = COALESCE(cash_wallet_balance, 0) + v_cashback_amount::integer
    WHERE id = v_upline.partner_id;

    -- Record cash wallet transaction
    INSERT INTO cash_wallet_ledger (id, partner_id, type, amount, reference_id, reference_type, status, description, created_at)
    VALUES (
      gen_random_uuid()::text,
      v_upline.partner_id,
      'cashback',
      v_cashback_amount::integer,
      p_order_id,
      'order',
      'completed',
      'Order cashback reward (Gen ' || v_upline.generation || ', Rate: ' || (v_upline.cashback_rate * 100)::integer || '%)',
      NOW()
    );

    -- Update monthly tracking
    INSERT INTO monthly_cashback_tracking (id, partner_id, year_month, box_count, total_cashback, created_at, updated_at)
    VALUES (
      gen_random_uuid()::text,
      v_upline.partner_id,
      v_year_month,
      v_box_count,
      v_cashback_amount::integer,
      NOW(),
      NOW()
    )
    ON CONFLICT (partner_id, year_month)
    DO UPDATE SET
      box_count = monthly_cashback_tracking.box_count + v_box_count,
      total_cashback = monthly_cashback_tracking.total_cashback + v_cashback_amount::integer,
      updated_at = NOW();

    -- Build result entry
    v_reward_entry := jsonb_build_object(
      'partner_id', v_upline.partner_id,
      'generation', v_upline.generation,
      'rate', v_upline.cashback_rate,
      'amount', v_cashback_amount,
      'box_count_after', v_partner_box_count + v_box_count
    );
    v_result := v_result || v_reward_entry;

    v_prev_rate := v_upline.cashback_rate;
    v_rewards_given := v_rewards_given + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'rewards_given', v_rewards_given,
    'rewards', v_result
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger: Auto-process cashback when order delivered
-- ============================================
CREATE OR REPLACE FUNCTION trigger_order_delivered_cashback()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    PERFORM process_order_cashback(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_delivered_cashback ON orders;
CREATE TRIGGER trg_order_delivered_cashback
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_delivered_cashback();

-- ============================================
-- Function: Reset monthly cashback tracking (run via cron)
-- Should be called at the start of each month
-- ============================================
CREATE OR REPLACE FUNCTION reset_monthly_cashback_tracking()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Archive old records (optional - keep for history)
  -- Delete records older than current month
  DELETE FROM monthly_cashback_tracking
  WHERE year_month < get_current_cashback_cycle();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger: Create notification on order status change
-- ============================================
CREATE OR REPLACE FUNCTION trigger_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_content TEXT;
BEGIN
  -- Set notification content based on status
  CASE NEW.status
    WHEN 'pending' THEN
      v_title := 'Order Confirmed';
      v_content := 'Your order #' || NEW.order_number || ' has been confirmed.';
    WHEN 'processing' THEN
      v_title := 'Order Processing';
      v_content := 'Your order #' || NEW.order_number || ' is being prepared.';
    WHEN 'shipped' THEN
      v_title := 'Order Shipped';
      v_content := 'Your order #' || NEW.order_number || ' has been shipped!';
    WHEN 'delivered' THEN
      v_title := 'Order Delivered';
      v_content := 'Your order #' || NEW.order_number || ' has been delivered. Enjoy!';
    WHEN 'cancelled' THEN
      v_title := 'Order Cancelled';
      v_content := 'Your order #' || NEW.order_number || ' has been cancelled.';
    ELSE
      RETURN NEW;
  END CASE;

  -- Only create notification if member_id exists
  IF NEW.member_id IS NOT NULL THEN
    INSERT INTO notifications (id, member_id, type, title, content, read, data, created_at)
    VALUES (
      gen_random_uuid()::text,
      NEW.member_id,
      'order',
      v_title,
      v_content,
      false,
      jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'status', NEW.status),
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_status_notification ON orders;
CREATE TRIGGER trg_order_status_notification
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_order_status_notification();

-- ============================================
-- Trigger: Process partner referral bonus on new partner join
-- Direct referrer: 10%, Indirect (2nd gen): 5%
-- ============================================
CREATE OR REPLACE FUNCTION trigger_partner_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_partner RECORD;
  v_indirect_partner RECORD;
  v_direct_bonus NUMERIC;
  v_indirect_bonus NUMERIC;
  v_payment_amount NUMERIC;
BEGIN
  v_payment_amount := COALESCE(NEW.payment_amount, 0);

  IF v_payment_amount <= 0 THEN
    RETURN NEW;
  END IF;

  -- Find direct referrer (if they are a partner)
  IF NEW.referrer_id IS NOT NULL THEN
    SELECT p.* INTO v_referrer_partner
    FROM partners p
    WHERE p.id = NEW.referrer_id AND p.status = 'active';

    IF v_referrer_partner.id IS NOT NULL THEN
      -- Direct referral bonus: 10%
      v_direct_bonus := v_payment_amount * 0.10;

      -- Check if referrer has LY points
      IF COALESCE(v_referrer_partner.ly_balance, 0) > 0 THEN
        -- Deduct 1 LY point
        UPDATE partners SET ly_balance = ly_balance - 1 WHERE id = v_referrer_partner.id;

        -- Add to cash wallet
        UPDATE partners
        SET cash_wallet_balance = COALESCE(cash_wallet_balance, 0) + v_direct_bonus::integer
        WHERE id = v_referrer_partner.id;

        -- Record transactions
        INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
        VALUES (gen_random_uuid()::text, v_referrer_partner.id, 'deduct', -1, NEW.id, 'referral_bonus', 'Direct referral bonus fee', NOW());

        INSERT INTO cash_wallet_ledger (id, partner_id, type, amount, reference_id, reference_type, status, description, created_at)
        VALUES (gen_random_uuid()::text, v_referrer_partner.id, 'referral', v_direct_bonus::integer, NEW.id, 'partner_join', 'completed', 'Direct referral bonus (10%)', NOW());
      END IF;

      -- Find indirect referrer (referrer's referrer)
      IF v_referrer_partner.referrer_id IS NOT NULL THEN
        SELECT p.* INTO v_indirect_partner
        FROM partners p
        WHERE p.id = v_referrer_partner.referrer_id AND p.status = 'active';

        IF v_indirect_partner.id IS NOT NULL AND COALESCE(v_indirect_partner.ly_balance, 0) > 0 THEN
          -- Indirect referral bonus: 5%
          v_indirect_bonus := v_payment_amount * 0.05;

          -- Deduct 1 LY point
          UPDATE partners SET ly_balance = ly_balance - 1 WHERE id = v_indirect_partner.id;

          -- Add to cash wallet
          UPDATE partners
          SET cash_wallet_balance = COALESCE(cash_wallet_balance, 0) + v_indirect_bonus::integer
          WHERE id = v_indirect_partner.id;

          -- Record transactions
          INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
          VALUES (gen_random_uuid()::text, v_indirect_partner.id, 'deduct', -1, NEW.id, 'referral_bonus', 'Indirect referral bonus fee', NOW());

          INSERT INTO cash_wallet_ledger (id, partner_id, type, amount, reference_id, reference_type, status, description, created_at)
          VALUES (gen_random_uuid()::text, v_indirect_partner.id, 'referral', v_indirect_bonus::integer, NEW.id, 'partner_join', 'completed', 'Indirect referral bonus (5%)', NOW());
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_partner_referral_bonus ON partners;
CREATE TRIGGER trg_partner_referral_bonus
  AFTER INSERT ON partners
  FOR EACH ROW
  EXECUTE FUNCTION trigger_partner_referral_bonus();

-- ============================================
-- Trigger: Add to bonus pool when order completed
-- 30% of order amount goes to bonus pool
-- ============================================
CREATE OR REPLACE FUNCTION trigger_order_bonus_pool()
RETURNS TRIGGER AS $$
DECLARE
  v_pool_contribution NUMERIC;
  v_current_cycle RECORD;
BEGIN
  -- Only process delivered orders
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    v_pool_contribution := NEW.total_amount * 0.30;

    -- Get or create current cycle
    SELECT * INTO v_current_cycle
    FROM bonus_pool_cycles
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_current_cycle.id IS NULL THEN
      -- Create new cycle
      INSERT INTO bonus_pool_cycles (id, cycle_number, start_date, end_date, total_sales, pool_amount, total_tokens, status, created_at)
      VALUES (
        gen_random_uuid()::text,
        1,
        CURRENT_DATE::text,
        (CURRENT_DATE + INTERVAL '10 days')::date::text,
        NEW.total_amount,
        v_pool_contribution::integer,
        0,
        'active',
        NOW()
      )
      RETURNING * INTO v_current_cycle;
    ELSE
      -- Update existing cycle
      UPDATE bonus_pool_cycles
      SET
        total_sales = COALESCE(total_sales, 0) + NEW.total_amount,
        pool_amount = COALESCE(pool_amount, 0) + v_pool_contribution::integer
      WHERE id = v_current_cycle.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_bonus_pool ON orders;
CREATE TRIGGER trg_order_bonus_pool
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_bonus_pool();

-- ============================================
-- Trigger: Deduct inventory when order confirmed
-- ============================================
CREATE OR REPLACE FUNCTION trigger_order_inventory_deduct()
RETURNS TRIGGER AS $$
DECLARE
  v_item JSONB;
  v_sku TEXT;
  v_quantity INTEGER;
  v_inventory_id VARCHAR;
BEGIN
  -- Only process when order is first created or changes to processing
  IF NEW.status IN ('pending', 'processing') AND (OLD IS NULL OR OLD.status NOT IN ('pending', 'processing')) THEN
    -- Parse items JSON
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items::jsonb)
    LOOP
      v_sku := v_item->>'sku';
      v_quantity := COALESCE((v_item->>'quantity')::integer, 1);

      IF v_sku IS NOT NULL THEN
        -- Find inventory by SKU
        SELECT id INTO v_inventory_id FROM inventory WHERE sku = v_sku;

        IF v_inventory_id IS NOT NULL THEN
          -- Deduct quantity
          UPDATE inventory
          SET quantity = COALESCE(quantity, 0) - v_quantity,
              updated_at = NOW()
          WHERE id = v_inventory_id;

          -- Record ledger entry
          INSERT INTO inventory_ledger (id, inventory_id, type, quantity, reference_type, reference_id, notes, created_at)
          VALUES (
            gen_random_uuid()::text,
            v_inventory_id,
            'out',
            -v_quantity,
            'order',
            NEW.id,
            'Order #' || NEW.order_number,
            NOW()
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_inventory_deduct ON orders;
CREATE TRIGGER trg_order_inventory_deduct
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_inventory_deduct();

-- ============================================
-- Trigger: Restore inventory when order cancelled
-- ============================================
CREATE OR REPLACE FUNCTION trigger_order_inventory_restore()
RETURNS TRIGGER AS $$
DECLARE
  v_item JSONB;
  v_sku TEXT;
  v_quantity INTEGER;
  v_inventory_id VARCHAR;
BEGIN
  -- Only process when order is cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Parse items JSON
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items::jsonb)
    LOOP
      v_sku := v_item->>'sku';
      v_quantity := COALESCE((v_item->>'quantity')::integer, 1);

      IF v_sku IS NOT NULL THEN
        -- Find inventory by SKU
        SELECT id INTO v_inventory_id FROM inventory WHERE sku = v_sku;

        IF v_inventory_id IS NOT NULL THEN
          -- Restore quantity
          UPDATE inventory
          SET quantity = COALESCE(quantity, 0) + v_quantity,
              updated_at = NOW()
          WHERE id = v_inventory_id;

          -- Record ledger entry
          INSERT INTO inventory_ledger (id, inventory_id, type, quantity, reference_type, reference_id, notes, created_at)
          VALUES (
            gen_random_uuid()::text,
            v_inventory_id,
            'in',
            v_quantity,
            'order_cancel',
            NEW.id,
            'Order cancelled #' || NEW.order_number,
            NOW()
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_inventory_restore ON orders;
CREATE TRIGGER trg_order_inventory_restore
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_inventory_restore();

-- ============================================
-- Trigger: Award RWA tokens for network orders
-- Partner gets 1 RWA when someone in their 10-level network buys a gift box
-- ============================================
CREATE OR REPLACE FUNCTION trigger_order_rwa_reward()
RETURNS TRIGGER AS $$
DECLARE
  v_buyer_member_id VARCHAR;
  v_current_member_id VARCHAR;
  v_referrer_id VARCHAR;
  v_partner_record RECORD;
  v_current_cycle_id VARCHAR;
  v_generation INTEGER := 0;
BEGIN
  -- Only process delivered orders
  IF NEW.status != 'delivered' OR OLD.status = 'delivered' THEN
    RETURN NEW;
  END IF;

  v_buyer_member_id := NEW.member_id;

  IF v_buyer_member_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get current active cycle
  SELECT id INTO v_current_cycle_id
  FROM bonus_pool_cycles
  WHERE status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_current_cycle_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_current_member_id := v_buyer_member_id;

  -- Search up to 10 levels
  WHILE v_generation < 10 LOOP
    -- Get referrer
    SELECT referrer_id INTO v_referrer_id
    FROM members
    WHERE id = v_current_member_id;

    IF v_referrer_id IS NULL THEN
      EXIT;
    END IF;

    v_generation := v_generation + 1;

    -- Check if referrer is a partner
    SELECT p.* INTO v_partner_record
    FROM partners p
    WHERE p.member_id = v_referrer_id AND p.status = 'active';

    IF v_partner_record.id IS NOT NULL THEN
      -- Found the nearest upline partner - award 1 RWA
      UPDATE partners
      SET rwa_tokens = COALESCE(rwa_tokens, 0) + 1
      WHERE id = v_partner_record.id;

      -- Record RWA ledger
      INSERT INTO rwa_token_ledger (id, partner_id, cycle_id, tokens, source, order_id, created_at)
      VALUES (
        gen_random_uuid()::text,
        v_partner_record.id,
        v_current_cycle_id,
        1,
        'network_order',
        NEW.id,
        NOW()
      );

      -- Update cycle total tokens
      UPDATE bonus_pool_cycles
      SET total_tokens = COALESCE(total_tokens, 0) + 1
      WHERE id = v_current_cycle_id;

      -- Only the nearest partner gets the RWA, exit loop
      EXIT;
    END IF;

    v_current_member_id := v_referrer_id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_rwa_reward ON orders;
CREATE TRIGGER trg_order_rwa_reward
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_rwa_reward();

-- ============================================
-- Function: Distribute bonus pool at end of cycle
-- Called manually or via cron job
-- ============================================
CREATE OR REPLACE FUNCTION distribute_bonus_pool(p_cycle_id VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_cycle RECORD;
  v_partner RECORD;
  v_partner_share NUMERIC;
  v_total_distributed NUMERIC := 0;
  v_distributions JSONB := '[]'::JSONB;
BEGIN
  -- Get cycle
  SELECT * INTO v_cycle
  FROM bonus_pool_cycles
  WHERE id = p_cycle_id AND status = 'active';

  IF v_cycle IS NULL THEN
    RETURN jsonb_build_object('error', 'Cycle not found or not active');
  END IF;

  IF COALESCE(v_cycle.total_tokens, 0) = 0 THEN
    RETURN jsonb_build_object('error', 'No RWA tokens in this cycle');
  END IF;

  -- Distribute to each partner based on their RWA ratio
  FOR v_partner IN
    SELECT p.id, p.ly_balance, COALESCE(p.rwa_tokens, 0) as tokens
    FROM partners p
    WHERE p.status = 'active' AND COALESCE(p.rwa_tokens, 0) > 0
  LOOP
    -- Check if partner has LY points
    IF COALESCE(v_partner.ly_balance, 0) <= 0 THEN
      CONTINUE;
    END IF;

    -- Calculate share: (partner_tokens / total_tokens) * pool_amount
    v_partner_share := (v_partner.tokens::numeric / v_cycle.total_tokens::numeric) * v_cycle.pool_amount;

    -- Deduct 1 LY point
    UPDATE partners SET ly_balance = ly_balance - 1 WHERE id = v_partner.id;

    -- Add to cash wallet
    UPDATE partners
    SET cash_wallet_balance = COALESCE(cash_wallet_balance, 0) + v_partner_share::integer
    WHERE id = v_partner.id;

    -- Record transactions
    INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
    VALUES (gen_random_uuid()::text, v_partner.id, 'deduct', -1, p_cycle_id, 'pool_distribution', 'Bonus pool distribution fee', NOW());

    INSERT INTO cash_wallet_ledger (id, partner_id, type, amount, reference_id, reference_type, status, description, created_at)
    VALUES (gen_random_uuid()::text, v_partner.id, 'pool_reward', v_partner_share::integer, p_cycle_id, 'bonus_pool', 'completed',
      'Bonus pool distribution (Tokens: ' || v_partner.tokens || '/' || v_cycle.total_tokens || ')', NOW());

    v_total_distributed := v_total_distributed + v_partner_share;
    v_distributions := v_distributions || jsonb_build_object('partner_id', v_partner.id, 'tokens', v_partner.tokens, 'share', v_partner_share);
  END LOOP;

  -- Reset all partner RWA tokens to 1
  UPDATE partners SET rwa_tokens = 1 WHERE status = 'active';

  -- Mark cycle as completed
  UPDATE bonus_pool_cycles
  SET status = 'completed', distributed_at = NOW()::text
  WHERE id = p_cycle_id;

  -- Create new cycle
  INSERT INTO bonus_pool_cycles (id, cycle_number, start_date, end_date, total_sales, pool_amount, total_tokens, status, created_at)
  VALUES (
    gen_random_uuid()::text,
    v_cycle.cycle_number + 1,
    CURRENT_DATE::text,
    (CURRENT_DATE + INTERVAL '10 days')::date::text,
    0,
    0,
    0,
    'active',
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'cycle_id', p_cycle_id,
    'pool_amount', v_cycle.pool_amount,
    'total_tokens', v_cycle.total_tokens,
    'total_distributed', v_total_distributed,
    'distributions', v_distributions
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Add unique constraint for monthly_cashback_tracking
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'monthly_cashback_tracking_partner_month_unique'
  ) THEN
    ALTER TABLE monthly_cashback_tracking
    ADD CONSTRAINT monthly_cashback_tracking_partner_month_unique
    UNIQUE (partner_id, year_month);
  END IF;
END $$;

-- ============================================
-- Create index for faster referral tree queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_members_referrer_id ON members(referrer_id);
CREATE INDEX IF NOT EXISTS idx_partners_member_id ON partners(member_id);
CREATE INDEX IF NOT EXISTS idx_partners_referrer_id ON partners(referrer_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);

-- ============================================
-- Grant necessary permissions
-- ============================================
GRANT EXECUTE ON FUNCTION get_partner_cashback_rate(VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_cashback_cycle() TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_box_count(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION find_upline_partners(VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION process_order_cashback(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION distribute_bonus_pool(VARCHAR) TO service_role;
