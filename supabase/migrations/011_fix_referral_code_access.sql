-- Migration 011: Fix referral code access
--
-- Problems:
--   1. Members RLS only allows reading own record (user_id = auth.uid()).
--      This blocks referral code validation for unauthenticated users and
--      referrer lookup for authenticated users (they can't read OTHER members).
--   2. Referral codes are now unified on the members table only.
--      The partners.referral_code column is kept in sync but is redundant.
--
-- Fixes:
--   1. Create a SECURITY DEFINER function `validate_referral_code(code text)`
--      so anon users can validate a referral code without direct table access.
--   2. Add RLS policy: authenticated users can SELECT any member.
--      (Needed for referrer lookup, referral tree, partner network, etc.)

BEGIN;

-- ============================================================
-- 1. RPC: validate_referral_code (callable by anon + authenticated)
--    Returns referrer name + member_id if code is valid
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_referral_code(code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'valid', true,
    'referrer_name', m.name,
    'referrer_member_id', m.id
  ) INTO result
  FROM members m
  WHERE m.referral_code = upper(code)
  LIMIT 1;

  IF result IS NULL THEN
    RETURN json_build_object('valid', false);
  END IF;

  RETURN result;
END;
$$;

-- Allow anon and authenticated to call this function
GRANT EXECUTE ON FUNCTION public.validate_referral_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(TEXT) TO authenticated;


-- ============================================================
-- 2. RLS: Authenticated users can read all members
--    (for referrer lookup, referral tree, partner dashboard, etc.)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read all members" ON members;
CREATE POLICY "Authenticated users can read all members"
  ON members FOR SELECT
  USING (auth.role() = 'authenticated');


COMMIT;
