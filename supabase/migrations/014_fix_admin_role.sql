-- Migration 014: Fix admin role detection
--
-- Problem: The old handleSaveProfile code overwrote users.role to 'member'
-- for ALL users including admins. The is_admin() function only checks
-- users.role, so admin access was lost.
--
-- Fix:
-- 1. Restore admin role for the known admin user
-- 2. Improve is_admin() to also check members.role as fallback
-- 3. Ensure consistency between users.role and members.role

BEGIN;

-- 1. Fix the admin user's role in users table
-- (one_deploy@hotmail.com = 134827d3-7f5d-4bb9-906e-bd56468ef84d)
UPDATE public.users
SET role = 'admin'
WHERE id = '134827d3-7f5d-4bb9-906e-bd56468ef84d';

-- Also ensure members.role is 'admin' for this user
UPDATE public.members
SET role = 'admin'
WHERE user_id = '134827d3-7f5d-4bb9-906e-bd56468ef84d';

-- 2. Improve is_admin() to check BOTH users.role AND members.role
--    This provides redundancy — if one table's role gets corrupted,
--    the other still works.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()::text
      AND role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.members
    WHERE user_id = auth.uid()::text
      AND role = 'admin'
  );
$$;

COMMIT;
