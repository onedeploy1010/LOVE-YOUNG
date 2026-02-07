-- 027: AI Knowledge Base Binding
-- Add knowledge_base_ids column to ai_bot_config to store selected knowledge base article IDs

-- Add column for storing selected knowledge base article IDs
ALTER TABLE ai_bot_config ADD COLUMN IF NOT EXISTS knowledge_base_ids TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN ai_bot_config.knowledge_base_ids IS 'Array of ai_knowledge_base IDs that this bot should use for context';
