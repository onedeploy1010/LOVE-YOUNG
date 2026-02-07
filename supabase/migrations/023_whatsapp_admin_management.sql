-- Migration 023: WhatsApp Multi-Admin Management
-- Admin accounts, conversation assignments, duty roster, timeout escalation

-- WhatsApp admin accounts
CREATE TABLE IF NOT EXISTS whatsapp_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_phone_id TEXT,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy')),
  is_on_duty BOOLEAN DEFAULT false,
  duty_start TIME,
  duty_end TIME,
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chat_count INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversation assignment tracking
CREATE TABLE IF NOT EXISTS whatsapp_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES whatsapp_admins(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  timeout_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'responded', 'timeout', 'transferred', 'completed')),
  timeout_seconds INTEGER DEFAULT 300,
  transferred_from UUID REFERENCES whatsapp_admins(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Duty roster for scheduling
CREATE TABLE IF NOT EXISTS whatsapp_duty_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES whatsapp_admins(id) ON DELETE CASCADE,
  duty_date DATE NOT NULL,
  shift_start TIME NOT NULL,
  shift_end TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add assignment fields to whatsapp_conversations
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS assigned_admin_id UUID REFERENCES whatsapp_admins(id) ON DELETE SET NULL;
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS assignment_status TEXT DEFAULT 'unassigned' CHECK (assignment_status IN ('unassigned', 'assigned', 'escalated'));
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS last_admin_response_at TIMESTAMPTZ;

-- Enable RLS
ALTER TABLE whatsapp_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_duty_roster ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admin full access to whatsapp_admins"
  ON whatsapp_admins FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid()::text AND members.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid()::text AND members.role = 'admin'));

CREATE POLICY "Admin full access to whatsapp_assignments"
  ON whatsapp_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid()::text AND members.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid()::text AND members.role = 'admin'));

CREATE POLICY "Admin full access to whatsapp_duty_roster"
  ON whatsapp_duty_roster FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid()::text AND members.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid()::text AND members.role = 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_admins_status ON whatsapp_admins(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_admins_on_duty ON whatsapp_admins(is_on_duty);
CREATE INDEX IF NOT EXISTS idx_whatsapp_admins_user_id ON whatsapp_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_assignments_conversation ON whatsapp_assignments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_assignments_admin ON whatsapp_assignments(admin_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_assignments_status ON whatsapp_assignments(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_duty_roster_date ON whatsapp_duty_roster(duty_date);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_assigned ON whatsapp_conversations(assigned_admin_id);

-- Updated_at trigger for whatsapp_admins
CREATE OR REPLACE FUNCTION update_whatsapp_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_whatsapp_admins_updated_at ON whatsapp_admins;
CREATE TRIGGER trigger_whatsapp_admins_updated_at
  BEFORE UPDATE ON whatsapp_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_admins_updated_at();

-- Function to find least-busy on-duty admin for auto-assignment
CREATE OR REPLACE FUNCTION find_least_busy_admin()
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT wa.id INTO admin_id
  FROM whatsapp_admins wa
  WHERE wa.is_on_duty = true
    AND wa.status = 'online'
    AND wa.current_chat_count < wa.max_concurrent_chats
  ORDER BY wa.current_chat_count ASC
  LIMIT 1;

  RETURN admin_id;
END;
$$;
