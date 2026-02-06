-- 021: AI Memory Databases & WhatsApp Flows
-- Customer memory, product memory, partner memory for OpenAI context
-- WhatsApp Flows (FLEW) for customer acquisition

-- Customer Memory (stores AI conversation context per customer)
CREATE TABLE IF NOT EXISTS customer_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  memory_type TEXT NOT NULL DEFAULT 'preference' CHECK (memory_type IN ('preference', 'purchase_history', 'inquiry', 'feedback', 'health_profile', 'interaction')),
  content TEXT NOT NULL,
  embedding_vector TEXT,
  importance INTEGER NOT NULL DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  source TEXT NOT NULL DEFAULT 'whatsapp' CHECK (source IN ('whatsapp', 'website', 'admin', 'ai_generated')),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product Memory (AI knowledge base for products)
CREATE TABLE IF NOT EXISTS product_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'ingredients', 'benefits', 'usage', 'faq', 'comparison', 'promotion', 'certification')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding_vector TEXT,
  language TEXT NOT NULL DEFAULT 'zh',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partner Memory (AI knowledge for partner/business plan queries)
CREATE TABLE IF NOT EXISTS partner_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'commission', 'requirements', 'benefits', 'training', 'faq', 'success_story', 'policy')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding_vector TEXT,
  language TEXT NOT NULL DEFAULT 'zh',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp Flows (FLEW - for customer acquisition funnel)
CREATE TABLE IF NOT EXISTS whatsapp_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  flow_type TEXT NOT NULL DEFAULT 'acquisition' CHECK (flow_type IN ('acquisition', 'onboarding', 'reengagement', 'support', 'promotion', 'survey')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  trigger_type TEXT NOT NULL DEFAULT 'keyword' CHECK (trigger_type IN ('keyword', 'qr_code', 'link', 'ad_click', 'manual', 'scheduled')),
  trigger_value TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  target_audience JSONB DEFAULT '{}',
  conversion_count INTEGER NOT NULL DEFAULT 0,
  total_triggered INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WhatsApp Flow Executions (tracks each customer's journey through a flow)
CREATE TABLE IF NOT EXISTS whatsapp_flow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES whatsapp_flows(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL,
  customer_phone TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'converted')),
  step_data JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- System Health Check Config (stores API keys and connection settings)
CREATE TABLE IF NOT EXISTS system_config (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'openai', 'whatsapp', 'meta_ads', 'payment', 'email', 'storage')),
  config_key TEXT NOT NULL,
  config_value TEXT,
  is_secret BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  last_tested_at TIMESTAMPTZ,
  test_status TEXT CHECK (test_status IN ('success', 'failed', 'untested')),
  test_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE customer_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_flow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "admin_customer_memory" ON customer_memory FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_product_memory" ON product_memory FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_partner_memory" ON partner_memory FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_whatsapp_flows" ON whatsapp_flows FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_whatsapp_flow_executions" ON whatsapp_flow_executions FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_system_config" ON system_config FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);

-- Indexes
CREATE INDEX idx_customer_memory_phone ON customer_memory(customer_phone);
CREATE INDEX idx_customer_memory_member ON customer_memory(member_id);
CREATE INDEX idx_customer_memory_type ON customer_memory(memory_type);
CREATE INDEX idx_product_memory_product ON product_memory(product_id);
CREATE INDEX idx_product_memory_category ON product_memory(category);
CREATE INDEX idx_partner_memory_category ON partner_memory(category);
CREATE INDEX idx_whatsapp_flows_status ON whatsapp_flows(status);
CREATE INDEX idx_whatsapp_flow_executions_flow ON whatsapp_flow_executions(flow_id);
CREATE INDEX idx_whatsapp_flow_executions_phone ON whatsapp_flow_executions(customer_phone);
CREATE INDEX idx_system_config_category ON system_config(category);

-- Insert default system config entries
INSERT INTO system_config (id, category, config_key, description, is_secret, test_status) VALUES
('openai_api_key', 'openai', 'api_key', 'OpenAI API Key for AI customer service', true, 'untested'),
('openai_model', 'openai', 'model', 'Default OpenAI model (e.g., gpt-4o-mini)', false, 'untested'),
('openai_org_id', 'openai', 'organization_id', 'OpenAI Organization ID', false, 'untested'),
('whatsapp_phone_id', 'whatsapp', 'phone_number_id', 'WhatsApp Business Phone Number ID', false, 'untested'),
('whatsapp_token', 'whatsapp', 'access_token', 'WhatsApp Cloud API Access Token', true, 'untested'),
('whatsapp_waba_id', 'whatsapp', 'business_account_id', 'WhatsApp Business Account ID', false, 'untested'),
('whatsapp_webhook_token', 'whatsapp', 'webhook_verify_token', 'Webhook Verification Token', true, 'untested'),
('meta_ads_token', 'meta_ads', 'access_token', 'Meta Marketing API Access Token', true, 'untested'),
('meta_ads_account', 'meta_ads', 'ad_account_id', 'Meta Ad Account ID', false, 'untested'),
('meta_pixel_id', 'meta_ads', 'pixel_id', 'Meta Pixel ID for tracking', false, 'untested')
ON CONFLICT (id) DO NOTHING;

-- Insert sample product memory entries
INSERT INTO product_memory (category, title, content, language, priority) VALUES
('general', 'LOVE YOUNG品牌介绍', 'LOVE YOUNG（养乐）是马来西亚优质燕窝品牌，专注于提供新鲜、纯净的即食燕窝产品。所有产品均采用优质原料，经过严格品质检验。', 'zh', 10),
('ingredients', '燕窝主要成分', '燕窝含有丰富的唾液酸、蛋白质、氨基酸等营养成分。唾液酸有助于提升免疫力，蛋白质含量高达50%以上。', 'zh', 9),
('benefits', '燕窝功效', '长期食用燕窝可以：1.滋阴润肺 2.增强免疫力 3.美容养颜 4.孕期营养补充 5.改善呼吸系统', 'zh', 9),
('usage', '食用方法', '建议每日空腹食用1瓶（70ml），温度不超过40°C效果最佳。可直接食用或加入牛奶、蜂蜜等搭配。孕妇建议每日1瓶。', 'zh', 8),
('faq', '常见问题-保存方法', '未开封的燕窝建议冷藏保存，保质期为12个月。开封后请在24小时内食用完毕。运输过程全程冷链配送。', 'zh', 7)
ON CONFLICT DO NOTHING;

-- Insert sample partner memory entries
INSERT INTO partner_memory (category, title, content, language, priority) VALUES
('general', '经营人计划介绍', 'LOVE YOUNG经营人计划是一个共赢的商业合作模式。成为经营人后，您可以通过销售产品和发展团队获得丰厚收益。', 'zh', 10),
('commission', '收益模式', '经营人收益包括：1.直销佣金（20%-35%）2.团队管理奖金 3.季度业绩奖励 4.年度分红 5.RWA积分奖励', 'zh', 9),
('requirements', '加入条件', '成为经营人需要：1.年满18周岁 2.购买经营人套餐（起步套餐RM299起）3.完成在线培训 4.签署合作协议', 'zh', 9),
('benefits', '经营人福利', '经营人专属福利：1.产品成本价采购 2.专属营销素材 3.一对一导师指导 4.参与公司活动 5.优先试用新品', 'zh', 8),
('training', '培训体系', '我们提供完善的培训体系：1.产品知识培训 2.销售技巧课程 3.社交媒体运营 4.团队管理培训 5.每周线上分享会', 'zh', 8)
ON CONFLICT DO NOTHING;
