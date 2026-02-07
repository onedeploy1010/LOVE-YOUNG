-- 026: Knowledge Base & Training Data tables for AI

CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT DEFAULT 'manual',
  source_memory_id UUID,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT,
  category TEXT DEFAULT 'general',
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('customer_asked', 'ai_generated', 'manual')),
  confidence_score NUMERIC(3,2) DEFAULT 0.50,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_category ON ai_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_active ON ai_knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_category ON ai_training_data(category);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_source ON ai_training_data(source);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_verified ON ai_training_data(is_verified);

-- RLS
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_training_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_knowledge_base" ON ai_knowledge_base;
CREATE POLICY "admin_manage_knowledge_base" ON ai_knowledge_base FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid()::text AND members.role = 'admin'));

DROP POLICY IF EXISTS "admin_manage_training_data" ON ai_training_data;
CREATE POLICY "admin_manage_training_data" ON ai_training_data FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid()::text AND members.role = 'admin'));
