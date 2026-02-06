-- 025: WhatsApp Channel Integration - Add channel tracking to main orders/members tables
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source_channel TEXT DEFAULT 'website';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_conversation_id UUID;

ALTER TABLE members ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS registration_source TEXT DEFAULT 'website';
ALTER TABLE members ADD COLUMN IF NOT EXISTS whatsapp_conversation_id UUID;

CREATE INDEX IF NOT EXISTS idx_orders_source_channel ON orders(source_channel);
CREATE INDEX IF NOT EXISTS idx_members_whatsapp_phone ON members(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_members_registration_source ON members(registration_source);
