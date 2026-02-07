-- ============================================
-- 028: Fix Cashback System
-- ============================================
-- Changes:
-- 1. Add packages_purchased, total_boxes_processed to partners
-- 2. Create cashback_blocked_records table
-- 3. Rewrite cashback rate to 2-tier per-package (first 5 per pkg: 50%, after: 30%)
-- 4. Rewrite process_order_cashback: direct + same-level 10% + LY proportional
-- 5. Add LY replenishment (10-layer network)
-- 6. RWA: direct partner +1, same-level partners +1

-- ============================================
-- Add new columns to partners
-- ============================================
ALTER TABLE partners ADD COLUMN IF NOT EXISTS packages_purchased INTEGER DEFAULT 1;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS total_boxes_processed INTEGER DEFAULT 0;

-- ============================================
-- Create cashback_blocked_records table
-- ============================================
CREATE TABLE IF NOT EXISTS cashback_blocked_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id TEXT NOT NULL REFERENCES partners(id),
  order_id TEXT NOT NULL,
  blocked_amount INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL DEFAULT 'insufficient_ly',
  ly_balance_at_time INTEGER NOT NULL DEFAULT 0,
  ly_required INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cashback_blocked_partner ON cashback_blocked_records(partner_id);
CREATE INDEX IF NOT EXISTS idx_cashback_blocked_order ON cashback_blocked_records(order_id);

-- RLS
ALTER TABLE cashback_blocked_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access cashback_blocked"
  ON cashback_blocked_records FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin'));

CREATE POLICY "Partner view own blocked records"
  ON cashback_blocked_records FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- ============================================
-- Rewrite: get_partner_cashback_rate
-- 2-tier: first (packages_purchased * 5) boxes = 50%, after = 30%
-- ============================================
CREATE OR REPLACE FUNCTION get_partner_cashback_rate(p_partner_id VARCHAR, p_current_box_count INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  v_packages INTEGER;
  v_fifty_pct_limit INTEGER;
BEGIN
  SELECT COALESCE(packages_purchased, 1) INTO v_packages
  FROM partners WHERE id = p_partner_id;

  v_fifty_pct_limit := v_packages * 5;

  IF p_current_box_count < v_fifty_pct_limit THEN
    RETURN 0.50;
  ELSE
    RETURN 0.30;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Rewrite: process_order_cashback
-- New logic:
-- 1. Find NEAREST upline partner -> direct cashback (50% or 30%)
--    LY deducted = cashback_amount / 100 (proportional)
-- 2. Up to 2 partner-referrers above direct -> 10% of direct cashback each
-- 3. RWA: direct partner +1, same-level +1
-- 4. LY replenishment: 10-layer network
-- ============================================
CREATE OR REPLACE FUNCTION process_order_cashback(p_order_id VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_box_count INTEGER;
  v_order_amount INTEGER;
  v_order_amount_rm NUMERIC;
  v_buyer_member_id VARCHAR;
  v_result JSONB := '[]'::JSONB;
  v_reward_entry JSONB;
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
  -- RWA vars
  v_current_cycle_id VARCHAR;
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

  -- Get current active bonus pool cycle for RWA
  SELECT id INTO v_current_cycle_id
  FROM bonus_pool_cycles
  WHERE status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- ========== STEP 1: Find NEAREST upline partner ==========
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

  IF v_direct_partner_id IS NULL THEN
    -- No upline partner found, still do LY replenishment and RWA pool contribution
    GOTO ly_replenishment;
  END IF;

  -- Calculate direct cashback rate
  v_direct_boxes_processed := COALESCE(v_direct_boxes_processed, 0);
  v_direct_packages := COALESCE(v_direct_packages, 1);
  v_direct_ly_balance := COALESCE(v_direct_ly_balance, 0);

  IF v_direct_boxes_processed < v_direct_packages * 5 THEN
    v_direct_rate := 0.50;
  ELSE
    v_direct_rate := 0.30;
  END IF;

  v_direct_cashback := FLOOR(v_order_amount * v_direct_rate);
  v_direct_ly_required := CEIL(v_direct_cashback::numeric / 100.0); -- 1 LY = RM 1

  -- Check LY balance
  IF v_direct_ly_balance < v_direct_ly_required THEN
    -- BLOCK: record in cashback_blocked_records
    INSERT INTO cashback_blocked_records (partner_id, order_id, blocked_amount, reason, ly_balance_at_time, ly_required)
    VALUES (v_direct_partner_id, p_order_id, v_direct_cashback, 'insufficient_ly', v_direct_ly_balance, v_direct_ly_required);
  ELSE
    -- Deduct LY proportionally
    UPDATE partners SET ly_balance = ly_balance - v_direct_ly_required WHERE id = v_direct_partner_id;

    INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
    VALUES (gen_random_uuid()::text, v_direct_partner_id, 'deduct', -v_direct_ly_required, p_order_id, 'cashback',
            'Cashback LY deduction (RM ' || (v_direct_cashback / 100.0)::numeric(10,2) || ')', NOW());

    -- Add to cash wallet
    UPDATE partners
    SET cash_wallet_balance = COALESCE(cash_wallet_balance, 0) + v_direct_cashback,
        total_boxes_processed = COALESCE(total_boxes_processed, 0) + v_box_count,
        total_cashback = COALESCE(total_cashback, 0) + v_direct_cashback
    WHERE id = v_direct_partner_id;

    INSERT INTO cash_wallet_ledger (id, partner_id, type, amount, reference_id, reference_type, status, description, created_at)
    VALUES (gen_random_uuid()::text, v_direct_partner_id, 'cashback', v_direct_cashback, p_order_id, 'order', 'completed',
            'Order cashback (Direct, Rate: ' || (v_direct_rate * 100)::integer || '%)', NOW());

    v_result := v_result || jsonb_build_object(
      'partner_id', v_direct_partner_id, 'type', 'direct',
      'rate', v_direct_rate, 'amount', v_direct_cashback, 'ly_deducted', v_direct_ly_required
    );
  END IF;

  -- RWA for direct partner
  IF v_current_cycle_id IS NOT NULL THEN
    UPDATE partners SET rwa_tokens = COALESCE(rwa_tokens, 0) + 1 WHERE id = v_direct_partner_id;
    INSERT INTO rwa_token_ledger (id, partner_id, cycle_id, tokens, source, order_id, created_at)
    VALUES (gen_random_uuid()::text, v_direct_partner_id, v_current_cycle_id, 1, 'network_order', p_order_id, NOW());
    UPDATE bonus_pool_cycles SET total_tokens = COALESCE(total_tokens, 0) + 1 WHERE id = v_current_cycle_id;
  END IF;

  -- ========== STEP 2: Same-level partner-referrers (up to 2 gen above direct) ==========
  v_current_partner_id := v_direct_partner_id;
  v_same_level_cashback := FLOOR(v_direct_cashback * 0.10); -- 10% of direct cashback

  FOR v_gen IN 1..2 LOOP
    -- Find the referrer of the current partner
    SELECT p2.referrer_id INTO v_parent_partner_id
    FROM partners p2 WHERE p2.id = v_current_partner_id;

    IF v_parent_partner_id IS NULL THEN EXIT; END IF;

    -- Get the parent partner info
    SELECT p3.id, p3.tier, p3.ly_balance
    INTO v_parent_partner_id, v_parent_partner_tier, v_parent_ly_balance
    FROM partners p3 WHERE p3.id = v_parent_partner_id AND p3.status = 'active';

    IF v_parent_partner_id IS NULL THEN EXIT; END IF;

    v_same_level_ly_required := CEIL(v_same_level_cashback::numeric / 100.0);

    IF COALESCE(v_parent_ly_balance, 0) < v_same_level_ly_required THEN
      -- Block
      INSERT INTO cashback_blocked_records (partner_id, order_id, blocked_amount, reason, ly_balance_at_time, ly_required)
      VALUES (v_parent_partner_id, p_order_id, v_same_level_cashback, 'insufficient_ly_same_level', COALESCE(v_parent_ly_balance, 0), v_same_level_ly_required);
    ELSE
      IF v_same_level_cashback > 0 THEN
        -- Deduct LY
        UPDATE partners SET ly_balance = ly_balance - v_same_level_ly_required WHERE id = v_parent_partner_id;

        INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
        VALUES (gen_random_uuid()::text, v_parent_partner_id, 'deduct', -v_same_level_ly_required, p_order_id, 'cashback',
                'Same-level cashback LY deduction (Gen ' || v_gen || ')', NOW());

        -- Add to cash wallet
        UPDATE partners
        SET cash_wallet_balance = COALESCE(cash_wallet_balance, 0) + v_same_level_cashback,
            total_cashback = COALESCE(total_cashback, 0) + v_same_level_cashback
        WHERE id = v_parent_partner_id;

        INSERT INTO cash_wallet_ledger (id, partner_id, type, amount, reference_id, reference_type, status, description, created_at)
        VALUES (gen_random_uuid()::text, v_parent_partner_id, 'cashback', v_same_level_cashback, p_order_id, 'order', 'completed',
                'Same-level cashback (Gen ' || v_gen || ', 10% of direct)', NOW());

        v_result := v_result || jsonb_build_object(
          'partner_id', v_parent_partner_id, 'type', 'same_level',
          'generation', v_gen, 'amount', v_same_level_cashback, 'ly_deducted', v_same_level_ly_required
        );
      END IF;
    END IF;

    -- RWA for same-level partner
    IF v_current_cycle_id IS NOT NULL THEN
      UPDATE partners SET rwa_tokens = COALESCE(rwa_tokens, 0) + 1 WHERE id = v_parent_partner_id;
      INSERT INTO rwa_token_ledger (id, partner_id, cycle_id, tokens, source, order_id, created_at)
      VALUES (gen_random_uuid()::text, v_parent_partner_id, v_current_cycle_id, 1, 'network_order', p_order_id, NOW());
      UPDATE bonus_pool_cycles SET total_tokens = COALESCE(total_tokens, 0) + 1 WHERE id = v_current_cycle_id;
    END IF;

    v_current_partner_id := v_parent_partner_id;
  END LOOP;

  -- ========== STEP 3: LY Replenishment ==========
  <<ly_replenishment>>
  v_current_member_id := v_buyer_member_id;

  FOR v_layer IN 1..10 LOOP
    SELECT referrer_id INTO v_referrer_id
    FROM members WHERE id = v_current_member_id;

    IF v_referrer_id IS NULL THEN EXIT; END IF;

    -- Check if referrer is a partner
    SELECT p.id, p.member_id INTO v_layer_partner
    FROM partners p
    WHERE p.member_id = v_referrer_id AND p.status = 'active';

    IF v_layer_partner.id IS NOT NULL THEN
      -- Calculate LY replenishment for this layer
      v_ly_replenish := FLOOR(v_order_amount_rm * v_ly_rates[v_layer] / 100.0);

      IF v_ly_replenish > 0 THEN
        UPDATE partners SET ly_balance = COALESCE(ly_balance, 0) + v_ly_replenish WHERE id = v_layer_partner.id;

        INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
        VALUES (gen_random_uuid()::text, v_layer_partner.id, 'replenish', v_ly_replenish, p_order_id, 'network_replenish',
                'Network LY replenishment (Layer ' || v_layer || ', ' || v_ly_rates[v_layer] || '%)', NOW());
      END IF;
    END IF;

    v_current_member_id := v_referrer_id;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'rewards', v_result
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Update the RWA trigger to NOT duplicate (since process_order_cashback now handles RWA)
-- We disable the old trigger; RWA is now inside process_order_cashback
-- ============================================
DROP TRIGGER IF EXISTS trg_order_rwa_reward ON orders;

-- ============================================
-- Grant permissions
-- ============================================
GRANT SELECT ON cashback_blocked_records TO authenticated;
GRANT INSERT ON cashback_blocked_records TO service_role;
