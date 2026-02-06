-- Migration 022: Content Creation & AI Writing System
-- Adds marketing_content table, pgvector for RAG, and links to existing tables

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Central content hub table
CREATE TABLE IF NOT EXISTS marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  content_type TEXT NOT NULL DEFAULT 'post' CHECK (content_type IN ('post', 'story', 'reel', 'video', 'article')),
  platform TEXT[] DEFAULT '{}',
  cover_image TEXT,
  media_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ai_generating', 'ready', 'published', 'archived')),
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  ai_model TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  campaign_id UUID,
  media_plan_id UUID,
  seo_keywords TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add embedding columns to memory tables for pgvector RAG
ALTER TABLE product_memory ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE customer_memory ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE partner_memory ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create vector similarity indexes (using ivfflat for performance)
-- Note: ivfflat requires data to build properly; for small datasets hnsw may be better
-- We use IF NOT EXISTS pattern via DO block
DO $$
BEGIN
  -- Only create indexes if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_product_memory_embedding') THEN
    CREATE INDEX idx_product_memory_embedding ON product_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customer_memory_embedding') THEN
    CREATE INDEX idx_customer_memory_embedding ON customer_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_partner_memory_embedding') THEN
    CREATE INDEX idx_partner_memory_embedding ON partner_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
  END IF;
END $$;

-- RPC function for similarity search on product memory
CREATE OR REPLACE FUNCTION match_product_memory(
  query_embedding vector(1536),
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  category text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.content,
    pm.category,
    1 - (pm.embedding <=> query_embedding) AS similarity
  FROM product_memory pm
  WHERE pm.embedding IS NOT NULL
  ORDER BY pm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Link content to media publishing plan
ALTER TABLE media_publishing_plan ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES marketing_content(id) ON DELETE SET NULL;

-- Link content to ad placement plans (array of content IDs)
ALTER TABLE ad_placement_plans ADD COLUMN IF NOT EXISTS content_ids UUID[] DEFAULT '{}';

-- Link content to ad creatives
ALTER TABLE marketing_ad_creatives ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES marketing_content(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE marketing_content ENABLE ROW LEVEL SECURITY;

-- RLS policies for marketing_content
CREATE POLICY "Admin full access to marketing_content"
  ON marketing_content FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin'));

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_marketing_content_status ON marketing_content(status);
CREATE INDEX IF NOT EXISTS idx_marketing_content_created_at ON marketing_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_content_product_id ON marketing_content(product_id);
CREATE INDEX IF NOT EXISTS idx_marketing_content_ai_generated ON marketing_content(ai_generated);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_marketing_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_marketing_content_updated_at ON marketing_content;
CREATE TRIGGER trigger_marketing_content_updated_at
  BEFORE UPDATE ON marketing_content
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_content_updated_at();
