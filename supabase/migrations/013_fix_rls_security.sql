-- Fix overly permissive RLS policies and enable RLS on unprotected tables
-- Already applied to production DB; this migration is for record-keeping.

-- 1. product_categories: restrict to admin (was open to any authenticated user)
DROP POLICY IF EXISTS "Authenticated users can manage product_categories" ON product_categories;
CREATE POLICY "Admins can manage product_categories" ON product_categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
-- "Anyone can read product_categories" SELECT policy already exists

-- 2. notifications: restrict INSERT to admin (was open to public)
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Admins can insert notifications" ON notifications
  FOR INSERT WITH CHECK (is_admin());

-- 3. Enable RLS on critical financial/admin tables
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage bills" ON bills FOR ALL USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage finance_transactions" ON finance_transactions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE cost_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage cost_records" ON cost_records FOR ALL USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage suppliers" ON suppliers FOR ALL USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage inventory_items" ON inventory_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE inventory_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage inventory_ledger" ON inventory_ledger FOR ALL USING (is_admin()) WITH CHECK (is_admin());
