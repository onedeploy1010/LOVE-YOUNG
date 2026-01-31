-- Migration 012: Enforce role hierarchy
--
-- Rule:
--   admin  → must have records in: users + members + partners
--   partner → must have records in: users + members
--   member  → must have record in: users
--
-- This migration:
--   1. Creates a reusable function ensure_role_hierarchy(email, target_role)
--   2. Backfills missing records for all existing users
--   3. Specifically fixes one_deploy@hotmail.com as admin

BEGIN;

-- ============================================================
-- 1. Reusable function: ensure_role_hierarchy
--    Call with a user email and desired role to auto-create
--    all lower-level records that are missing.
-- ============================================================
CREATE OR REPLACE FUNCTION public.ensure_role_hierarchy(
  p_email TEXT,
  p_target_role TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_auth_id     UUID;
  v_user_role   TEXT;
  v_member_id   TEXT;   -- members.id is VARCHAR, not UUID
  v_partner_id  TEXT;   -- partners.id is VARCHAR, not UUID
  v_final_role  TEXT;
  v_name        TEXT;
BEGIN
  -- Find auth user
  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    RAISE NOTICE 'No auth user found for %', p_email;
    RETURN;
  END IF;

  -- Ensure users record exists (users.id is VARCHAR, cast UUID to text)
  INSERT INTO users (id, email, role, created_at)
  VALUES (v_auth_id::text, p_email, COALESCE(p_target_role, 'user'), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE
      WHEN p_target_role IS NOT NULL THEN p_target_role
      ELSE users.role
    END,
    updated_at = NOW();

  -- Get current user role (use target if given, else existing)
  SELECT role INTO v_user_role FROM users WHERE id = v_auth_id::text;
  v_final_role := COALESCE(p_target_role, v_user_role, 'user');

  -- Update to target role if provided
  IF p_target_role IS NOT NULL THEN
    UPDATE users SET role = p_target_role, updated_at = NOW() WHERE id = v_auth_id::text;
    v_final_role := p_target_role;
  END IF;

  -- For member/partner/admin: ensure members record exists
  IF v_final_role IN ('member', 'partner', 'admin') THEN
    SELECT id INTO v_member_id FROM members WHERE user_id = v_auth_id::text LIMIT 1;

    IF v_member_id IS NULL THEN
      v_member_id := gen_random_uuid()::text;
      v_name := (SELECT COALESCE(NULLIF(first_name, '') || ' ' || NULLIF(last_name, ''), email)
                 FROM users WHERE id = v_auth_id::text);

      INSERT INTO members (id, user_id, name, email, role, points_balance, referral_code, created_at)
      VALUES (
        v_member_id,
        v_auth_id::text,
        COALESCE(NULLIF(TRIM(v_name), ''), p_email),
        p_email,
        v_final_role,
        0,
        'LY' || UPPER(SUBSTRING(MD5(v_member_id::text) FROM 1 FOR 6)),
        NOW()
      );
      RAISE NOTICE 'Created member record for %', p_email;
    ELSE
      -- Update member role to match
      UPDATE members SET role = v_final_role WHERE id = v_member_id;
    END IF;

    -- For partner/admin: ensure partners record exists
    IF v_final_role IN ('partner', 'admin') THEN
      -- Re-fetch member_id in case it was just created
      SELECT id INTO v_member_id FROM members WHERE user_id = v_auth_id::text LIMIT 1;

      SELECT id INTO v_partner_id FROM partners WHERE member_id = v_member_id LIMIT 1;

      IF v_partner_id IS NULL THEN
        INSERT INTO partners (
          member_id, user_id, referral_code, tier, status,
          ly_balance, cash_wallet_balance, rwa_tokens,
          total_sales, total_cashback, payment_amount,
          payment_date, created_at, updated_at
        ) VALUES (
          v_member_id,
          v_auth_id::text,
          (SELECT referral_code FROM members WHERE id = v_member_id),
          'phase1',
          'active',
          1000, 0, 1, 0, 0, 0,
          NOW(), NOW(), NOW()
        );
        RAISE NOTICE 'Created partner record for %', p_email;
      ELSE
        -- Ensure partner.user_id is set
        UPDATE partners SET user_id = v_auth_id::text, updated_at = NOW()
        WHERE id = v_partner_id AND (user_id IS NULL OR user_id = '');
      END IF;
    END IF;
  END IF;

  RAISE NOTICE 'Role hierarchy enforced for % → %', p_email, v_final_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 2. Fix one_deploy@hotmail.com → admin (user + member + partner)
-- ============================================================
SELECT public.ensure_role_hierarchy('one_deploy@hotmail.com', 'admin');


-- ============================================================
-- 3. Backfill: ensure all existing partners have member records
-- ============================================================
DO $$
DECLARE
  v_partner RECORD;
  v_member_id UUID;
BEGIN
  FOR v_partner IN
    SELECT p.id, p.user_id, p.member_id
    FROM partners p
    WHERE p.member_id IS NULL
      AND p.user_id IS NOT NULL
  LOOP
    -- Check if member already exists for this user
    SELECT id INTO v_member_id FROM members WHERE user_id = v_partner.user_id LIMIT 1;

    IF v_member_id IS NULL THEN
      v_member_id := gen_random_uuid()::text;
      INSERT INTO members (id, user_id, email, role, points_balance, referral_code, created_at)
      SELECT
        v_member_id,
        v_partner.user_id,
        u.email,
        'partner',
        0,
        'LY' || UPPER(SUBSTRING(MD5(v_member_id::text) FROM 1 FOR 6)),
        NOW()
      FROM users u WHERE u.id::text = v_partner.user_id;
    END IF;

    -- Link partner to member
    UPDATE partners SET member_id = v_member_id WHERE id = v_partner.id;
  END LOOP;
END $$;


-- ============================================================
-- 4. Backfill: ensure all existing members have user records
-- ============================================================
-- (users are auto-created by auth trigger, so this is just a safety net)
DO $$
DECLARE
  v_member RECORD;
BEGIN
  FOR v_member IN
    SELECT m.id, m.user_id, m.email, m.role
    FROM members m
    WHERE m.user_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id::text = m.user_id)
  LOOP
    INSERT INTO users (id, email, role, created_at)
    VALUES (v_member.user_id, v_member.email, COALESCE(v_member.role, 'member'), NOW())
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;


-- ============================================================
-- 5. Backfill: ensure partners.user_id is always set
-- ============================================================
UPDATE partners p
SET user_id = m.user_id
FROM members m
WHERE p.member_id = m.id
  AND (p.user_id IS NULL OR p.user_id = '');


COMMIT;
