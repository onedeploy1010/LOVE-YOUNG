-- ============================================
-- 034: Fix LY Deduction & Detailed Reward Descriptions
-- ============================================
-- Changes:
-- 1. Fix trigger_partner_referral_bonus: LY deduction proportional (CEIL(bonus/100)) instead of hardcoded -1
-- 2. Add buyer name & product info to cashback descriptions
-- 3. Add new partner name to referral bonus descriptions
-- 4. Ensure LY check uses >= required (not just > 0)

-- ============================================
-- Rewrite: trigger_partner_referral_bonus
-- Now: proportional LY deduction + detailed descriptions
-- ============================================
CREATE OR REPLACE FUNCTION trigger_partner_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_partner RECORD;
  v_indirect_partner RECORD;
  v_direct_bonus NUMERIC;
  v_indirect_bonus NUMERIC;
  v_payment_amount NUMERIC;
  v_direct_ly_required INTEGER;
  v_indirect_ly_required INTEGER;
  v_new_partner_name VARCHAR;
  v_payment_rm NUMERIC;
BEGIN
  v_payment_amount := COALESCE(NEW.payment_amount, 0);

  IF v_payment_amount <= 0 THEN
    RETURN NEW;
  END IF;

  -- Get new partner's member name
  SELECT COALESCE(m.name, m.email, '未知') INTO v_new_partner_name
  FROM members m WHERE m.id = NEW.member_id;

  v_payment_rm := v_payment_amount / 100.0;

  -- Find direct referrer (if they are a partner)
  IF NEW.referrer_id IS NOT NULL THEN
    SELECT p.* INTO v_referrer_partner
    FROM partners p
    WHERE p.id = NEW.referrer_id AND p.status = 'active';

    IF v_referrer_partner.id IS NOT NULL THEN
      -- Direct referral bonus: 10%
      v_direct_bonus := FLOOR(v_payment_amount * 0.10);
      v_direct_ly_required := CEIL(v_direct_bonus / 100.0);

      -- Check if referrer has enough LY points
      IF COALESCE(v_referrer_partner.ly_balance, 0) >= v_direct_ly_required THEN
        -- Deduct LY proportionally
        UPDATE partners SET ly_balance = ly_balance - v_direct_ly_required WHERE id = v_referrer_partner.id;

        -- Add to cash wallet
        UPDATE partners
        SET cash_wallet_balance = COALESCE(cash_wallet_balance, 0) + v_direct_bonus::integer
        WHERE id = v_referrer_partner.id;

        -- Record LY deduction
        INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
        VALUES (gen_random_uuid()::text, v_referrer_partner.id, 'deduct', -v_direct_ly_required, NEW.id, 'referral_bonus',
                '推荐奖金LY扣除 - ' || v_new_partner_name || ' 加入合伙人 (RM' || v_payment_rm::numeric(10,0) || ' 配套, 奖金RM' || (v_direct_bonus/100.0)::numeric(10,2) || ')', NOW());

        -- Record cash wallet income
        INSERT INTO cash_wallet_ledger (id, partner_id, type, amount, reference_id, reference_type, status, description, created_at)
        VALUES (gen_random_uuid()::text, v_referrer_partner.id, 'referral', v_direct_bonus::integer, NEW.id, 'partner_join', 'completed',
                '直推奖金 - ' || v_new_partner_name || ' 加入合伙人 (RM' || v_payment_rm::numeric(10,0) || ' 配套, 10%)', NOW());
      ELSE
        -- Block: insufficient LY
        INSERT INTO cashback_blocked_records (partner_id, order_id, blocked_amount, reason, ly_balance_at_time, ly_required)
        VALUES (v_referrer_partner.id, NEW.id, v_direct_bonus::integer, 'insufficient_ly_referral', COALESCE(v_referrer_partner.ly_balance, 0), v_direct_ly_required);
      END IF;

      -- Find indirect referrer (referrer's referrer)
      IF v_referrer_partner.referrer_id IS NOT NULL THEN
        SELECT p.* INTO v_indirect_partner
        FROM partners p
        WHERE p.id = v_referrer_partner.referrer_id AND p.status = 'active';

        IF v_indirect_partner.id IS NOT NULL THEN
          -- Indirect referral bonus: 5%
          v_indirect_bonus := FLOOR(v_payment_amount * 0.05);
          v_indirect_ly_required := CEIL(v_indirect_bonus / 100.0);

          IF COALESCE(v_indirect_partner.ly_balance, 0) >= v_indirect_ly_required THEN
            -- Deduct LY proportionally
            UPDATE partners SET ly_balance = ly_balance - v_indirect_ly_required WHERE id = v_indirect_partner.id;

            -- Add to cash wallet
            UPDATE partners
            SET cash_wallet_balance = COALESCE(cash_wallet_balance, 0) + v_indirect_bonus::integer
            WHERE id = v_indirect_partner.id;

            -- Record LY deduction
            INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
            VALUES (gen_random_uuid()::text, v_indirect_partner.id, 'deduct', -v_indirect_ly_required, NEW.id, 'referral_bonus',
                    '间推奖金LY扣除 - ' || v_new_partner_name || ' 加入合伙人 (RM' || v_payment_rm::numeric(10,0) || ' 配套, 奖金RM' || (v_indirect_bonus/100.0)::numeric(10,2) || ')', NOW());

            -- Record cash wallet income
            INSERT INTO cash_wallet_ledger (id, partner_id, type, amount, reference_id, reference_type, status, description, created_at)
            VALUES (gen_random_uuid()::text, v_indirect_partner.id, 'referral', v_indirect_bonus::integer, NEW.id, 'partner_join', 'completed',
                    '间推奖金 - ' || v_new_partner_name || ' 加入合伙人 (RM' || v_payment_rm::numeric(10,0) || ' 配套, 5%)', NOW());
          ELSE
            -- Block: insufficient LY
            INSERT INTO cashback_blocked_records (partner_id, order_id, blocked_amount, reason, ly_balance_at_time, ly_required)
            VALUES (v_indirect_partner.id, NEW.id, v_indirect_bonus::integer, 'insufficient_ly_referral', COALESCE(v_indirect_partner.ly_balance, 0), v_indirect_ly_required);
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Rewrite: process_order_cashback
-- Now includes buyer name & product name in descriptions
-- ============================================
CREATE OR REPLACE FUNCTION process_order_cashback(p_order_id VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_box_count INTEGER;
  v_order_amount INTEGER;
  v_order_amount_rm NUMERIC;
  v_buyer_member_id VARCHAR;
  v_buyer_name VARCHAR;
  v_product_name VARCHAR;
  v_result JSONB := '[]'::JSONB;
  -- Track total cashback for pool calculation
  v_total_cashback_paid INTEGER := 0;
  v_pool_contribution INTEGER := 0;
  -- Direct partner vars
  v_direct_partner_id VARCHAR;
  v_direct_partner_member_id VARCHAR;
  v_direct_partner_tier VARCHAR;
  v_direct_boxes_processed INTEGER;
  v_direct_packages INTEGER;
  v_direct_rate NUMERIC;
  v_direct_cashback INTEGER;
  v_direct_ly_required INTEGER;
  v_direct_ly_balance INTEGER;
  -- Same-level vars
  v_current_partner_id VARCHAR;
  v_parent_partner_id VARCHAR;
  v_parent_partner_tier VARCHAR;
  v_parent_ly_balance INTEGER;
  v_same_level_cashback INTEGER;
  v_same_level_ly_required INTEGER;
  v_gen INTEGER;
  -- Cycle vars
  v_current_cycle_id VARCHAR;
  v_new_cycle_number INTEGER;
  -- LY replenishment vars
  v_current_member_id VARCHAR;
  v_referrer_id VARCHAR;
  v_layer INTEGER;
  v_layer_partner RECORD;
  v_ly_replenish INTEGER;
  v_ly_rates INTEGER[] := ARRAY[20, 15, 10, 10, 10, 5, 5, 5, 5, 5];
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

  IF v_order.status != 'delivered' THEN
    RETURN jsonb_build_object('error', 'Order not delivered yet');
  END IF;

  v_buyer_member_id := v_order.member_id;
  v_order_amount := v_order.total_amount;
  v_order_amount_rm := v_order_amount::numeric / 100.0;
  v_box_count := v_order.item_quantity;

  -- Get buyer name
  SELECT COALESCE(m.name, m.email, v_order.customer_name, '未知') INTO v_buyer_name
  FROM members m WHERE m.id = v_buyer_member_id;
  IF v_buyer_name IS NULL THEN
    v_buyer_name := COALESCE(v_order.customer_name, '未知');
  END IF;

  -- Get product name from order items
  v_product_name := COALESCE(v_order.items::jsonb->0->>'name', '产品');

  -- ========== Get or create active bonus pool cycle ==========
  SELECT id INTO v_current_cycle_id
  FROM bonus_pool_cycles
  WHERE status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_current_cycle_id IS NULL THEN
    SELECT COALESCE(MAX(cycle_number), 0) + 1 INTO v_new_cycle_number
    FROM bonus_pool_cycles;

    INSERT INTO bonus_pool_cycles (id, cycle_number, start_date, end_date, total_sales, pool_amount, total_tokens, status, created_at)
    VALUES (
      gen_random_uuid()::text,
      v_new_cycle_number,
      CURRENT_DATE::text,
      (CURRENT_DATE + INTERVAL '10 days')::date::text,
      0, 0, 0, 'active', NOW()
    )
    RETURNING id INTO v_current_cycle_id;
  END IF;

  -- ========== STEP 1: Find NEAREST upline partner (10 layers) ==========
  v_direct_partner_id := NULL;
  v_current_member_id := v_buyer_member_id;

  FOR v_layer IN 1..10 LOOP
    SELECT referrer_id INTO v_referrer_id
    FROM members WHERE id = v_current_member_id;

    IF v_referrer_id IS NULL THEN EXIT; END IF;

    SELECT p.id, p.member_id, p.tier, p.total_boxes_processed, p.packages_purchased, p.ly_balance
    INTO v_direct_partner_id, v_direct_partner_member_id, v_direct_partner_tier,
         v_direct_boxes_processed, v_direct_packages, v_direct_ly_balance
    FROM partners p
    WHERE p.member_id = v_referrer_id AND p.status = 'active';

    IF v_direct_partner_id IS NOT NULL THEN EXIT; END IF;

    v_current_member_id := v_referrer_id;
  END LOOP;

  IF v_direct_partner_id IS NOT NULL THEN
    v_direct_boxes_processed := COALESCE(v_direct_boxes_processed, 0);
    v_direct_packages := COALESCE(v_direct_packages, 1);
    v_direct_ly_balance := COALESCE(v_direct_ly_balance, 0);

    -- Calculate rate with proper cap (50% → 30% → 0%)
    IF v_direct_boxes_processed < v_direct_packages * 5 THEN
      v_direct_rate := 0.50;
    ELSIF v_direct_boxes_processed < v_direct_packages * 10 THEN
      v_direct_rate := 0.30;
    ELSE
      v_direct_rate := 0;  -- quota exhausted
    END IF;

    v_direct_cashback := FLOOR(v_order_amount * v_direct_rate);

    -- Always update total_boxes_processed (even if cashback is 0 or blocked)
    UPDATE partners
    SET total_boxes_processed = COALESCE(total_boxes_processed, 0) + v_box_count
    WHERE id = v_direct_partner_id;

    -- Process direct cashback if amount > 0
    IF v_direct_cashback > 0 THEN
      v_direct_ly_required := CEIL(v_direct_cashback::numeric / 100.0);

      IF v_direct_ly_balance < v_direct_ly_required THEN
        -- BLOCK: insufficient LY
        INSERT INTO cashback_blocked_records (partner_id, order_id, blocked_amount, reason, ly_balance_at_time, ly_required)
        VALUES (v_direct_partner_id, p_order_id, v_direct_cashback, 'insufficient_ly', v_direct_ly_balance, v_direct_ly_required);

        v_result := v_result || jsonb_build_object(
          'partner_id', v_direct_partner_id, 'type', 'direct_blocked',
          'rate', v_direct_rate, 'amount', v_direct_cashback,
          'reason', 'insufficient_ly', 'ly_balance', v_direct_ly_balance, 'ly_required', v_direct_ly_required
        );
      ELSE
        -- PAY direct cashback
        UPDATE partners SET ly_balance = ly_balance - v_direct_ly_required WHERE id = v_direct_partner_id;

        INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
        VALUES (gen_random_uuid()::text, v_direct_partner_id, 'deduct', -v_direct_ly_required, p_order_id, 'cashback',
                '返利LY扣除 - ' || v_buyer_name || ' 购买' || v_product_name || ' (RM' || v_order_amount_rm::numeric(10,2) || ', ' || (v_direct_rate * 100)::integer || '%返利)', NOW());

        UPDATE partners
        SET cash_wallet_balance = COALESCE(cash_wallet_balance, 0) + v_direct_cashback,
            total_cashback = COALESCE(total_cashback, 0) + v_direct_cashback
        WHERE id = v_direct_partner_id;

        INSERT INTO cash_wallet_ledger (id, partner_id, type, amount, reference_id, reference_type, status, description, created_at)
        VALUES (gen_random_uuid()::text, v_direct_partner_id, 'cashback', v_direct_cashback, p_order_id, 'order', 'completed',
                '团队返利 - ' || v_buyer_name || ' 购买' || v_product_name || ' (RM' || v_order_amount_rm::numeric(10,2) || ', ' || (v_direct_rate * 100)::integer || '%)', NOW());

        -- Update monthly tracking
        INSERT INTO monthly_cashback_tracking (id, partner_id, year_month, box_count, total_cashback, created_at, updated_at)
        VALUES (gen_random_uuid()::text, v_direct_partner_id, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), v_box_count, v_direct_cashback, NOW(), NOW())
        ON CONFLICT (partner_id, year_month)
        DO UPDATE SET
          box_count = monthly_cashback_tracking.box_count + v_box_count,
          total_cashback = monthly_cashback_tracking.total_cashback + v_direct_cashback,
          updated_at = NOW();

        v_total_cashback_paid := v_total_cashback_paid + v_direct_cashback;

        v_result := v_result || jsonb_build_object(
          'partner_id', v_direct_partner_id, 'type', 'direct',
          'rate', v_direct_rate, 'amount', v_direct_cashback, 'ly_deducted', v_direct_ly_required
        );
      END IF;
    ELSE
      -- Rate is 0 (quota exhausted), record for transparency
      v_result := v_result || jsonb_build_object(
        'partner_id', v_direct_partner_id, 'type', 'direct_exhausted',
        'rate', 0, 'amount', 0, 'boxes_processed', v_direct_boxes_processed
      );
    END IF;

    -- RWA for direct partner (always, regardless of cashback)
    UPDATE partners SET rwa_tokens = COALESCE(rwa_tokens, 0) + 1 WHERE id = v_direct_partner_id;
    INSERT INTO rwa_token_ledger (id, partner_id, cycle_id, tokens, source, order_id, created_at)
    VALUES (gen_random_uuid()::text, v_direct_partner_id, v_current_cycle_id, 1, 'network_order', p_order_id, NOW());
    UPDATE bonus_pool_cycles SET total_tokens = COALESCE(total_tokens, 0) + 1 WHERE id = v_current_cycle_id;

    -- ========== STEP 2: Same-level partner-referrers (regional bonus, up to 2 gen) ==========
    -- Only pay regional bonus if direct cashback was actually paid (> 0 and not blocked)
    IF v_direct_cashback > 0 AND v_total_cashback_paid > 0 THEN
      v_current_partner_id := v_direct_partner_id;
      v_same_level_cashback := FLOOR(v_direct_cashback * 0.10); -- 10% of direct

      FOR v_gen IN 1..2 LOOP
        SELECT p2.referrer_id INTO v_parent_partner_id
        FROM partners p2 WHERE p2.id = v_current_partner_id;

        IF v_parent_partner_id IS NULL THEN EXIT; END IF;

        SELECT p3.id, p3.tier, p3.ly_balance
        INTO v_parent_partner_id, v_parent_partner_tier, v_parent_ly_balance
        FROM partners p3 WHERE p3.id = v_parent_partner_id AND p3.status = 'active';

        IF v_parent_partner_id IS NULL THEN EXIT; END IF;

        IF v_same_level_cashback > 0 THEN
          v_same_level_ly_required := CEIL(v_same_level_cashback::numeric / 100.0);

          IF COALESCE(v_parent_ly_balance, 0) < v_same_level_ly_required THEN
            -- Block
            INSERT INTO cashback_blocked_records (partner_id, order_id, blocked_amount, reason, ly_balance_at_time, ly_required)
            VALUES (v_parent_partner_id, p_order_id, v_same_level_cashback, 'insufficient_ly_same_level', COALESCE(v_parent_ly_balance, 0), v_same_level_ly_required);

            v_result := v_result || jsonb_build_object(
              'partner_id', v_parent_partner_id, 'type', 'same_level_blocked',
              'generation', v_gen, 'amount', v_same_level_cashback,
              'reason', 'insufficient_ly'
            );
          ELSE
            -- Pay regional bonus
            UPDATE partners SET ly_balance = ly_balance - v_same_level_ly_required WHERE id = v_parent_partner_id;

            INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
            VALUES (gen_random_uuid()::text, v_parent_partner_id, 'deduct', -v_same_level_ly_required, p_order_id, 'cashback',
                    '区域奖金LY扣除 - ' || v_buyer_name || ' 购买' || v_product_name || ' (第' || v_gen || '代, 奖金RM' || (v_same_level_cashback/100.0)::numeric(10,2) || ')', NOW());

            UPDATE partners
            SET cash_wallet_balance = COALESCE(cash_wallet_balance, 0) + v_same_level_cashback,
                total_cashback = COALESCE(total_cashback, 0) + v_same_level_cashback
            WHERE id = v_parent_partner_id;

            INSERT INTO cash_wallet_ledger (id, partner_id, type, amount, reference_id, reference_type, status, description, created_at)
            VALUES (gen_random_uuid()::text, v_parent_partner_id, 'cashback', v_same_level_cashback, p_order_id, 'order', 'completed',
                    '区域奖金 - ' || v_buyer_name || ' 购买' || v_product_name || ' (第' || v_gen || '代, 返利10%)', NOW());

            v_total_cashback_paid := v_total_cashback_paid + v_same_level_cashback;

            v_result := v_result || jsonb_build_object(
              'partner_id', v_parent_partner_id, 'type', 'same_level',
              'generation', v_gen, 'amount', v_same_level_cashback, 'ly_deducted', v_same_level_ly_required
            );
          END IF;
        END IF;

        -- RWA for same-level partner
        UPDATE partners SET rwa_tokens = COALESCE(rwa_tokens, 0) + 1 WHERE id = v_parent_partner_id;
        INSERT INTO rwa_token_ledger (id, partner_id, cycle_id, tokens, source, order_id, created_at)
        VALUES (gen_random_uuid()::text, v_parent_partner_id, v_current_cycle_id, 1, 'network_order', p_order_id, NOW());
        UPDATE bonus_pool_cycles SET total_tokens = COALESCE(total_tokens, 0) + 1 WHERE id = v_current_cycle_id;

        v_current_partner_id := v_parent_partner_id;
      END LOOP;
    END IF;

  END IF; -- v_direct_partner_id IS NOT NULL

  -- ========== STEP 3: LY Replenishment (10-layer network) ==========
  v_current_member_id := v_buyer_member_id;

  FOR v_layer IN 1..10 LOOP
    SELECT referrer_id INTO v_referrer_id
    FROM members WHERE id = v_current_member_id;

    IF v_referrer_id IS NULL THEN EXIT; END IF;

    SELECT p.id, p.member_id INTO v_layer_partner
    FROM partners p
    WHERE p.member_id = v_referrer_id AND p.status = 'active';

    IF v_layer_partner.id IS NOT NULL THEN
      v_ly_replenish := FLOOR(v_order_amount_rm * v_ly_rates[v_layer] / 100.0);

      IF v_ly_replenish > 0 THEN
        UPDATE partners SET ly_balance = COALESCE(ly_balance, 0) + v_ly_replenish WHERE id = v_layer_partner.id;

        INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
        VALUES (gen_random_uuid()::text, v_layer_partner.id, 'replenish', v_ly_replenish, p_order_id, 'network_replenish',
                'LY补充 - ' || v_buyer_name || ' 购买' || v_product_name || ' (第' || v_layer || '层, ' || v_ly_rates[v_layer] || '%)', NOW());
      END IF;
    END IF;

    v_current_member_id := v_referrer_id;
  END LOOP;

  -- ========== STEP 4: Bonus Pool Contribution ==========
  -- Pool gets 30% of (order amount MINUS all cashback & regional bonuses paid)
  v_pool_contribution := FLOOR((v_order_amount - v_total_cashback_paid) * 0.30);

  IF v_pool_contribution > 0 THEN
    UPDATE bonus_pool_cycles
    SET total_sales = COALESCE(total_sales, 0) + v_order_amount,
        pool_amount = COALESCE(pool_amount, 0) + v_pool_contribution
    WHERE id = v_current_cycle_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'order_amount', v_order_amount,
    'total_cashback_paid', v_total_cashback_paid,
    'pool_contribution', v_pool_contribution,
    'cycle_id', v_current_cycle_id,
    'rewards', v_result
  );
END;
$$ LANGUAGE plpgsql;
