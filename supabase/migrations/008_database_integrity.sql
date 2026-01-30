-- Migration 008: Database Integrity & Completeness
--
-- Fixes found by audit:
--   1. Missing foreign key constraints across 7 tables
--   2. Missing columns: orders.user_id, partners.user_id, products.created_at
--   3. Orphan product category "gift-box" not in product_categories
--   4. Missing UNIQUE constraints (members.user_id, partners.member_id)
--   5. RLS missing on most user-facing tables
--   6. Stale sessions data (legacy Replit OIDC)
--   7. Missing indexes for common query patterns

BEGIN;

-- ============================================================
-- 1. FIX ORPHAN CATEGORY: add "gift-box" to product_categories
-- ============================================================
INSERT INTO product_categories (id, name, name_en, description, color)
VALUES ('gift-box', '礼盒套装', 'Gift Box', '新年/节日礼盒套装', 'rose')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. ADD MISSING COLUMNS
-- ============================================================

-- 2a. orders.user_id  (link orders to users for RLS and queries)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Backfill from members table where possible
UPDATE orders o
SET user_id = m.user_id
FROM members m
WHERE o.member_id = m.id AND o.user_id IS NULL;

-- 2b. partners.user_id  (direct link, avoids join through members)
ALTER TABLE partners ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Backfill from members table
UPDATE partners p
SET user_id = m.user_id
FROM members m
WHERE p.member_id = m.id AND p.user_id IS NULL;

-- 2c. products.created_at  (admin page sorts by this)
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- ============================================================
-- 3. ADD MISSING UNIQUE CONSTRAINTS
-- ============================================================

-- One member per user
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'members_user_id_unique'
  ) THEN
    ALTER TABLE members ADD CONSTRAINT members_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- One partner per member
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'partners_member_id_unique'
  ) THEN
    ALTER TABLE partners ADD CONSTRAINT partners_member_id_unique UNIQUE (member_id);
  END IF;
END $$;


-- ============================================================
-- 4. ADD MISSING FOREIGN KEYS
-- ============================================================

-- orders.member_id → members.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_member_id'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT fk_orders_member_id
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL;
  END IF;
END $$;

-- orders.user_id → users.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_user_id'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT fk_orders_user_id
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- partners.user_id → users.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_partners_user_id'
  ) THEN
    ALTER TABLE partners
      ADD CONSTRAINT fk_partners_user_id
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- members.referrer_id → members.id  (self-referential for referral tree)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_members_referrer_id'
  ) THEN
    ALTER TABLE members
      ADD CONSTRAINT fk_members_referrer_id
      FOREIGN KEY (referrer_id) REFERENCES members(id) ON DELETE SET NULL;
  END IF;
END $$;

-- partners.referrer_id → partners.id  (self-referential for referral tree)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_partners_referrer_id'
  ) THEN
    ALTER TABLE partners
      ADD CONSTRAINT fk_partners_referrer_id
      FOREIGN KEY (referrer_id) REFERENCES partners(id) ON DELETE SET NULL;
  END IF;
END $$;

-- shipments.order_id → orders.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_shipments_order_id'
  ) THEN
    ALTER TABLE shipments
      ADD CONSTRAINT fk_shipments_order_id
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- purchase_orders.supplier_id → suppliers.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_purchase_orders_supplier_id'
  ) THEN
    ALTER TABLE purchase_orders
      ADD CONSTRAINT fk_purchase_orders_supplier_id
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- purchase_order_items.po_id → purchase_orders.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_purchase_order_items_po_id'
  ) THEN
    ALTER TABLE purchase_order_items
      ADD CONSTRAINT fk_purchase_order_items_po_id
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE;
  END IF;
END $$;

-- products.category → product_categories.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_category'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT fk_products_category
      FOREIGN KEY (category) REFERENCES product_categories(id);
  END IF;
END $$;


-- ============================================================
-- 5. ADD MISSING INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_member_id ON orders(member_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_referrer_id ON members(referrer_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);


-- ============================================================
-- 6. ENABLE RLS + POLICIES ON KEY TABLES
-- ============================================================

-- --- members ---
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own member"
  ON members FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own member"
  ON members FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Service can insert members"
  ON members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read all members"
  ON members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()::text AND u.role = 'admin')
  );

GRANT SELECT, UPDATE ON members TO authenticated;
GRANT ALL ON members TO service_role;

-- --- partners ---
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own partner"
  ON partners FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own partner"
  ON partners FOR UPDATE
  USING (user_id = auth.uid()::text);

CREATE POLICY "Service can insert partners"
  ON partners FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read all partners"
  ON partners FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()::text AND u.role = 'admin')
  );

GRANT SELECT, UPDATE ON partners TO authenticated;
GRANT ALL ON partners TO service_role;

-- --- orders ---
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid()::text OR user_id IS NULL);

CREATE POLICY "Service can manage all orders"
  ON orders FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can read all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()::text AND u.role = 'admin')
  );

GRANT SELECT, INSERT ON orders TO authenticated;
GRANT ALL ON orders TO service_role;

-- --- member_addresses ---
ALTER TABLE member_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own addresses"
  ON member_addresses FOR ALL
  USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid()::text)
  )
  WITH CHECK (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid()::text)
  );

GRANT ALL ON member_addresses TO authenticated;

-- --- member_points_ledger ---
ALTER TABLE member_points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own points"
  ON member_points_ledger FOR SELECT
  USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid()::text)
  );

GRANT SELECT ON member_points_ledger TO authenticated;
GRANT ALL ON member_points_ledger TO service_role;

-- --- ly_points_ledger ---
ALTER TABLE ly_points_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can read own LY points"
  ON ly_points_ledger FOR SELECT
  USING (
    partner_id IN (
      SELECT p.id FROM partners p
      JOIN members m ON p.member_id = m.id
      WHERE m.user_id = auth.uid()::text
    )
  );

GRANT SELECT ON ly_points_ledger TO authenticated;
GRANT ALL ON ly_points_ledger TO service_role;

-- --- cash_wallet_ledger ---
ALTER TABLE cash_wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can read own cash ledger"
  ON cash_wallet_ledger FOR SELECT
  USING (
    partner_id IN (
      SELECT p.id FROM partners p
      JOIN members m ON p.member_id = m.id
      WHERE m.user_id = auth.uid()::text
    )
  );

GRANT SELECT ON cash_wallet_ledger TO authenticated;
GRANT ALL ON cash_wallet_ledger TO service_role;

-- --- rwa_token_ledger ---
ALTER TABLE rwa_token_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can read own RWA tokens"
  ON rwa_token_ledger FOR SELECT
  USING (
    partner_id IN (
      SELECT p.id FROM partners p
      JOIN members m ON p.member_id = m.id
      WHERE m.user_id = auth.uid()::text
    )
  );

GRANT SELECT ON rwa_token_ledger TO authenticated;
GRANT ALL ON rwa_token_ledger TO service_role;

-- --- withdrawal_requests ---
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can manage own withdrawals"
  ON withdrawal_requests FOR ALL
  USING (
    partner_id IN (
      SELECT p.id FROM partners p
      JOIN members m ON p.member_id = m.id
      WHERE m.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT p.id FROM partners p
      JOIN members m ON p.member_id = m.id
      WHERE m.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage all withdrawals"
  ON withdrawal_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()::text AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()::text AND u.role = 'admin')
  );

GRANT ALL ON withdrawal_requests TO authenticated;

-- --- products  (public read, admin write) ---
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()::text AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()::text AND u.role = 'admin')
  );

GRANT SELECT ON products TO anon;
GRANT SELECT ON products TO authenticated;
GRANT ALL ON products TO service_role;

-- --- testimonials (public read) ---
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read testimonials"
  ON testimonials FOR SELECT
  USING (true);

GRANT SELECT ON testimonials TO anon;
GRANT SELECT ON testimonials TO authenticated;

-- --- contact_messages (anon can insert, admin read) ---
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read contact messages"
  ON contact_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()::text AND u.role = 'admin')
  );

GRANT INSERT ON contact_messages TO anon;
GRANT INSERT ON contact_messages TO authenticated;
GRANT ALL ON contact_messages TO service_role;

-- --- bonus_pool_cycles (public read) ---
ALTER TABLE bonus_pool_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bonus pool cycles"
  ON bonus_pool_cycles FOR SELECT
  USING (true);

GRANT SELECT ON bonus_pool_cycles TO authenticated;
GRANT ALL ON bonus_pool_cycles TO service_role;

-- --- inventory (admin only) ---
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inventory"
  ON inventory FOR ALL
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()::text AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid()::text AND u.role = 'admin')
  );

CREATE POLICY "Service can manage inventory"
  ON inventory FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT ALL ON inventory TO service_role;
GRANT SELECT ON inventory TO authenticated;


-- ============================================================
-- 7. TRIGGER: auto-populate orders.user_id on INSERT
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_order_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id not set but member_id is, look up the user
  IF NEW.user_id IS NULL AND NEW.member_id IS NOT NULL THEN
    SELECT user_id INTO NEW.user_id FROM members WHERE id = NEW.member_id;
  END IF;
  -- If still null, use current auth user
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid()::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_order_user_id ON orders;
CREATE TRIGGER trg_set_order_user_id
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_order_user_id();


-- ============================================================
-- 8. TRIGGER: auto-populate partners.user_id on INSERT
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_partner_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL AND NEW.member_id IS NOT NULL THEN
    SELECT user_id INTO NEW.user_id FROM members WHERE id = NEW.member_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_partner_user_id ON partners;
CREATE TRIGGER trg_set_partner_user_id
  BEFORE INSERT ON partners
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_partner_user_id();


-- ============================================================
-- 9. CLEAN STALE DATA
-- ============================================================

-- Remove legacy Replit OIDC sessions (no longer used, auth is via Supabase)
DELETE FROM sessions WHERE sess::text LIKE '%replit.com/oidc%';


COMMIT;
