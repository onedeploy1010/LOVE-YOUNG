-- Migration 012: Fix orders table to allow guest (anonymous) inserts
--
-- Problem: The current RLS policy "Users can insert own orders" checks:
--   (user_id = auth.uid() OR user_id IS NULL)
-- But anon users have auth.uid() = NULL, and the policy check fails because
-- the condition is evaluated in a way that requires authentication context.
--
-- Fix: Add a separate policy for anon role to insert orders with user_id IS NULL

BEGIN;

-- Drop existing insert policy and create a more permissive one
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;

-- Policy for authenticated users: can insert orders with their user_id or NULL
CREATE POLICY "Authenticated users can insert orders"
  ON orders FOR INSERT TO authenticated
  WITH CHECK (
    user_id IS NULL
    OR (user_id)::text = (auth.uid())::text
  );

-- Policy for anonymous users: can only insert orders with user_id IS NULL
CREATE POLICY "Anonymous users can insert guest orders"
  ON orders FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

COMMIT;
