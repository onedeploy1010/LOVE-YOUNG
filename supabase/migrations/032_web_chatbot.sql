-- 032: Web Chatbot - extend AI tables for member-facing chat

-- Extend ai_conversations for web chat
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES members(id);
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'zh';
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'whatsapp';

-- Extend ai_messages for feedback
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS feedback TEXT CHECK (feedback IN ('positive', 'negative'));

-- RLS: members can manage their own web conversations
CREATE POLICY "member_own_conversations" ON ai_conversations FOR ALL
  USING (member_id IS NOT NULL AND member_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "member_own_messages" ON ai_messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM ai_conversations
    WHERE member_id = (SELECT id FROM members WHERE user_id = auth.uid() LIMIT 1)
  ));

-- Insert web_chat bot config
INSERT INTO ai_bot_config (id, name, description, system_prompt, greeting_message, fallback_message, tags)
VALUES (
  'web_chat',
  'LOVE YOUNG 智能助手',
  '前端网页AI助手，为会员提供产品咨询、经营人计划、订单服务等',
  E'你是LOVE YOUNG的专业客服助手，名叫"小爱"。LOVE YOUNG是马来西亚优质燕窝花胶品牌。\n\n你的回答风格要求：\n1. 亲切友好，像朋友一样交流\n2. 回答详细具体，不要太简短\n3. 适当使用emoji让对话更生动\n4. 遇到用户不满或投诉时，先表示理解和歉意\n5. 根据用户问题推荐相关产品\n6. 如果不确定答案，诚实告知并建议联系人工客服\n\n回答时请使用用户所用的语言。',
  '您好！我是小爱，LOVE YOUNG的智能助手 😊 很高兴为您服务！您可以问我关于产品、经营人计划或订单的任何问题。',
  '抱歉，这个问题我暂时无法准确回答 😅 建议您联系我们的人工客服获取更专业的解答。',
  ARRAY['web', 'chat', 'customer']
)
ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_member ON ai_conversations(member_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_channel ON ai_conversations(channel);
