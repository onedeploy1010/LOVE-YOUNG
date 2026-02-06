-- 024: Marketing Restructure - Link ad_placement_plans to marketing_campaigns
ALTER TABLE ad_placement_plans ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_ad_placement_plans_campaign ON ad_placement_plans(campaign_id);
