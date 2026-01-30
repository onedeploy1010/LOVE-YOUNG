-- Migration 007: Connect mock data to real Supabase tables
-- Creates product_categories, payment_methods tables + seed data

BEGIN;

-- ============================================================
-- 1. product_categories table
-- ============================================================
CREATE TABLE IF NOT EXISTS product_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,
  color VARCHAR(20) DEFAULT 'blue',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "Anyone can read product_categories"
  ON product_categories FOR SELECT
  USING (true);

-- Only service role / admin can mutate (via Supabase dashboard or server)
CREATE POLICY "Authenticated users can manage product_categories"
  ON product_categories FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

GRANT SELECT ON product_categories TO anon;
GRANT ALL ON product_categories TO authenticated;

-- Seed: 4 categories
INSERT INTO product_categories (id, name, name_en, description, color) VALUES
  ('bird-nest', '燕窝', 'Bird''s Nest', '精选燕窝产品', 'emerald'),
  ('fish-maw',  '花胶', 'Fish Maw',     '优质花胶系列', 'amber'),
  ('gift-set',  '礼盒', 'Gift Set',     '精美礼盒套装', 'rose'),
  ('combo',     '套餐', 'Combo',        '超值组合套餐', 'blue')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. payment_methods table
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255),
  type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'bank', 'ewallet')),
  brand VARCHAR(50),
  last4 VARCHAR(4),
  exp_month INTEGER,
  exp_year INTEGER,
  name VARCHAR(255),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment methods
CREATE POLICY "Users can read own payment_methods"
  ON payment_methods FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own payment_methods"
  ON payment_methods FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own payment_methods"
  ON payment_methods FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own payment_methods"
  ON payment_methods FOR DELETE
  USING (user_id = auth.uid()::text);

GRANT ALL ON payment_methods TO authenticated;

-- ============================================================
-- 3. Notifications seed data (table already exists from 001)
-- ============================================================
-- No seed inserts needed; notifications are created by the system.
-- The frontend will read from the existing notifications table.

COMMIT;
