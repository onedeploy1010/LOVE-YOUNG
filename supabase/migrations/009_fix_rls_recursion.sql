-- Migration 009: Fix infinite RLS recursion on users table
--
-- Root cause: "Admins can read all users" policy on users table
-- contains EXISTS(SELECT 1 FROM users ...) — self-referencing.
-- Every admin-check policy on other tables also hits this loop.
--
-- Fix: Create a SECURITY DEFINER helper function that reads
-- the user role WITHOUT going through RLS, then rewrite all
-- admin-check policies to use it.

BEGIN;

-- ============================================================
-- 1. SECURITY DEFINER helper: is_admin()
--    Runs as the function owner (postgres), bypasses RLS.
-- ============================================================
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
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;


-- ============================================================
-- 2. DROP all old admin-check policies (they cause recursion)
-- ============================================================

-- users
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- members
DROP POLICY IF EXISTS "Admins can read all members" ON members;

-- partners
DROP POLICY IF EXISTS "Admins can read all partners" ON partners;

-- orders
DROP POLICY IF EXISTS "Admins can read all orders" ON orders;

-- contact_messages
DROP POLICY IF EXISTS "Admins can read contact messages" ON contact_messages;

-- inventory
DROP POLICY IF EXISTS "Admins can manage inventory" ON inventory;

-- products
DROP POLICY IF EXISTS "Admins can manage products" ON products;

-- withdrawal_requests
DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON withdrawal_requests;


-- ============================================================
-- 3. RECREATE all admin policies using public.is_admin()
-- ============================================================

-- users: admins can see + update all users
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (public.is_admin());

-- members: admins can see + manage all members
CREATE POLICY "Admins can read all members"
  ON members FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all members"
  ON members FOR UPDATE
  USING (public.is_admin());

-- partners: admins can see + manage all partners
CREATE POLICY "Admins can read all partners"
  ON partners FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all partners"
  ON partners FOR UPDATE
  USING (public.is_admin());

-- orders: admins can see all orders
CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  USING (public.is_admin());

-- contact_messages: admins can read
CREATE POLICY "Admins can read contact messages"
  ON contact_messages FOR SELECT
  USING (public.is_admin());

-- inventory: admins can manage
CREATE POLICY "Admins can manage inventory"
  ON inventory FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- products: admins can manage
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- withdrawal_requests: admins can manage
CREATE POLICY "Admins can manage all withdrawals"
  ON withdrawal_requests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- 4. Also fix the "Users can read own data" policy on users
--    The old version had: (auth.uid()::text = id) OR (role = 'admin')
--    The OR (role = 'admin') leaks all admin rows to everyone.
--    Fix: only show own row; admins see all via the admin policy.
-- ============================================================
DROP POLICY IF EXISTS "Users can read own data" ON users;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (id = auth.uid()::text);


COMMIT;
