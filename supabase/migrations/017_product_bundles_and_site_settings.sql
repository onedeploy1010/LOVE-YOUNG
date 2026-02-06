-- Product Bundles (套装配套) table
-- Each bundle contains 6 jars with fixed flavor combinations

CREATE TABLE IF NOT EXISTS public.product_bundles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  name_ms TEXT,
  description TEXT,
  description_en TEXT,
  description_ms TEXT,
  target_audience TEXT,           -- 适用人群 e.g. "怀孕 / 备孕"
  target_audience_en TEXT,
  target_audience_ms TEXT,
  keywords TEXT,                  -- 关键词 e.g. "稳胎｜补血｜温和不刺激"
  keywords_en TEXT,
  keywords_ms TEXT,
  price INTEGER NOT NULL DEFAULT 22600,  -- 默认 RM 226 x 6 = 1356, 但套装可能有折扣
  original_price INTEGER,         -- 原价用于显示折扣
  image TEXT,                     -- 套装封面图
  items JSONB NOT NULL,           -- 包含的口味组合 [{"flavor": "原味红枣花胶", "quantity": 2}, ...]
  sort_order INTEGER DEFAULT 0,   -- 排序
  is_active BOOLEAN DEFAULT true, -- 是否上架
  is_featured BOOLEAN DEFAULT false, -- 是否在首页优选展示
  is_hot BOOLEAN DEFAULT false,   -- 热卖标签
  is_new BOOLEAN DEFAULT false,   -- 新品标签
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings for homepage configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Insert default site settings
INSERT INTO public.site_settings (id, value) VALUES
  ('hero', '{
    "bundle_id": null,
    "title": "养生美颜 · 源自天然",
    "title_en": "Natural Beauty · From Nature",
    "title_ms": "Kecantikan Semula Jadi",
    "subtitle": "马来西亚顶级燕窝花胶 · 匠心鲜炖",
    "subtitle_en": "Premium Malaysian Bird Nest & Fish Maw · Freshly Stewed",
    "subtitle_ms": "Sarang Burung & Pundi Ikan Premium Malaysia",
    "button_text": "立即选购",
    "button_text_en": "Shop Now",
    "button_text_ms": "Beli Sekarang",
    "button_link": "/#products",
    "background_image": "/pics/love_young_brand_identity_20260106043554_1.png"
  }'::jsonb),
  ('featured_bundles', '{
    "title": "精选套装",
    "title_en": "Featured Bundles",
    "title_ms": "Pakej Pilihan",
    "bundle_ids": []
  }'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Insert the 12 product bundles
INSERT INTO public.product_bundles (id, name, name_en, name_ms, target_audience, target_audience_en, target_audience_ms, keywords, keywords_en, keywords_ms, price, items, sort_order, is_active, is_featured) VALUES

('bundle-pregnancy', '孕期安心滋养', 'Pregnancy Nourishment', 'Penjagaan Kehamilan',
 '怀孕 / 备孕', 'Pregnancy / Trying to conceive', 'Hamil / Merancang kehamilan',
 '稳胎｜补血｜温和不刺激', 'Stabilize pregnancy | Nourish blood | Gentle', 'Stabil kehamilan | Tambah darah | Lembut',
 135600, '[{"flavor": "原味红枣花胶", "quantity": 2}, {"flavor": "枣杞燕窝", "quantity": 2}, {"flavor": "桃胶桂圆花胶", "quantity": 1}, {"flavor": "紫米燕麦花胶", "quantity": 1}]'::jsonb,
 1, true, true),

('bundle-postpartum', '产后修复回元', 'Postpartum Recovery', 'Pemulihan Selepas Bersalin',
 '生产后 1-3 个月', 'Postpartum 1-3 months', '1-3 bulan selepas bersalin',
 '修复｜回气血｜恢复体力', 'Recovery | Restore energy | Regain strength', 'Pemulihan | Pulihkan tenaga | Kembali kuat',
 135600, '[{"flavor": "原味红枣花胶", "quantity": 2}, {"flavor": "桃胶桂圆花胶", "quantity": 2}, {"flavor": "桃胶燕窝", "quantity": 1}, {"flavor": "枣杞燕窝", "quantity": 1}]'::jsonb,
 2, true, true),

('bundle-collagen', '胶原蛋白美颜', 'Collagen Beauty', 'Kolagen Kecantikan',
 '脸色暗沉 / 抗老', 'Dull skin / Anti-aging', 'Kulit kusam / Anti-penuaan',
 '胶原｜透亮｜紧致弹润', 'Collagen | Radiant | Firm & supple', 'Kolagen | Berseri | Tegang & lembut',
 135600, '[{"flavor": "桃胶燕窝", "quantity": 2}, {"flavor": "桃胶桂圆花胶", "quantity": 2}, {"flavor": "木瓜燕窝", "quantity": 1}, {"flavor": "原味红枣花胶", "quantity": 1}]'::jsonb,
 3, true, true),

('bundle-diet', '轻断食代餐', 'Light Meal Replacement', 'Pengganti Makanan Ringan',
 '瘦身 / 控制食量', 'Weight loss / Portion control', 'Kurus / Kawal makan',
 '代餐｜饱腹｜低负担', 'Meal replacement | Filling | Low burden', 'Ganti makan | Kenyang | Ringan',
 135600, '[{"flavor": "可可燕麦花胶", "quantity": 2}, {"flavor": "抹茶燕麦花胶", "quantity": 2}, {"flavor": "紫米燕麦花胶", "quantity": 2}]'::jsonb,
 4, true, false),

('bundle-fatigue', '熬夜恢复包', 'Fatigue Recovery', 'Pemulihan Keletihan',
 '长期疲劳 / 睡不好', 'Chronic fatigue / Poor sleep', 'Keletihan kronik / Tidur tak lena',
 '抗疲劳｜回气色｜精神修复', 'Anti-fatigue | Restore complexion | Mental recovery', 'Anti-keletihan | Pulihkan warna | Pemulihan mental',
 135600, '[{"flavor": "原味红枣花胶", "quantity": 2}, {"flavor": "桃胶桂圆花胶", "quantity": 2}, {"flavor": "枣杞燕窝", "quantity": 1}, {"flavor": "可可燕麦花胶", "quantity": 1}]'::jsonb,
 5, true, false),

('bundle-daily', '日常轻养护', 'Daily Wellness', 'Penjagaan Harian',
 '天天送礼 / 自吃', 'Daily gift / Self-consumption', 'Hadiah harian / Makan sendiri',
 '天天可吃｜均衡养护', 'Daily consumption | Balanced care', 'Makan setiap hari | Penjagaan seimbang',
 135600, '[{"flavor": "木瓜燕窝", "quantity": 1}, {"flavor": "桃胶燕窝", "quantity": 1}, {"flavor": "原味红枣花胶", "quantity": 1}, {"flavor": "紫米燕麦花胶", "quantity": 1}, {"flavor": "抹茶燕麦花胶", "quantity": 1}, {"flavor": "可可燕麦花胶", "quantity": 1}]'::jsonb,
 6, true, false),

('bundle-surgery', '术后修复', 'Post-Surgery Recovery', 'Pemulihan Selepas Pembedahan',
 '医美 / 剖腹 / 疤痕', 'Aesthetics / C-section / Scars', 'Estetik / Pembedahan / Parut',
 '修复疤痕｜组织再生｜恢复期必备', 'Scar repair | Tissue regeneration | Recovery essential', 'Baiki parut | Regenerasi tisu | Penting pemulihan',
 135600, '[{"flavor": "桃胶燕窝", "quantity": 3}, {"flavor": "原味红枣花胶", "quantity": 1}, {"flavor": "桃胶桂圆花胶", "quantity": 1}, {"flavor": "木瓜燕窝", "quantity": 1}]'::jsonb,
 7, true, false),

('bundle-blood', '补血暖宫', 'Blood Nourishment', 'Tambah Darah',
 '手脚冰冷 / 经后', 'Cold hands & feet / Post-period', 'Tangan & kaki sejuk / Selepas haid',
 '暖宫｜补血｜调体质', 'Warm womb | Nourish blood | Balance constitution', 'Hangatkan rahim | Tambah darah | Seimbang badan',
 135600, '[{"flavor": "原味红枣花胶", "quantity": 2}, {"flavor": "枣杞燕窝", "quantity": 2}, {"flavor": "桃胶桂圆花胶", "quantity": 1}, {"flavor": "紫米燕麦花胶", "quantity": 1}]'::jsonb,
 8, true, false),

('bundle-complexion', '气色回春', 'Complexion Revival', 'Pemulihan Warna Muka',
 '脸黄 / 气虚', 'Sallow complexion / Qi deficiency', 'Muka kuning / Kekurangan tenaga',
 '红润｜气色提升｜显年轻', 'Rosy | Improved complexion | Youthful', 'Merah merona | Warna baik | Nampak muda',
 135600, '[{"flavor": "原味红枣花胶", "quantity": 2}, {"flavor": "桃胶桂圆花胶", "quantity": 2}, {"flavor": "木瓜燕窝", "quantity": 1}, {"flavor": "紫米燕麦花胶", "quantity": 1}]'::jsonb,
 9, true, false),

('bundle-office', '办公室代餐', 'Office Meal Replacement', 'Pengganti Makan Pejabat',
 '上班族', 'Office workers', 'Pekerja pejabat',
 '快速｜不油腻｜顶饱不困', 'Quick | Not greasy | Filling & energizing', 'Cepat | Tak berminyak | Kenyang & bertenaga',
 135600, '[{"flavor": "可可燕麦花胶", "quantity": 2}, {"flavor": "抹茶燕麦花胶", "quantity": 2}, {"flavor": "紫米燕麦花胶", "quantity": 1}, {"flavor": "原味红枣花胶", "quantity": 1}]'::jsonb,
 10, true, false),

('bundle-women', '女性呵护', 'Women Care', 'Penjagaan Wanita',
 '25-45 岁女性', 'Women aged 25-45', 'Wanita 25-45 tahun',
 '内调｜外养｜长期呵护', 'Internal balance | External nourishment | Long-term care', 'Keseimbangan dalaman | Pemakanan luaran | Penjagaan jangka panjang',
 135600, '[{"flavor": "原味红枣花胶", "quantity": 1}, {"flavor": "桃胶桂圆花胶", "quantity": 1}, {"flavor": "桃胶燕窝", "quantity": 1}, {"flavor": "枣杞燕窝", "quantity": 1}, {"flavor": "木瓜燕窝", "quantity": 1}, {"flavor": "紫米燕麦花胶", "quantity": 1}]'::jsonb,
 11, true, false),

('bundle-premium-gift', '高端滋补礼盒', 'Premium Gift Box', 'Kotak Hadiah Premium',
 '送长辈 / 客户', 'For elders / Clients', 'Untuk orang tua / Pelanggan',
 '高端送礼｜体面大方｜营养全面', 'Premium gift | Elegant | Comprehensive nutrition', 'Hadiah premium | Elegan | Nutrisi lengkap',
 135600, '[{"flavor": "原味红枣花胶", "quantity": 2}, {"flavor": "桃胶桂圆花胶", "quantity": 1}, {"flavor": "桃胶燕窝", "quantity": 1}, {"flavor": "枣杞燕窝", "quantity": 1}, {"flavor": "木瓜燕窝", "quantity": 1}]'::jsonb,
 12, true, true);

-- RLS policies for product_bundles
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active bundles" ON public.product_bundles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage bundles" ON public.product_bundles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid()::text AND role = 'admin')
  );

-- RLS policies for site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.site_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.members WHERE user_id = auth.uid()::text AND role = 'admin')
  );

-- Grants
GRANT SELECT ON public.product_bundles TO anon, authenticated;
GRANT ALL ON public.product_bundles TO authenticated;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO authenticated;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_bundles_active ON public.product_bundles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bundles_featured ON public.product_bundles(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_bundles_sort ON public.product_bundles(sort_order);
