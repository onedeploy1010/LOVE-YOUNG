-- ============================================
-- Test Referral Network Seed Data
-- ============================================
-- Creates 20 test downline members under one_deploy@hotmail.com
-- with mixed roles (6 partners + 14 members) at 4 levels,
-- then creates 8 test orders and delivers them to verify
-- cashback, RWA, LY replenishment, and bonus pool calculations.
--
-- Tree Structure:
-- Root: one_deploy@hotmail.com (Partner Phase 3)
-- ├── A1 (Partner Phase 1)
-- │   ├── B1 (Partner Phase 1)
-- │   │   ├── C1 (member)
-- │   │   ├── C2 (member)
-- │   │   └── C3 (member)
-- │   ├── B2 (member)
-- │   │   └── C4 (member)
-- │   └── B3 (Partner Phase 2)
-- │       ├── C5 (member)
-- │       └── C6 (Partner Phase 1)
-- │           └── D1 (member)
-- ├── A2 (member)
-- │   ├── B4 (member)
-- │   └── B5 (member)
-- ├── A3 (Partner Phase 2)
-- │   ├── B6 (member)
-- │   └── B7 (Partner Phase 1)
-- │       └── C7 (member)
-- └── A4 (member)
--     └── B8 (member)
--
-- Total: 20 downline members (A1-A4, B1-B8, C1-C7, D1)
-- Partners: A1, A3, B1, B3, B7, C6 (6 partners)
-- Members: A2, A4, B2, B4, B5, B6, B8, C1, C2, C3, C4, C5, C7, D1 (14 members)

-- ============================================
-- STEP 0: Clean up any previous test data
-- ============================================
DELETE FROM cash_wallet_ledger WHERE partner_id IN (SELECT id FROM partners WHERE member_id IN (SELECT id FROM members WHERE email LIKE '%@loveyoung.test'));
DELETE FROM ly_points_ledger WHERE partner_id IN (SELECT id FROM partners WHERE member_id IN (SELECT id FROM members WHERE email LIKE '%@loveyoung.test'));
DELETE FROM rwa_token_ledger WHERE partner_id IN (SELECT id FROM partners WHERE member_id IN (SELECT id FROM members WHERE email LIKE '%@loveyoung.test'));
DELETE FROM cashback_blocked_records WHERE partner_id IN (SELECT id FROM partners WHERE member_id IN (SELECT id FROM members WHERE email LIKE '%@loveyoung.test'));
DELETE FROM monthly_cashback_tracking WHERE partner_id IN (SELECT id FROM partners WHERE member_id IN (SELECT id FROM members WHERE email LIKE '%@loveyoung.test'));
DELETE FROM orders WHERE customer_email LIKE '%@loveyoung.test';
DELETE FROM partners WHERE member_id IN (SELECT id FROM members WHERE email LIKE '%@loveyoung.test');
DELETE FROM notifications WHERE user_id IN (SELECT user_id FROM members WHERE email LIKE '%@loveyoung.test');
DELETE FROM members WHERE email LIKE '%@loveyoung.test';
DELETE FROM users WHERE email LIKE '%@loveyoung.test';

-- ============================================
-- STEP 1: Create test members and partners
-- ============================================
DO $$
DECLARE
  -- Root
  v_root_member_id VARCHAR;
  v_root_partner_id VARCHAR;
  v_root_user_id VARCHAR;
  -- Level 1
  v_a1_id VARCHAR; v_a1_uid VARCHAR; v_a1_partner_id VARCHAR;
  v_a2_id VARCHAR; v_a2_uid VARCHAR;
  v_a3_id VARCHAR; v_a3_uid VARCHAR; v_a3_partner_id VARCHAR;
  v_a4_id VARCHAR; v_a4_uid VARCHAR;
  -- Level 2
  v_b1_id VARCHAR; v_b1_uid VARCHAR; v_b1_partner_id VARCHAR;
  v_b2_id VARCHAR; v_b2_uid VARCHAR;
  v_b3_id VARCHAR; v_b3_uid VARCHAR; v_b3_partner_id VARCHAR;
  v_b4_id VARCHAR; v_b4_uid VARCHAR;
  v_b5_id VARCHAR; v_b5_uid VARCHAR;
  v_b6_id VARCHAR; v_b6_uid VARCHAR;
  v_b7_id VARCHAR; v_b7_uid VARCHAR; v_b7_partner_id VARCHAR;
  v_b8_id VARCHAR; v_b8_uid VARCHAR;
  -- Level 3
  v_c1_id VARCHAR; v_c1_uid VARCHAR;
  v_c2_id VARCHAR; v_c2_uid VARCHAR;
  v_c3_id VARCHAR; v_c3_uid VARCHAR;
  v_c4_id VARCHAR; v_c4_uid VARCHAR;
  v_c5_id VARCHAR; v_c5_uid VARCHAR;
  v_c6_id VARCHAR; v_c6_uid VARCHAR; v_c6_partner_id VARCHAR;
  v_c7_id VARCHAR; v_c7_uid VARCHAR;
  -- Level 4
  v_d1_id VARCHAR; v_d1_uid VARCHAR;
  -- Orders
  v_order_id VARCHAR;
  v_items_json TEXT;
BEGIN
  -- ========== Find root member ==========
  SELECT id, user_id INTO v_root_member_id, v_root_user_id
  FROM members WHERE email = 'one_deploy@hotmail.com'
  LIMIT 1;

  IF v_root_member_id IS NULL THEN
    RAISE NOTICE 'Root member one_deploy@hotmail.com not found. Creating one...';
    v_root_user_id := gen_random_uuid()::text;
    INSERT INTO members (id, user_id, name, email, role, referral_code, points_balance, created_at)
    VALUES (gen_random_uuid()::text, v_root_user_id, 'Root Partner', 'one_deploy@hotmail.com', 'partner', 'LYROOT1', 0, NOW())
    RETURNING id INTO v_root_member_id;
  END IF;

  -- Ensure root is a partner
  SELECT id INTO v_root_partner_id FROM partners WHERE member_id = v_root_member_id;
  IF v_root_partner_id IS NULL THEN
    INSERT INTO partners (id, member_id, user_id, tier, status, ly_balance, cash_wallet_balance, rwa_tokens,
                          total_sales, total_cashback, total_boxes_processed, packages_purchased, payment_amount, created_at)
    VALUES (gen_random_uuid()::text, v_root_member_id, v_root_user_id, 'phase3', 'active', 3000, 0, 1, 0, 0, 0, 1, 150000, NOW())
    RETURNING id INTO v_root_partner_id;
  ELSE
    -- Make sure root has enough LY for testing
    UPDATE partners SET ly_balance = GREATEST(COALESCE(ly_balance, 0), 3000), status = 'active' WHERE id = v_root_partner_id;
  END IF;

  -- Make sure root member role is partner
  UPDATE members SET role = 'partner' WHERE id = v_root_member_id AND role != 'admin';

  RAISE NOTICE 'Root: member_id=%, partner_id=%', v_root_member_id, v_root_partner_id;

  -- ========== Helper: create user + member + (optional) partner ==========
  -- We need users table entries first due to FK constraint

  -- ========== Create Level 1 ==========
  -- A1: Partner Phase 1
  v_a1_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_a1_uid, 'test_a1@loveyoung.test', 'Test', 'A1 Partner', 'user', NOW() - INTERVAL '30 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_a1_uid, 'Test A1 Partner', 'test_a1@loveyoung.test', '601100001', 'partner', 'LYTSTA1', v_root_member_id, 0, NOW() - INTERVAL '30 days')
  RETURNING id INTO v_a1_id;
  INSERT INTO partners (id, member_id, user_id, referrer_id, tier, status, ly_balance, cash_wallet_balance, rwa_tokens,
                         total_sales, total_cashback, total_boxes_processed, packages_purchased, payment_amount, created_at)
  VALUES (gen_random_uuid()::text, v_a1_id, v_a1_uid, v_root_partner_id, 'phase1', 'active', 2000, 0, 1, 0, 0, 0, 1, 100000, NOW() - INTERVAL '30 days')
  RETURNING id INTO v_a1_partner_id;

  -- A2: Member (not a partner)
  v_a2_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_a2_uid, 'test_a2@loveyoung.test', 'Test', 'A2 Member', 'user', NOW() - INTERVAL '28 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_a2_uid, 'Test A2 Member', 'test_a2@loveyoung.test', '601100002', 'member', 'LYTSTA2', v_root_member_id, 0, NOW() - INTERVAL '28 days')
  RETURNING id INTO v_a2_id;

  -- A3: Partner Phase 2
  v_a3_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_a3_uid, 'test_a3@loveyoung.test', 'Test', 'A3 Partner', 'user', NOW() - INTERVAL '25 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_a3_uid, 'Test A3 Partner', 'test_a3@loveyoung.test', '601100003', 'partner', 'LYTSTA3', v_root_member_id, 0, NOW() - INTERVAL '25 days')
  RETURNING id INTO v_a3_id;
  INSERT INTO partners (id, member_id, user_id, referrer_id, tier, status, ly_balance, cash_wallet_balance, rwa_tokens,
                         total_sales, total_cashback, total_boxes_processed, packages_purchased, payment_amount, created_at)
  VALUES (gen_random_uuid()::text, v_a3_id, v_a3_uid, v_root_partner_id, 'phase2', 'active', 2600, 0, 1, 0, 0, 0, 1, 130000, NOW() - INTERVAL '25 days')
  RETURNING id INTO v_a3_partner_id;

  -- A4: Member (not a partner)
  v_a4_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_a4_uid, 'test_a4@loveyoung.test', 'Test', 'A4 Member', 'user', NOW() - INTERVAL '20 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_a4_uid, 'Test A4 Member', 'test_a4@loveyoung.test', '601100004', 'member', 'LYTSTA4', v_root_member_id, 0, NOW() - INTERVAL '20 days')
  RETURNING id INTO v_a4_id;

  -- ========== Create Level 2 ==========
  -- B1: Partner Phase 1, referred by A1
  v_b1_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_b1_uid, 'test_b1@loveyoung.test', 'Test', 'B1 Partner', 'user', NOW() - INTERVAL '20 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_b1_uid, 'Test B1 Partner', 'test_b1@loveyoung.test', '601200001', 'partner', 'LYTSTB1', v_a1_id, 0, NOW() - INTERVAL '20 days')
  RETURNING id INTO v_b1_id;
  INSERT INTO partners (id, member_id, user_id, referrer_id, tier, status, ly_balance, cash_wallet_balance, rwa_tokens,
                         total_sales, total_cashback, total_boxes_processed, packages_purchased, payment_amount, created_at)
  VALUES (gen_random_uuid()::text, v_b1_id, v_b1_uid, v_a1_partner_id, 'phase1', 'active', 2000, 0, 1, 0, 0, 0, 1, 100000, NOW() - INTERVAL '20 days')
  RETURNING id INTO v_b1_partner_id;

  -- B2: Member, referred by A1
  v_b2_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_b2_uid, 'test_b2@loveyoung.test', 'Test', 'B2 Member', 'user', NOW() - INTERVAL '18 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_b2_uid, 'Test B2 Member', 'test_b2@loveyoung.test', '601200002', 'member', 'LYTSTB2', v_a1_id, 0, NOW() - INTERVAL '18 days')
  RETURNING id INTO v_b2_id;

  -- B3: Partner Phase 2, referred by A1
  v_b3_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_b3_uid, 'test_b3@loveyoung.test', 'Test', 'B3 Partner', 'user', NOW() - INTERVAL '18 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_b3_uid, 'Test B3 Partner', 'test_b3@loveyoung.test', '601200003', 'partner', 'LYTSTB3', v_a1_id, 0, NOW() - INTERVAL '18 days')
  RETURNING id INTO v_b3_id;
  INSERT INTO partners (id, member_id, user_id, referrer_id, tier, status, ly_balance, cash_wallet_balance, rwa_tokens,
                         total_sales, total_cashback, total_boxes_processed, packages_purchased, payment_amount, created_at)
  VALUES (gen_random_uuid()::text, v_b3_id, v_b3_uid, v_a1_partner_id, 'phase2', 'active', 2600, 0, 1, 0, 0, 0, 1, 130000, NOW() - INTERVAL '18 days')
  RETURNING id INTO v_b3_partner_id;

  -- B4: Member, referred by A2
  v_b4_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_b4_uid, 'test_b4@loveyoung.test', 'Test', 'B4 Member', 'user', NOW() - INTERVAL '15 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_b4_uid, 'Test B4 Member', 'test_b4@loveyoung.test', '601200004', 'member', 'LYTSTB4', v_a2_id, 0, NOW() - INTERVAL '15 days')
  RETURNING id INTO v_b4_id;

  -- B5: Member, referred by A2
  v_b5_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_b5_uid, 'test_b5@loveyoung.test', 'Test', 'B5 Member', 'user', NOW() - INTERVAL '15 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_b5_uid, 'Test B5 Member', 'test_b5@loveyoung.test', '601200005', 'member', 'LYTSTB5', v_a2_id, 0, NOW() - INTERVAL '15 days')
  RETURNING id INTO v_b5_id;

  -- B6: Member, referred by A3
  v_b6_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_b6_uid, 'test_b6@loveyoung.test', 'Test', 'B6 Member', 'user', NOW() - INTERVAL '12 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_b6_uid, 'Test B6 Member', 'test_b6@loveyoung.test', '601200006', 'member', 'LYTSTB6', v_a3_id, 0, NOW() - INTERVAL '12 days')
  RETURNING id INTO v_b6_id;

  -- B7: Partner Phase 1, referred by A3
  v_b7_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_b7_uid, 'test_b7@loveyoung.test', 'Test', 'B7 Partner', 'user', NOW() - INTERVAL '12 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_b7_uid, 'Test B7 Partner', 'test_b7@loveyoung.test', '601200007', 'partner', 'LYTSTB7', v_a3_id, 0, NOW() - INTERVAL '12 days')
  RETURNING id INTO v_b7_id;
  INSERT INTO partners (id, member_id, user_id, referrer_id, tier, status, ly_balance, cash_wallet_balance, rwa_tokens,
                         total_sales, total_cashback, total_boxes_processed, packages_purchased, payment_amount, created_at)
  VALUES (gen_random_uuid()::text, v_b7_id, v_b7_uid, v_a3_partner_id, 'phase1', 'active', 2000, 0, 1, 0, 0, 0, 1, 100000, NOW() - INTERVAL '12 days')
  RETURNING id INTO v_b7_partner_id;

  -- B8: Member, referred by A4
  v_b8_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_b8_uid, 'test_b8@loveyoung.test', 'Test', 'B8 Member', 'user', NOW() - INTERVAL '10 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_b8_uid, 'Test B8 Member', 'test_b8@loveyoung.test', '601200008', 'member', 'LYTSTB8', v_a4_id, 0, NOW() - INTERVAL '10 days')
  RETURNING id INTO v_b8_id;

  -- ========== Create Level 3 ==========
  -- C1-C3: Members, referred by B1
  v_c1_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_c1_uid, 'test_c1@loveyoung.test', 'Test', 'C1 Member', 'user', NOW() - INTERVAL '10 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_c1_uid, 'Test C1 Member', 'test_c1@loveyoung.test', '601300001', 'member', 'LYTSTC1', v_b1_id, 0, NOW() - INTERVAL '10 days')
  RETURNING id INTO v_c1_id;

  v_c2_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_c2_uid, 'test_c2@loveyoung.test', 'Test', 'C2 Member', 'user', NOW() - INTERVAL '9 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_c2_uid, 'Test C2 Member', 'test_c2@loveyoung.test', '601300002', 'member', 'LYTSTC2', v_b1_id, 0, NOW() - INTERVAL '9 days')
  RETURNING id INTO v_c2_id;

  v_c3_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_c3_uid, 'test_c3@loveyoung.test', 'Test', 'C3 Member', 'user', NOW() - INTERVAL '8 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_c3_uid, 'Test C3 Member', 'test_c3@loveyoung.test', '601300003', 'member', 'LYTSTC3', v_b1_id, 0, NOW() - INTERVAL '8 days')
  RETURNING id INTO v_c3_id;

  -- C4: Member, referred by B2
  v_c4_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_c4_uid, 'test_c4@loveyoung.test', 'Test', 'C4 Member', 'user', NOW() - INTERVAL '8 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_c4_uid, 'Test C4 Member', 'test_c4@loveyoung.test', '601300004', 'member', 'LYTSTC4', v_b2_id, 0, NOW() - INTERVAL '8 days')
  RETURNING id INTO v_c4_id;

  -- C5: Member, referred by B3
  v_c5_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_c5_uid, 'test_c5@loveyoung.test', 'Test', 'C5 Member', 'user', NOW() - INTERVAL '7 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_c5_uid, 'Test C5 Member', 'test_c5@loveyoung.test', '601300005', 'member', 'LYTSTC5', v_b3_id, 0, NOW() - INTERVAL '7 days')
  RETURNING id INTO v_c5_id;

  -- C6: Partner Phase 1, referred by B3
  v_c6_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_c6_uid, 'test_c6@loveyoung.test', 'Test', 'C6 Partner', 'user', NOW() - INTERVAL '7 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_c6_uid, 'Test C6 Partner', 'test_c6@loveyoung.test', '601300006', 'partner', 'LYTSTC6', v_b3_id, 0, NOW() - INTERVAL '7 days')
  RETURNING id INTO v_c6_id;
  INSERT INTO partners (id, member_id, user_id, referrer_id, tier, status, ly_balance, cash_wallet_balance, rwa_tokens,
                         total_sales, total_cashback, total_boxes_processed, packages_purchased, payment_amount, created_at)
  VALUES (gen_random_uuid()::text, v_c6_id, v_c6_uid, v_b3_partner_id, 'phase1', 'active', 2000, 0, 1, 0, 0, 0, 1, 100000, NOW() - INTERVAL '7 days')
  RETURNING id INTO v_c6_partner_id;

  -- C7: Member, referred by B7
  v_c7_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_c7_uid, 'test_c7@loveyoung.test', 'Test', 'C7 Member', 'user', NOW() - INTERVAL '5 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_c7_uid, 'Test C7 Member', 'test_c7@loveyoung.test', '601300007', 'member', 'LYTSTC7', v_b7_id, 0, NOW() - INTERVAL '5 days')
  RETURNING id INTO v_c7_id;

  -- ========== Create Level 4 ==========
  -- D1: Member, referred by C6
  v_d1_uid := gen_random_uuid()::text;
  INSERT INTO users (id, email, first_name, last_name, role, created_at) VALUES (v_d1_uid, 'test_d1@loveyoung.test', 'Test', 'D1 Member', 'user', NOW() - INTERVAL '3 days');
  INSERT INTO members (id, user_id, name, email, phone, role, referral_code, referrer_id, points_balance, created_at)
  VALUES (gen_random_uuid()::text, v_d1_uid, 'Test D1 Member', 'test_d1@loveyoung.test', '601400001', 'member', 'LYTSTD1', v_c6_id, 0, NOW() - INTERVAL '3 days')
  RETURNING id INTO v_d1_id;

  RAISE NOTICE '=== 20 test members created ===';
  RAISE NOTICE 'Partners: A1(%), A3(%), B1(%), B3(%), B7(%), C6(%)',
    v_a1_partner_id, v_a3_partner_id, v_b1_partner_id, v_b3_partner_id, v_b7_partner_id, v_c6_partner_id;

  -- ========== STEP 2: Create test orders ==========
  -- Order items JSON (1 gift box at RM 368)
  v_items_json := '[{"product_id":"giftbox-2026-fortune","sku":"GIFTBOX-2026-FORTUNE","name":"2026 Fortune Gift Box","price":36800,"quantity":1}]';

  -- ORDER 1: C1 orders (chain: C1 → B1(partner) → A1(partner) → Root(partner))
  -- Expected: B1 gets 50% direct = RM 184, A1 gets 10% = RM 18.40, Root gets 10% = RM 18.40
  INSERT INTO orders (id, order_number, user_id, member_id, customer_name, customer_phone, customer_email,
                      status, total_amount, items, created_at, updated_at)
  VALUES (gen_random_uuid()::text, 'LYTEST0001', v_c1_uid, v_c1_id, 'Test C1', '601300001', 'test_c1@loveyoung.test',
          'pending', 36800, v_items_json, NOW(), NOW())
  RETURNING id INTO v_order_id;
  UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = v_order_id;
  RAISE NOTICE 'Order 1 (C1→B1→A1→Root): %', v_order_id;

  -- ORDER 2: D1 orders (chain: D1 → C6(partner) → B3(partner.ref) → A1(partner.ref))
  -- Expected: C6 gets 50% direct = RM 184, B3 gets 10% = RM 18.40, A1 gets 10% = RM 18.40
  INSERT INTO orders (id, order_number, user_id, member_id, customer_name, customer_phone, customer_email,
                      status, total_amount, items, created_at, updated_at)
  VALUES (gen_random_uuid()::text, 'LYTEST0002', v_d1_uid, v_d1_id, 'Test D1', '601400001', 'test_d1@loveyoung.test',
          'pending', 36800, v_items_json, NOW(), NOW())
  RETURNING id INTO v_order_id;
  UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = v_order_id;
  RAISE NOTICE 'Order 2 (D1→C6→B3→A1): %', v_order_id;

  -- ORDER 3: B4 orders (chain: B4 → A2(member, not partner) → Root(partner))
  -- Expected: Root gets 50% direct = RM 184, no same-level above root
  INSERT INTO orders (id, order_number, user_id, member_id, customer_name, customer_phone, customer_email,
                      status, total_amount, items, created_at, updated_at)
  VALUES (gen_random_uuid()::text, 'LYTEST0003', v_b4_uid, v_b4_id, 'Test B4', '601200004', 'test_b4@loveyoung.test',
          'pending', 36800, v_items_json, NOW(), NOW())
  RETURNING id INTO v_order_id;
  UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = v_order_id;
  RAISE NOTICE 'Order 3 (B4→A2(skip)→Root): %', v_order_id;

  -- ORDER 4: C4 orders (chain: C4 → B2(member, not partner) → A1(partner) → Root(partner))
  -- Expected: A1 gets 50% direct = RM 184, Root gets 10% = RM 18.40
  INSERT INTO orders (id, order_number, user_id, member_id, customer_name, customer_phone, customer_email,
                      status, total_amount, items, created_at, updated_at)
  VALUES (gen_random_uuid()::text, 'LYTEST0004', v_c4_uid, v_c4_id, 'Test C4', '601300004', 'test_c4@loveyoung.test',
          'pending', 36800, v_items_json, NOW(), NOW())
  RETURNING id INTO v_order_id;
  UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = v_order_id;
  RAISE NOTICE 'Order 4 (C4→B2(skip)→A1→Root): %', v_order_id;

  -- ORDER 5: A2 orders (chain: A2 → Root(partner))
  -- Expected: Root gets 50% direct = RM 184, no same-level above
  INSERT INTO orders (id, order_number, user_id, member_id, customer_name, customer_phone, customer_email,
                      status, total_amount, items, created_at, updated_at)
  VALUES (gen_random_uuid()::text, 'LYTEST0005', v_a2_uid, v_a2_id, 'Test A2', '601100002', 'test_a2@loveyoung.test',
          'pending', 36800, v_items_json, NOW(), NOW())
  RETURNING id INTO v_order_id;
  UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = v_order_id;
  RAISE NOTICE 'Order 5 (A2→Root): %', v_order_id;

  -- ORDER 6: B6 orders (chain: B6 → A3(partner) → Root(partner))
  -- Expected: A3 gets 50% direct = RM 184, Root gets 10% = RM 18.40
  INSERT INTO orders (id, order_number, user_id, member_id, customer_name, customer_phone, customer_email,
                      status, total_amount, items, created_at, updated_at)
  VALUES (gen_random_uuid()::text, 'LYTEST0006', v_b6_uid, v_b6_id, 'Test B6', '601200006', 'test_b6@loveyoung.test',
          'pending', 36800, v_items_json, NOW(), NOW())
  RETURNING id INTO v_order_id;
  UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = v_order_id;
  RAISE NOTICE 'Order 6 (B6→A3→Root): %', v_order_id;

  -- ORDER 7: C7 orders (chain: C7 → B7(partner) → A3(partner) → Root(partner))
  -- Expected: B7 gets 50% direct = RM 184, A3 gets 10% = RM 18.40, Root gets 10% = RM 18.40
  INSERT INTO orders (id, order_number, user_id, member_id, customer_name, customer_phone, customer_email,
                      status, total_amount, items, created_at, updated_at)
  VALUES (gen_random_uuid()::text, 'LYTEST0007', v_c7_uid, v_c7_id, 'Test C7', '601300007', 'test_c7@loveyoung.test',
          'pending', 36800, v_items_json, NOW(), NOW())
  RETURNING id INTO v_order_id;
  UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = v_order_id;
  RAISE NOTICE 'Order 7 (C7→B7→A3→Root): %', v_order_id;

  -- ORDER 8: B8 orders (chain: B8 → A4(member, not partner) → Root(partner))
  -- Expected: Root gets 50% direct = RM 184, no same-level above
  INSERT INTO orders (id, order_number, user_id, member_id, customer_name, customer_phone, customer_email,
                      status, total_amount, items, created_at, updated_at)
  VALUES (gen_random_uuid()::text, 'LYTEST0008', v_b8_uid, v_b8_id, 'Test B8', '601200008', 'test_b8@loveyoung.test',
          'pending', 36800, v_items_json, NOW(), NOW())
  RETURNING id INTO v_order_id;
  UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = v_order_id;
  RAISE NOTICE 'Order 8 (B8→A4(skip)→Root): %', v_order_id;

  RAISE NOTICE '=== 8 test orders created and delivered ===';
END $$;

-- ============================================
-- STEP 3: Verification Queries
-- ============================================

-- 3a. Partner balances after all 8 orders
SELECT '=== PARTNER BALANCES ===' as section;
SELECT
  m.name,
  m.email,
  p.tier,
  p.ly_balance as ly_points,
  p.cash_wallet_balance as cash_wallet_cents,
  (p.cash_wallet_balance / 100.0)::numeric(10,2) as cash_wallet_rm,
  p.rwa_tokens,
  p.total_boxes_processed,
  p.total_cashback as total_cashback_cents,
  (p.total_cashback / 100.0)::numeric(10,2) as total_cashback_rm
FROM partners p
JOIN members m ON m.id = p.member_id
WHERE m.email = 'one_deploy@hotmail.com' OR m.email LIKE '%@loveyoung.test'
ORDER BY m.created_at;

-- 3b. Cash wallet ledger entries
SELECT '=== CASH WALLET LEDGER ===' as section;
SELECT
  m.name as partner_name,
  cwl.type,
  cwl.amount as amount_cents,
  (cwl.amount / 100.0)::numeric(10,2) as amount_rm,
  cwl.description,
  cwl.created_at
FROM cash_wallet_ledger cwl
JOIN partners p ON p.id = cwl.partner_id
JOIN members m ON m.id = p.member_id
WHERE m.email = 'one_deploy@hotmail.com' OR m.email LIKE '%@loveyoung.test'
ORDER BY cwl.created_at;

-- 3c. RWA token ledger
SELECT '=== RWA TOKEN LEDGER ===' as section;
SELECT
  m.name as partner_name,
  rtl.tokens,
  rtl.source,
  o.order_number,
  rtl.created_at
FROM rwa_token_ledger rtl
JOIN partners p ON p.id = rtl.partner_id
JOIN members m ON m.id = p.member_id
LEFT JOIN orders o ON o.id = rtl.order_id
WHERE m.email = 'one_deploy@hotmail.com' OR m.email LIKE '%@loveyoung.test'
ORDER BY rtl.created_at;

-- 3d. LY points ledger (replenishments and deductions)
SELECT '=== LY POINTS LEDGER ===' as section;
SELECT
  m.name as partner_name,
  lpl.type,
  lpl.points,
  lpl.reference_type,
  lpl.description,
  lpl.created_at
FROM ly_points_ledger lpl
JOIN partners p ON p.id = lpl.partner_id
JOIN members m ON m.id = p.member_id
WHERE m.email = 'one_deploy@hotmail.com' OR m.email LIKE '%@loveyoung.test'
ORDER BY lpl.created_at;

-- 3e. Bonus pool cycle status
SELECT '=== BONUS POOL CYCLES ===' as section;
SELECT
  cycle_number,
  status,
  total_sales as total_sales_cents,
  (total_sales / 100.0)::numeric(10,2) as total_sales_rm,
  pool_amount as pool_cents,
  (pool_amount / 100.0)::numeric(10,2) as pool_rm,
  total_tokens as rwa_tokens_in_pool,
  start_date,
  end_date
FROM bonus_pool_cycles
ORDER BY created_at DESC
LIMIT 5;

-- 3f. Any blocked cashback records
SELECT '=== BLOCKED CASHBACK RECORDS ===' as section;
SELECT
  m.name as partner_name,
  cbr.blocked_amount as blocked_cents,
  (cbr.blocked_amount / 100.0)::numeric(10,2) as blocked_rm,
  cbr.reason,
  cbr.ly_balance_at_time,
  cbr.ly_required,
  o.order_number
FROM cashback_blocked_records cbr
JOIN partners p ON p.id = cbr.partner_id
JOIN members m ON m.id = p.member_id
LEFT JOIN orders o ON o.id = cbr.order_id
WHERE m.email = 'one_deploy@hotmail.com' OR m.email LIKE '%@loveyoung.test'
ORDER BY cbr.created_at;

-- 3g. Summary: Expected vs Actual
SELECT '=== EXPECTED RESULTS SUMMARY ===' as section;
SELECT
  m.name,
  p.cash_wallet_balance as actual_cash_cents,
  p.rwa_tokens as actual_rwa,
  p.total_boxes_processed as actual_boxes,
  CASE m.email
    -- Root: direct cashback from orders 3,5,8 (3x RM184=RM552)
    --       + regional from orders 1,4,6,7 (4x RM18.40=RM73.60)
    --       = RM625.60 = 62560 cents
    WHEN 'one_deploy@hotmail.com' THEN '~62560 cents (3 direct + 4 regional)'
    -- A1: direct cashback from order 4 (RM184)
    --     + regional from orders 1,2 (2x RM18.40=RM36.80)
    --     = RM220.80 = 22080 cents
    WHEN 'test_a1@loveyoung.test' THEN '~22080 cents (1 direct + 2 regional)'
    -- A3: direct from order 6 (RM184) + regional from order 7 (RM18.40)
    --     = RM202.40 = 20240 cents
    WHEN 'test_a3@loveyoung.test' THEN '~20240 cents (1 direct + 1 regional)'
    -- B1: direct from order 1 (RM184) = 18400 cents
    WHEN 'test_b1@loveyoung.test' THEN '~18400 cents (1 direct)'
    -- B3: regional from order 2 (RM18.40) = 1840 cents
    WHEN 'test_b3@loveyoung.test' THEN '~1840 cents (1 regional)'
    -- B7: direct from order 7 (RM184) = 18400 cents
    WHEN 'test_b7@loveyoung.test' THEN '~18400 cents (1 direct)'
    -- C6: direct from order 2 (RM184) = 18400 cents
    WHEN 'test_c6@loveyoung.test' THEN '~18400 cents (1 direct)'
    ELSE 'N/A (not a partner)'
  END as expected_cash
FROM members m
LEFT JOIN partners p ON p.member_id = m.id
WHERE m.email = 'one_deploy@hotmail.com' OR m.email LIKE '%@loveyoung.test'
ORDER BY m.created_at;
