-- 020: AI Customer Service tables
-- Bot config, AI conversations, AI messages + default bot configs

-- AI Bot Config
CREATE TABLE IF NOT EXISTS ai_bot_config (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  system_prompt TEXT NOT NULL DEFAULT '',
  knowledge_base JSONB DEFAULT '[]',
  greeting_message TEXT NOT NULL DEFAULT '您好！有什么可以帮助您的？',
  fallback_message TEXT NOT NULL DEFAULT '抱歉，我无法理解您的问题。让我为您转接人工客服。',
  model TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
  max_tokens INTEGER NOT NULL DEFAULT 500,
  response_language TEXT NOT NULL DEFAULT 'zh',
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id TEXT NOT NULL REFERENCES ai_bot_config(id) ON DELETE CASCADE,
  whatsapp_conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL,
  customer_phone TEXT,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'escalated', 'failed')),
  message_count INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  escalation_reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  confidence NUMERIC(3,2),
  intent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "admin_ai_bot_config" ON ai_bot_config FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_ai_conversations" ON ai_conversations FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_ai_messages" ON ai_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);

-- Indexes
CREATE INDEX idx_ai_conversations_bot ON ai_conversations(bot_id);
CREATE INDEX idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);

-- Insert default bot configs
INSERT INTO ai_bot_config (id, name, description, system_prompt, greeting_message, fallback_message, tags) VALUES
(
  'business_plan',
  '商业计划咨询',
  '回答关于LOVE YOUNG经营人计划、加盟条件、收益模式等问题',
  '你是LOVE YOUNG的商业计划咨询助手。你需要帮助用户了解我们的经营人计划，包括加盟条件、投资回报、市场支持等。请用专业但友好的语气回答。',
  '您好！我是LOVE YOUNG商业计划咨询助手。想了解我们的经营人计划吗？请问您有什么问题？',
  '抱歉，这个问题我需要请专业顾问为您解答。让我为您转接人工客服。',
  ARRAY['business', 'partner', 'join']
),
(
  'product_info',
  '产品咨询',
  '回答关于LOVE YOUNG产品成分、功效、适用人群等问题',
  '你是LOVE YOUNG的产品咨询助手。你需要帮助用户了解我们的燕窝产品，包括成分、功效、适用人群、食用方法等。请提供准确的产品信息。',
  '您好！我是LOVE YOUNG产品咨询助手。我可以为您介绍我们的燕窝产品。请问您想了解哪款产品？',
  '抱歉，关于这个产品问题我需要更多信息。让我为您转接产品专家。',
  ARRAY['product', 'ingredient', 'health']
),
(
  'order_service',
  '订单服务',
  '处理订单查询、物流追踪、退换货等问题',
  '你是LOVE YOUNG的订单服务助手。你需要帮助用户查询订单状态、物流信息、处理退换货请求等。请耐心处理每个问题。',
  '您好！我是LOVE YOUNG订单服务助手。请问您需要查询订单还是有其他问题？',
  '抱歉，这个问题需要人工处理。让我为您转接客服专员。',
  ARRAY['order', 'shipping', 'return']
),
(
  'sales_support',
  '销售支持',
  '协助经营人进行销售话术、客户跟进、促销方案等',
  '你是LOVE YOUNG的销售支持助手。你需要帮助经营人提供销售话术、客户跟进建议、促销方案等。请提供实用的销售建议。',
  '您好！我是LOVE YOUNG销售支持助手。需要销售话术还是客户跟进建议？',
  '这个情况比较特殊，建议联系您的上级经营人或区域经理获取更多支持。',
  ARRAY['sales', 'marketing', 'partner']
)
ON CONFLICT (id) DO NOTHING;
