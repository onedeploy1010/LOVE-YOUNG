-- ============================================
-- 035: Three-Tier Member Roles & Referral Bonus Chain Penetration
-- ============================================
-- Changes:
-- 1. Rewrite trigger_partner_referral_bonus to traverse members.referrer_id chain.
--    All activated roles (member/partner/admin) qualify for referral bonus.
--    Only 'user' (未激活会员) is skipped.
-- 2. New users register as role='user', auto-upgrade to 'member' on first delivered order
--    (already handled by handle_order_delivered_member in migration 004).
--
-- Role hierarchy:
--   user    = 未激活会员 (just registered, no purchase)
--   member  = 激活会员 (first order delivered)
--   partner = 经营人 (purchased partner package)
--
-- Reward rules:
--   Sales cashback (process_order_cashback): partners only — no change needed.
--   Partner referral bonus: member/partner/admin all qualify for 10% direct / 5% indirect.
--     - Partner → cash_wallet (with LY deduction)
--     - Member/Admin without partner record → points_balance (no LY needed)

CREATE OR REPLACE FUNCTION trigger_partner_referral_bonus()
RETURNS TRIGGER AS $$
DECLARE
  v_payment_amount NUMERIC;
  v_payment_rm NUMERIC;
  v_new_partner_name VARCHAR;
  v_new_partner_member_id VARCHAR;
  -- Chain traversal
  v_current_member_id VARCHAR;
  v_referrer_member_id VARCHAR;
  v_referrer_role VARCHAR;
  v_layer INTEGER;
  v_found_count INTEGER := 0;
  -- Found partner vars (for partners with partner record)
  v_found_partner RECORD;
  v_bonus NUMERIC;
  v_ly_required INTEGER;
  v_bonus_type VARCHAR;
  v_bonus_rate NUMERIC;
BEGIN
  v_payment_amount := COALESCE(NEW.payment_amount, 0);

  IF v_payment_amount <= 0 THEN
    RETURN NEW;
  END IF;

  -- Get new partner's member name and member_id
  SELECT COALESCE(m.name, m.email, '未知'), m.id
  INTO v_new_partner_name, v_new_partner_member_id
  FROM members m WHERE m.id = NEW.member_id;

  v_payment_rm := v_payment_amount / 100.0;

  -- Start from new partner's member record, walk up the members.referrer_id chain
  v_current_member_id := v_new_partner_member_id;

  FOR v_layer IN 1..10 LOOP
    -- Get referrer_id and role from members table
    SELECT referrer_id, role INTO v_referrer_member_id, v_referrer_role
    FROM members WHERE id = v_current_member_id;

    -- No more referrers in chain
    IF v_referrer_member_id IS NULL THEN
      EXIT;
    END IF;

    -- Re-fetch the referrer's own role (the SELECT above gets the current node's referrer)
    SELECT role INTO v_referrer_role
    FROM members WHERE id = v_referrer_member_id;

    -- Skip 'user' (未激活会员) — only member/partner/admin qualify
    IF v_referrer_role IS NOT NULL AND v_referrer_role != 'user' THEN
      v_found_count := v_found_count + 1;

      IF v_found_count = 1 THEN
        v_bonus_rate := 0.10;
        v_bonus_type := '直推奖金';
      ELSIF v_found_count = 2 THEN
        v_bonus_rate := 0.05;
        v_bonus_type := '间推奖金';
      END IF;

      v_bonus := FLOOR(v_payment_amount * v_bonus_rate);

      -- Check if referrer has an active partner record
      SELECT p.* INTO v_found_partner
      FROM partners p
      WHERE p.member_id = v_referrer_member_id AND p.status = 'active';

      IF v_found_partner.id IS NOT NULL THEN
        -- ===== PARTNER: cash_wallet + LY deduction =====
        v_ly_required := CEIL(v_bonus / 100.0);

        IF COALESCE(v_found_partner.ly_balance, 0) >= v_ly_required THEN
          -- Deduct LY
          UPDATE partners SET ly_balance = ly_balance - v_ly_required
          WHERE id = v_found_partner.id;

          -- Add to cash wallet
          UPDATE partners
          SET cash_wallet_balance = COALESCE(cash_wallet_balance, 0) + v_bonus::integer
          WHERE id = v_found_partner.id;

          -- Record LY deduction
          INSERT INTO ly_points_ledger (id, partner_id, type, points, reference_id, reference_type, description, created_at)
          VALUES (gen_random_uuid()::text, v_found_partner.id, 'deduct', -v_ly_required, NEW.id, 'referral_bonus',
                  v_bonus_type || 'LY扣除 - ' || v_new_partner_name || ' 加入经营人 (RM' || v_payment_rm::numeric(10,0) || ' 配套, 奖金RM' || (v_bonus/100.0)::numeric(10,2) || ')', NOW());

          -- Record cash wallet income
          INSERT INTO cash_wallet_ledger (id, partner_id, type, amount, reference_id, reference_type, status, description, created_at)
          VALUES (gen_random_uuid()::text, v_found_partner.id, 'referral', v_bonus::integer, NEW.id, 'partner_join', 'completed',
                  v_bonus_type || ' - ' || v_new_partner_name || ' 加入经营人 (RM' || v_payment_rm::numeric(10,0) || ' 配套, ' || (v_bonus_rate * 100)::integer || '%)', NOW());
        ELSE
          -- Block: insufficient LY
          INSERT INTO cashback_blocked_records (partner_id, order_id, blocked_amount, reason, ly_balance_at_time, ly_required)
          VALUES (v_found_partner.id, NEW.id, v_bonus::integer, 'insufficient_ly_referral', COALESCE(v_found_partner.ly_balance, 0), v_ly_required);
        END IF;

      ELSE
        -- ===== MEMBER/ADMIN (no partner record): credit to points_balance =====
        UPDATE members
        SET points_balance = COALESCE(points_balance, 0) + v_bonus::integer
        WHERE id = v_referrer_member_id;
      END IF;

      -- Exit after finding 2 qualifying referrers
      IF v_found_count >= 2 THEN
        EXIT;
      END IF;
    END IF;

    -- Move up the chain
    v_current_member_id := v_referrer_member_id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
