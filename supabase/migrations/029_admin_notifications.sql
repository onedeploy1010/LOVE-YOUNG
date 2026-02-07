-- ============================================
-- 029: Admin Notification System
-- ============================================

-- ============================================
-- Create admin_notifications table
-- ============================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN (
    'withdrawal_request', 'new_order', 'order_status',
    'shipping_update', 'new_partner', 'escalation', 'system'
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  related_id TEXT,
  related_type TEXT,
  is_read BOOLEAN DEFAULT false,
  sent_to_whatsapp BOOLEAN DEFAULT false,
  target_admin_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at DESC);

-- RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access admin_notifications"
  ON admin_notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin'));

-- ============================================
-- Add notification preferences to whatsapp_admins
-- ============================================
ALTER TABLE whatsapp_admins ADD COLUMN IF NOT EXISTS notify_withdrawals BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_admins ADD COLUMN IF NOT EXISTS notify_orders BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_admins ADD COLUMN IF NOT EXISTS notify_shipping BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_admins ADD COLUMN IF NOT EXISTS notify_partners BOOLEAN DEFAULT true;

-- ============================================
-- Trigger: Notify on new withdrawal request
-- ============================================
CREATE OR REPLACE FUNCTION trg_fn_admin_notify_withdrawal()
RETURNS TRIGGER AS $$
DECLARE
  v_partner_name TEXT;
  v_amount_rm NUMERIC;
BEGIN
  SELECT m.name INTO v_partner_name
  FROM partners p JOIN members m ON m.id = p.member_id
  WHERE p.id = NEW.partner_id;

  v_amount_rm := COALESCE(NEW.amount, 0) / 100.0;

  INSERT INTO admin_notifications (type, title, content, related_id, related_type)
  VALUES (
    'withdrawal_request',
    'New Withdrawal Request',
    COALESCE(v_partner_name, 'Partner') || ' requested withdrawal of RM ' || v_amount_rm::numeric(10,2),
    NEW.id,
    'withdrawal'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_notify_withdrawal ON withdrawal_requests;
CREATE TRIGGER trg_admin_notify_withdrawal
  AFTER INSERT ON withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_admin_notify_withdrawal();

-- ============================================
-- Trigger: Notify on new order
-- ============================================
CREATE OR REPLACE FUNCTION trg_fn_admin_notify_order()
RETURNS TRIGGER AS $$
DECLARE
  v_amount_rm NUMERIC;
BEGIN
  -- Only on INSERT (new order)
  IF TG_OP = 'INSERT' THEN
    v_amount_rm := COALESCE(NEW.total_amount, 0) / 100.0;

    INSERT INTO admin_notifications (type, title, content, related_id, related_type)
    VALUES (
      'new_order',
      'New Order #' || COALESCE(NEW.order_number, ''),
      'New order received: RM ' || v_amount_rm::numeric(10,2),
      NEW.id,
      'order'
    );
  END IF;

  -- On status change to shipped
  IF TG_OP = 'UPDATE' AND NEW.status = 'shipped' AND OLD.status IS DISTINCT FROM 'shipped' THEN
    INSERT INTO admin_notifications (type, title, content, related_id, related_type)
    VALUES (
      'shipping_update',
      'Order Shipped #' || COALESCE(NEW.order_number, ''),
      'Order #' || COALESCE(NEW.order_number, '') || ' has been marked as shipped',
      NEW.id,
      'order'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_notify_order ON orders;
CREATE TRIGGER trg_admin_notify_order
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_admin_notify_order();

-- ============================================
-- Trigger: Notify on new partner
-- ============================================
CREATE OR REPLACE FUNCTION trg_fn_admin_notify_partner()
RETURNS TRIGGER AS $$
DECLARE
  v_member_name TEXT;
BEGIN
  SELECT m.name INTO v_member_name
  FROM members m WHERE m.id = NEW.member_id;

  INSERT INTO admin_notifications (type, title, content, related_id, related_type)
  VALUES (
    'new_partner',
    'New Partner Joined',
    COALESCE(v_member_name, 'Member') || ' joined as ' || COALESCE(NEW.tier, 'partner'),
    NEW.id,
    'partner'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_admin_notify_partner ON partners;
CREATE TRIGGER trg_admin_notify_partner
  AFTER INSERT ON partners
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_admin_notify_partner();
