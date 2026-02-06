-- 019: WhatsApp Business tables
-- Config, templates, conversations, messages, orders, registrations

-- WhatsApp Config (single row for app config)
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  business_phone_id TEXT,
  whatsapp_business_account_id TEXT,
  access_token TEXT,
  webhook_verify_token TEXT,
  webhook_url TEXT,
  business_name TEXT DEFAULT 'LOVE YOUNG',
  business_description TEXT,
  business_address TEXT,
  business_email TEXT,
  business_website TEXT,
  admin_phone_numbers TEXT[] DEFAULT '{}',
  notification_enabled BOOLEAN DEFAULT true,
  auto_reply_enabled BOOLEAN DEFAULT true,
  auto_reply_message TEXT DEFAULT '感谢您的消息，我们将尽快回复您！',
  working_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00", "timezone": "Asia/Kuala_Lumpur"}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp Message Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'zh_CN',
  category TEXT NOT NULL DEFAULT 'MARKETING' CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  header_type TEXT CHECK (header_type IN ('text', 'image', 'video', 'document')),
  header_content TEXT,
  body_text TEXT NOT NULL,
  footer_text TEXT,
  buttons JSONB DEFAULT '[]',
  meta_template_id TEXT,
  variables TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp Conversations
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'closed')),
  assigned_to TEXT,
  conversation_type TEXT NOT NULL DEFAULT 'customer_service' CHECK (conversation_type IN ('customer_service', 'order_inquiry', 'registration', 'marketing', 'ai_bot')),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  unread_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'template', 'interactive', 'location')),
  content TEXT,
  media_url TEXT,
  template_id UUID REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
  whatsapp_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  sender_type TEXT NOT NULL DEFAULT 'customer' CHECK (sender_type IN ('customer', 'admin', 'bot')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp Orders (links to existing orders)
CREATE TABLE IF NOT EXISTS whatsapp_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  order_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  total_amount INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp Registrations (auto-registration tracking)
CREATE TABLE IF NOT EXISTS whatsapp_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  email TEXT,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL,
  registration_source TEXT NOT NULL DEFAULT 'whatsapp' CHECK (registration_source IN ('whatsapp', 'manual', 'referral')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_registrations ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "admin_whatsapp_config" ON whatsapp_config FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_whatsapp_templates" ON whatsapp_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_whatsapp_conversations" ON whatsapp_conversations FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_whatsapp_messages" ON whatsapp_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_whatsapp_orders" ON whatsapp_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_whatsapp_registrations" ON whatsapp_registrations FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);

-- Indexes
CREATE INDEX idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX idx_whatsapp_conversations_phone ON whatsapp_conversations(customer_phone);
CREATE INDEX idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_orders_status ON whatsapp_orders(status);
CREATE INDEX idx_whatsapp_orders_phone ON whatsapp_orders(customer_phone);
CREATE INDEX idx_whatsapp_registrations_phone ON whatsapp_registrations(customer_phone);

-- Insert default config row
INSERT INTO whatsapp_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
