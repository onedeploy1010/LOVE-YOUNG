-- Migration: Admin Operations Tables
-- Description:
--   1. Bills management table
--   2. Finance transactions table
--   3. Inventory system (items, categories, ledger)
--   4. Logistics/Shipments table
--   5. Production batches and materials
--   6. Purchase orders and suppliers

-- =====================================================
-- 1. Bills Table
-- =====================================================
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number VARCHAR(50) UNIQUE NOT NULL,
  vendor VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,  -- in cents (sen)
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, paid, overdue
  type VARCHAR(50) NOT NULL DEFAULT 'purchase',  -- purchase, logistics, operation
  due_date DATE NOT NULL,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);

-- =====================================================
-- 2. Finance Transactions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(20) NOT NULL,  -- income, expense
  category VARCHAR(100) NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,  -- in cents (sen)
  description TEXT,
  reference_type VARCHAR(50),  -- order, bill, payout, etc.
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_tx_date ON finance_transactions(date);
CREATE INDEX IF NOT EXISTS idx_finance_tx_type ON finance_transactions(type);

-- =====================================================
-- 3. Inventory System
-- =====================================================
-- Inventory Categories
CREATE TABLE IF NOT EXISTS inventory_categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  color VARCHAR(20) DEFAULT 'blue',
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category_id VARCHAR(50) REFERENCES inventory_categories(id),
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT '个',
  status VARCHAR(20) GENERATED ALWAYS AS (
    CASE
      WHEN stock <= 0 THEN 'out_of_stock'
      WHEN stock < min_stock * 0.5 THEN 'critical'
      WHEN stock < min_stock THEN 'low'
      ELSE 'normal'
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);

-- Inventory Ledger (stock movements)
CREATE TABLE IF NOT EXISTS inventory_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL,  -- in, out
  quantity INTEGER NOT NULL,
  movement_type VARCHAR(50) NOT NULL,  -- production, purchase, sales, adjust, return, damage
  note TEXT,
  operator VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_item ON inventory_ledger(item_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON inventory_ledger(created_at);

-- =====================================================
-- 4. Shipments/Logistics Table
-- =====================================================
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  order_number VARCHAR(50),
  destination VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, in_transit, delivered
  temperature VARCHAR(20) DEFAULT '-18°C',
  eta DATE,
  delivered_at TIMESTAMPTZ,
  tracking_number VARCHAR(100),
  carrier VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);

-- =====================================================
-- 5. Production System
-- =====================================================
-- Production Batches
CREATE TABLE IF NOT EXISTS production_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number VARCHAR(50) UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  planned_qty INTEGER NOT NULL DEFAULT 0,
  actual_qty INTEGER,
  status VARCHAR(30) NOT NULL DEFAULT 'planned',  -- planned, material_prep, cleaning, cooking, cold_storage, inspection, completed, cancelled
  current_step INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 5,
  planned_date DATE NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_status ON production_batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_date ON production_batches(planned_date);

-- Production Material Usage
CREATE TABLE IF NOT EXISTS production_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES production_batches(id) ON DELETE CASCADE,
  material_name VARCHAR(255) NOT NULL,
  planned_qty NUMERIC(10,2) NOT NULL DEFAULT 0,
  actual_qty NUMERIC(10,2),
  wastage NUMERIC(10,2) DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'g',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prod_materials_batch ON production_materials(batch_id);

-- =====================================================
-- 6. Purchase System
-- =====================================================
-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  total_orders INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',  -- active, inactive
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name VARCHAR(255) NOT NULL,
  total_amount INTEGER NOT NULL DEFAULT 0,  -- in cents (sen)
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, approved, shipped, received, cancelled
  item_count INTEGER NOT NULL DEFAULT 0,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  received_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  sku VARCHAR(50),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price INTEGER NOT NULL DEFAULT 0,  -- in cents (sen)
  total_price INTEGER NOT NULL DEFAULT 0,  -- in cents (sen)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(po_id);

-- =====================================================
-- 7. Insert Default Inventory Categories
-- =====================================================
INSERT INTO inventory_categories (id, name, name_en, color, permissions) VALUES
  ('raw', '原料库', 'Raw Materials', 'blue', ARRAY['production']),
  ('finished', '成品库', 'Finished Goods', 'green', ARRAY['sales', 'orders']),
  ('packaging', '包装材料', 'Packaging', 'purple', ARRAY['production']),
  ('gift', '礼品库', 'Gift Items', 'amber', ARRAY['sales', 'marketing'])
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 8. Finance Summary Function
-- =====================================================
CREATE OR REPLACE FUNCTION get_finance_summary(
  p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_revenue BIGINT,
  total_expenses BIGINT,
  total_profit BIGINT,
  partner_payouts BIGINT,
  bonus_pool_payouts BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::BIGINT AS total_revenue,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::BIGINT AS total_expenses,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)::BIGINT AS total_profit,
    COALESCE(SUM(CASE WHEN type = 'expense' AND category LIKE '%返现%' THEN amount ELSE 0 END), 0)::BIGINT AS partner_payouts,
    COALESCE(SUM(CASE WHEN type = 'expense' AND category LIKE '%分红%' THEN amount ELSE 0 END), 0)::BIGINT AS bonus_pool_payouts
  FROM finance_transactions
  WHERE date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 9. Grant Permissions
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON bills TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON finance_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_ledger TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shipments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON production_batches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON production_materials TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_order_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_finance_summary TO authenticated;

-- Complete
DO $$
BEGIN
  RAISE NOTICE 'Migration 006_admin_operations completed successfully';
END $$;
