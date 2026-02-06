-- Migration: Purchase Order Workflow Enhancement
-- Description:
--   1. Add approval and payment workflow columns to purchase_orders
--   2. Create storage bucket for purchase documents
--   3. Link purchase orders to bills

-- =====================================================
-- 1. Extend purchase_orders table
-- =====================================================

-- Approval fields
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS approved_by VARCHAR REFERENCES members(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Invoice/Bill fields
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS invoice_amount INTEGER;

-- Bank payment workflow fields
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS bank_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS bank_maker_id VARCHAR REFERENCES members(id),
  ADD COLUMN IF NOT EXISTS bank_maker_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bank_approver_id VARCHAR REFERENCES members(id),
  ADD COLUMN IF NOT EXISTS bank_approver_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bank_reference TEXT;

-- Payment receipt fields
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Link to bills table
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS bill_id VARCHAR REFERENCES bills(id);

-- =====================================================
-- 2. Create storage bucket for purchase documents
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('purchase-docs', 'purchase-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can read purchase docs
CREATE POLICY "Authenticated users can read purchase docs" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'purchase-docs' AND auth.role() = 'authenticated');

-- Authenticated users can upload purchase docs
CREATE POLICY "Authenticated users can upload purchase docs" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'purchase-docs' AND auth.role() = 'authenticated');

-- =====================================================
-- 3. Add indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_po_approved_by ON purchase_orders(approved_by);
CREATE INDEX IF NOT EXISTS idx_po_bank_status ON purchase_orders(bank_status);
CREATE INDEX IF NOT EXISTS idx_po_bill_id ON purchase_orders(bill_id);

-- =====================================================
-- 4. Update purchase order status enum comment
-- =====================================================
COMMENT ON COLUMN purchase_orders.status IS 'Order status: pending, approved, shipped, received, cancelled';
COMMENT ON COLUMN purchase_orders.bank_status IS 'Bank payment status: pending, maker_done, approver_done, paid, failed';

-- Complete
DO $$
BEGIN
  RAISE NOTICE 'Migration 016_purchase_workflow completed successfully';
END $$;
