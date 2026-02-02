-- Migration: Production BOM (Bill of Materials) System
-- Description:
--   1. product_bom table linking products to inventory items (raw materials)
--   2. Add inventory_item_id column to production_materials

-- =====================================================
-- 1. Product BOM (Bill of Materials)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_bom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR REFERENCES products(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity NUMERIC(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'g',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, inventory_item_id)
);

CREATE INDEX IF NOT EXISTS idx_bom_product ON product_bom(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_item ON product_bom(inventory_item_id);

-- =====================================================
-- 2. Add inventory_item_id to production_materials
-- =====================================================
ALTER TABLE production_materials
  ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES inventory_items(id);

CREATE INDEX IF NOT EXISTS idx_prod_mat_item ON production_materials(inventory_item_id);

-- =====================================================
-- 3. Grant Permissions
-- =====================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON product_bom TO authenticated;

-- Complete
DO $$
BEGIN
  RAISE NOTICE 'Migration 015_production_bom completed successfully';
END $$;
