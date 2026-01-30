-- Migration 010: Fix member INSERT permission + set one_deploy admin/partner
--
-- Issues:
--   1. Members table GRANT only has SELECT/UPDATE for authenticated — missing INSERT.
--      This causes 403 when createOrGetMember() tries to insert a new member.
--   2. one_deploy@hotmail.com should be admin+partner but only shows as member.

BEGIN;

-- ============================================================
-- 1. FIX: Grant INSERT on members to authenticated users
--    The RLS policy "Service can insert members" (WITH CHECK true)
--    already exists, but the GRANT was missing INSERT.
-- ============================================================
GRANT INSERT ON members TO authenticated;

-- Also ensure member_addresses has INSERT for authenticated
-- (it already has GRANT ALL, but be explicit)
GRANT ALL ON member_addresses TO authenticated;


-- ============================================================
-- 2. FIX: Set one_deploy@hotmail.com as admin + partner
-- ============================================================

-- 2a. Update users.role to admin
UPDATE users
SET role = 'admin', updated_at = NOW()
WHERE email = 'one_deploy@hotmail.com';

-- 2b. Update members.role to admin
UPDATE members
SET role = 'admin'
WHERE email = 'one_deploy@hotmail.com'
   OR user_id IN (SELECT id FROM users WHERE email = 'one_deploy@hotmail.com');

-- 2c. Create partner record if missing
INSERT INTO partners (member_id, referral_code, tier, status, ly_balance, cash_wallet_balance, rwa_tokens, total_sales, total_cashback, payment_amount, payment_date, created_at, updated_at)
SELECT
  m.id,
  'ADMIN01',
  'phase1',
  'active',
  1000,
  0,
  1,
  0,
  0,
  0,
  NOW(),
  NOW(),
  NOW()
FROM members m
JOIN users u ON m.user_id = u.id
WHERE u.email = 'one_deploy@hotmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM partners p WHERE p.member_id = m.id
  );

-- 2d. Backfill partners.user_id if missing
UPDATE partners p
SET user_id = m.user_id
FROM members m
WHERE p.member_id = m.id AND p.user_id IS NULL;


COMMIT;
