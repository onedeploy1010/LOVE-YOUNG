-- Order Supplement Sessions (订单补录)
-- Admin uses AI chat to reconcile offline bank transfer payments

CREATE TABLE IF NOT EXISTS order_supplement_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'confirmed', 'cancelled')),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  parsed_actions JSONB DEFAULT NULL,
  execution_results JSONB DEFAULT NULL,
  total_orders_created INTEGER DEFAULT 0,
  total_partners_created INTEGER DEFAULT 0,
  total_members_created INTEGER DEFAULT 0,
  total_amount_cents BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by admin
CREATE INDEX idx_order_supplement_sessions_admin ON order_supplement_sessions(admin_user_id);
CREATE INDEX idx_order_supplement_sessions_status ON order_supplement_sessions(status);
CREATE INDEX idx_order_supplement_sessions_created ON order_supplement_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE order_supplement_sessions ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admin can view all supplement sessions"
  ON order_supplement_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid()::text
      AND members.role = 'admin'
    )
  );

CREATE POLICY "Admin can insert supplement sessions"
  ON order_supplement_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid()::text
      AND members.role = 'admin'
    )
  );

CREATE POLICY "Admin can update supplement sessions"
  ON order_supplement_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.user_id = auth.uid()::text
      AND members.role = 'admin'
    )
  );

-- Add receipt_url to bills table for storing payment receipts
ALTER TABLE bills ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
