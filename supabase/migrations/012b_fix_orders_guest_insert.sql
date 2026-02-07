-- Migration 012: Fix orders table to allow guest (anonymous) inserts

BEGIN;

-- Drop existing policies to recreate cleanly
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON orders;
DROP POLICY IF EXISTS "Anonymous users can insert guest orders" ON orders;

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
