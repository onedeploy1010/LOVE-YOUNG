-- ============================================
-- 2026发财礼盒 Product & Inventory Setup
-- ============================================
-- Product: 2026发财礼盒 (Fortune Gift Box 2026)
-- Original Price: RM 488
-- Member Price: RM 368
-- Contains: 6 bottles, choose from 12 flavors (can repeat)

-- Clear existing products (optional - comment out if you want to keep them)
-- TRUNCATE products CASCADE;

-- ============================================
-- Create Main Gift Box Product
-- ============================================
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES (
  'giftbox-2026-fortune',
  '2026发财礼盒',
  '2026 Fortune Gift Box',
  '精选燕窝礼盒，含6瓶即食燕窝，可从12种口味中任选，送礼自用皆宜。原价RM488，会员优惠价RM368。',
  36800, -- RM 368 in cents (member price)
  'box',
  '/images/giftbox-2026.jpg',
  'gift-box',
  true,
  'GIFTBOX-2026-FORTUNE'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  featured = EXCLUDED.featured;

-- ============================================
-- Create 12 Flavor Products (Individual Bottles)
-- ============================================
-- These are used for inventory tracking per flavor

-- 1. 原味燕窝
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES ('flavor-original', '原味燕窝', 'Original Bird Nest', '经典原味，燕窝本真滋味', 0, 'bottle', '/images/flavors/original.jpg', 'bird-nest', false, 'BN-ORIG-75')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en;

-- 2. 红枣燕窝
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES ('flavor-redDate', '红枣燕窝', 'Red Date Bird Nest', '红枣养血，温补气血', 0, 'bottle', '/images/flavors/redDate.jpg', 'bird-nest', false, 'BN-RDAT-75')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en;

-- 3. 雪梨燕窝
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES ('flavor-snowPear', '雪梨燕窝', 'Snow Pear Bird Nest', '雪梨润肺，清润甘甜', 0, 'bottle', '/images/flavors/snowPear.jpg', 'bird-nest', false, 'BN-SPEA-75')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en;

-- 4. 桃胶燕窝
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES ('flavor-peachGum', '桃胶燕窝', 'Peach Gum Bird Nest', '桃胶美颜，胶原满满', 0, 'bottle', '/images/flavors/peachGum.jpg', 'bird-nest', false, 'BN-PGUM-75')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en;

-- 5. 椰子燕窝
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES ('flavor-coconut', '椰子燕窝', 'Coconut Bird Nest', '椰香四溢，热带风情', 0, 'bottle', '/images/flavors/coconut.jpg', 'bird-nest', false, 'BN-COCO-75')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en;

-- 6. 芒果燕窝
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES ('flavor-mango', '芒果燕窝', 'Mango Bird Nest', '芒果香甜，热带鲜果', 0, 'bottle', '/images/flavors/mango.jpg', 'bird-nest', false, 'BN-MANG-75')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en;

-- 7. 可可燕麦燕窝
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES ('flavor-cocoaOat', '可可燕麦燕窝', 'Cocoa Oat Bird Nest', '可可燕麦，浓郁丝滑', 0, 'bottle', '/images/flavors/cocoaOat.jpg', 'bird-nest', false, 'BN-COAT-75')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en;

-- 8. 抹茶燕麦燕窝
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES ('flavor-matchaOat', '抹茶燕麦燕窝', 'Matcha Oat Bird Nest', '抹茶清香，健康养生', 0, 'bottle', '/images/flavors/matchaOat.jpg', 'bird-nest', false, 'BN-MOAT-75')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en;

-- 9. 紫米燕麦燕窝
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES ('flavor-purpleRiceOat', '紫米燕麦燕窝', 'Purple Rice Oat Bird Nest', '紫米营养，谷物健康', 0, 'bottle', '/images/flavors/purpleRiceOat.jpg', 'bird-nest', false, 'BN-POAT-75')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en;

-- 10. 桃胶桂圆燕窝
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES ('flavor-peachGumLongan', '桃胶桂圆燕窝', 'Peach Gum Longan Bird Nest', '桃胶桂圆，养颜安神', 0, 'bottle', '/images/flavors/peachGumLongan.jpg', 'bird-nest', false, 'BN-PGLN-75')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en;

-- 11. 枣杞燕窝
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES ('flavor-dateGoji', '枣杞燕窝', 'Date Goji Bird Nest', '红枣枸杞，补血明目', 0, 'bottle', '/images/flavors/dateGoji.jpg', 'bird-nest', false, 'BN-DGOJ-75')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en;

-- 12. 木瓜燕窝
INSERT INTO products (id, name, name_en, description, price, price_unit, image, category, featured, erpnext_item_code)
VALUES ('flavor-papaya', '木瓜燕窝', 'Papaya Bird Nest', '木瓜丰胸，美容养颜', 0, 'bottle', '/images/flavors/papaya.jpg', 'bird-nest', false, 'BN-PAPY-75')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_en = EXCLUDED.name_en;

-- ============================================
-- Create Inventory Records for Gift Box
-- ============================================
INSERT INTO inventory (id, product_id, sku, name, category, quantity, unit, min_stock, cost_price, location, created_at, updated_at)
VALUES (
  'inv-giftbox-2026',
  'giftbox-2026-fortune',
  'GIFTBOX-2026-FORTUNE',
  '2026发财礼盒',
  'gift-box',
  100, -- Initial stock: 100 boxes
  'box',
  10, -- Minimum stock alert
  18000, -- Cost price RM 180 in cents
  'Warehouse A',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  updated_at = NOW();

-- ============================================
-- Create Inventory Records for Each Flavor (Bottles)
-- ============================================
INSERT INTO inventory (id, product_id, sku, name, category, quantity, unit, min_stock, cost_price, location, created_at, updated_at)
VALUES
  ('inv-original', 'flavor-original', 'BN-ORIG-75', '原味燕窝', 'bird-nest', 500, 'bottle', 50, 3000, 'Warehouse A', NOW(), NOW()),
  ('inv-redDate', 'flavor-redDate', 'BN-RDAT-75', '红枣燕窝', 'bird-nest', 500, 'bottle', 50, 3000, 'Warehouse A', NOW(), NOW()),
  ('inv-snowPear', 'flavor-snowPear', 'BN-SPEA-75', '雪梨燕窝', 'bird-nest', 500, 'bottle', 50, 3000, 'Warehouse A', NOW(), NOW()),
  ('inv-peachGum', 'flavor-peachGum', 'BN-PGUM-75', '桃胶燕窝', 'bird-nest', 500, 'bottle', 50, 3000, 'Warehouse A', NOW(), NOW()),
  ('inv-coconut', 'flavor-coconut', 'BN-COCO-75', '椰子燕窝', 'bird-nest', 500, 'bottle', 50, 3000, 'Warehouse A', NOW(), NOW()),
  ('inv-mango', 'flavor-mango', 'BN-MANG-75', '芒果燕窝', 'bird-nest', 500, 'bottle', 50, 3000, 'Warehouse A', NOW(), NOW()),
  ('inv-cocoaOat', 'flavor-cocoaOat', 'BN-COAT-75', '可可燕麦燕窝', 'bird-nest', 500, 'bottle', 50, 3000, 'Warehouse A', NOW(), NOW()),
  ('inv-matchaOat', 'flavor-matchaOat', 'BN-MOAT-75', '抹茶燕麦燕窝', 'bird-nest', 500, 'bottle', 50, 3000, 'Warehouse A', NOW(), NOW()),
  ('inv-purpleRiceOat', 'flavor-purpleRiceOat', 'BN-POAT-75', '紫米燕麦燕窝', 'bird-nest', 500, 'bottle', 50, 3000, 'Warehouse A', NOW(), NOW()),
  ('inv-peachGumLongan', 'flavor-peachGumLongan', 'BN-PGLN-75', '桃胶桂圆燕窝', 'bird-nest', 500, 'bottle', 50, 3000, 'Warehouse A', NOW(), NOW()),
  ('inv-dateGoji', 'flavor-dateGoji', 'BN-DGOJ-75', '枣杞燕窝', 'bird-nest', 500, 'bottle', 50, 3000, 'Warehouse A', NOW(), NOW()),
  ('inv-papaya', 'flavor-papaya', 'BN-PAPY-75', '木瓜燕窝', 'bird-nest', 500, 'bottle', 50, 3000, 'Warehouse A', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  updated_at = NOW();

-- ============================================
-- Trigger: Deduct both gift box AND flavor inventory on order
-- ============================================
CREATE OR REPLACE FUNCTION trigger_order_inventory_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_item JSONB;
  v_sku TEXT;
  v_quantity INTEGER;
  v_inventory_id VARCHAR;
  v_box_count INTEGER := 0;
BEGIN
  -- Only process when order is confirmed (pending or processing)
  IF NEW.status NOT IN ('pending', 'processing') THEN
    RETURN NEW;
  END IF;

  -- Skip if already processed
  IF OLD IS NOT NULL AND OLD.status IN ('pending', 'processing') THEN
    RETURN NEW;
  END IF;

  -- Parse items JSON and deduct flavor inventory
  FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items::jsonb)
  LOOP
    v_sku := v_item->>'sku';
    v_quantity := COALESCE((v_item->>'quantity')::integer, 1);
    v_box_count := v_box_count + v_quantity;

    IF v_sku IS NOT NULL THEN
      -- Find inventory by SKU
      SELECT id INTO v_inventory_id FROM inventory WHERE sku = v_sku;

      IF v_inventory_id IS NOT NULL THEN
        -- Deduct flavor quantity
        UPDATE inventory
        SET quantity = GREATEST(0, COALESCE(quantity, 0) - v_quantity),
            updated_at = NOW()
        WHERE id = v_inventory_id;

        -- Record ledger entry
        INSERT INTO inventory_ledger (id, inventory_id, type, quantity, reference_type, reference_id, notes, created_at)
        VALUES (
          gen_random_uuid()::text,
          v_inventory_id,
          'out',
          -v_quantity,
          'order',
          NEW.id,
          'Order #' || NEW.order_number || ' - Flavor deduction',
          NOW()
        );
      END IF;
    END IF;
  END LOOP;

  -- Deduct gift box inventory (1 box per 6 bottles)
  -- For the 2026 gift box, each order = 1 box (6 bottles)
  IF v_box_count > 0 THEN
    UPDATE inventory
    SET quantity = GREATEST(0, COALESCE(quantity, 0) - 1),
        updated_at = NOW()
    WHERE sku = 'GIFTBOX-2026-FORTUNE';

    INSERT INTO inventory_ledger (id, inventory_id, type, quantity, reference_type, reference_id, notes, created_at)
    SELECT
      gen_random_uuid()::text,
      id,
      'out',
      -1,
      'order',
      NEW.id,
      'Order #' || NEW.order_number || ' - Gift box deduction',
      NOW()
    FROM inventory WHERE sku = 'GIFTBOX-2026-FORTUNE';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the old trigger
DROP TRIGGER IF EXISTS trg_order_inventory_deduct ON orders;
DROP TRIGGER IF EXISTS trg_order_inventory_complete ON orders;

CREATE TRIGGER trg_order_inventory_complete
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_inventory_complete();

-- ============================================
-- View: Inventory Summary with Low Stock Alert
-- ============================================
CREATE OR REPLACE VIEW inventory_summary AS
SELECT
  i.id,
  i.sku,
  i.name,
  i.category,
  i.quantity,
  i.min_stock,
  i.unit,
  CASE WHEN i.quantity <= i.min_stock THEN true ELSE false END as low_stock,
  p.name as product_name,
  p.name_en as product_name_en
FROM inventory i
LEFT JOIN products p ON i.product_id = p.id
ORDER BY
  CASE WHEN i.quantity <= i.min_stock THEN 0 ELSE 1 END,
  i.quantity ASC;
