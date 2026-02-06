-- 018: Marketing Management tables
-- Meta ad accounts, campaigns, ad sets, creatives, performance, XHS content, media plans, ad placement plans, media assets

-- Meta Ad Accounts
CREATE TABLE IF NOT EXISTS meta_ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'facebook' CHECK (platform IN ('facebook', 'instagram', 'both')),
  access_token TEXT,
  pixel_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled')),
  currency TEXT NOT NULL DEFAULT 'MYR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
  daily_budget_limit INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketing Campaigns
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID REFERENCES meta_ad_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'facebook' CHECK (platform IN ('facebook', 'instagram', 'both', 'xiaohongshu')),
  objective TEXT NOT NULL DEFAULT 'awareness' CHECK (objective IN ('awareness', 'traffic', 'engagement', 'leads', 'conversions', 'sales')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  budget_type TEXT NOT NULL DEFAULT 'daily' CHECK (budget_type IN ('daily', 'lifetime')),
  budget_amount INTEGER NOT NULL DEFAULT 0,
  spent_amount INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  target_audience JSONB DEFAULT '{}',
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketing Ad Sets
CREATE TABLE IF NOT EXISTS marketing_ad_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  budget_amount INTEGER NOT NULL DEFAULT 0,
  spent_amount INTEGER NOT NULL DEFAULT 0,
  targeting JSONB DEFAULT '{}',
  placements JSONB DEFAULT '{}',
  schedule JSONB DEFAULT '{}',
  bid_strategy TEXT DEFAULT 'lowest_cost',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketing Ad Creatives
CREATE TABLE IF NOT EXISTS marketing_ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_set_id UUID NOT NULL REFERENCES marketing_ad_sets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  creative_type TEXT NOT NULL DEFAULT 'image' CHECK (creative_type IN ('image', 'video', 'carousel', 'collection')),
  headline TEXT,
  body_text TEXT,
  call_to_action TEXT DEFAULT 'LEARN_MORE',
  media_urls TEXT[],
  link_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'rejected')),
  performance_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketing Performance (daily snapshots)
CREATE TABLE IF NOT EXISTS marketing_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  ad_set_id UUID REFERENCES marketing_ad_sets(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  spend INTEGER NOT NULL DEFAULT 0,
  revenue INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0,
  cpc INTEGER DEFAULT 0,
  cpm INTEGER DEFAULT 0,
  roas NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Xiaohongshu Content
CREATE TABLE IF NOT EXISTS xhs_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  content_type TEXT NOT NULL DEFAULT 'note' CHECK (content_type IN ('note', 'video', 'live')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'archived')),
  cover_image TEXT,
  media_urls TEXT[],
  tags TEXT[],
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Media Publishing Plan (calendar)
CREATE TABLE IF NOT EXISTS media_publishing_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'xiaohongshu', 'tiktok', 'youtube', 'website')),
  content_type TEXT NOT NULL DEFAULT 'post' CHECK (content_type IN ('post', 'story', 'reel', 'video', 'article', 'live')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'ready', 'published', 'cancelled')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  assigned_to TEXT,
  content_url TEXT,
  media_urls TEXT[],
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ad Placement Plans (with approval workflow)
CREATE TABLE IF NOT EXISTS ad_placement_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'both', 'xiaohongshu', 'google', 'tiktok')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
  total_budget INTEGER NOT NULL DEFAULT 0,
  daily_budget INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  target_audience JSONB DEFAULT '{}',
  kpi_targets JSONB DEFAULT '{}',
  approval_notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Media Assets
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'audio')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER DEFAULT 0,
  dimensions TEXT,
  tags TEXT[],
  used_in TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE meta_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE xhs_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_publishing_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_placement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (matching existing pattern from other migrations)
CREATE POLICY "admin_meta_ad_accounts" ON meta_ad_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_marketing_campaigns" ON marketing_campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_marketing_ad_sets" ON marketing_ad_sets FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_marketing_ad_creatives" ON marketing_ad_creatives FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_marketing_performance" ON marketing_performance FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_xhs_content" ON xhs_content FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_media_publishing_plan" ON media_publishing_plan FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_ad_placement_plans" ON ad_placement_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);
CREATE POLICY "admin_media_assets" ON media_assets FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE members.user_id = auth.uid() AND members.role = 'admin')
);

-- Indexes
CREATE INDEX idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX idx_marketing_campaigns_platform ON marketing_campaigns(platform);
CREATE INDEX idx_marketing_performance_date ON marketing_performance(date);
CREATE INDEX idx_marketing_performance_campaign ON marketing_performance(campaign_id);
CREATE INDEX idx_xhs_content_status ON xhs_content(status);
CREATE INDEX idx_media_publishing_plan_date ON media_publishing_plan(scheduled_date);
CREATE INDEX idx_ad_placement_plans_status ON ad_placement_plans(status);
