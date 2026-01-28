-- Migration: Auto Member Triggers
-- Description:
--   1. 用户注册时自动创建 users 表记录
--   2. 下单成功后（订单状态变为 delivered）自动升级为 member

-- =====================================================
-- 1. 用户注册时自动创建 users 表记录
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), users.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), users.last_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 触发器：在 auth.users 新增时自动创建 public.users 记录
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =====================================================
-- 2. 下单成功后自动创建/升级 member
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_order_delivered_member()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_member_id uuid;
  v_existing_member_id uuid;
BEGIN
  -- 只在订单状态变为 delivered 时触发
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN

    -- 尝试通过 email 找到对应的 user
    SELECT id INTO v_user_id
    FROM users
    WHERE email = NEW.customer_email
    LIMIT 1;

    -- 如果找不到 user，跳过 member 创建（用户可能是游客购买）
    IF v_user_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- 检查是否已经有 member 记录
    SELECT id INTO v_existing_member_id
    FROM members
    WHERE user_id = v_user_id
    LIMIT 1;

    IF v_existing_member_id IS NULL THEN
      -- 生成唯一的推荐码
      v_member_id := gen_random_uuid();

      -- 创建新的 member 记录
      INSERT INTO members (
        id,
        user_id,
        name,
        phone,
        email,
        role,
        points_balance,
        referral_code,
        created_at
      ) VALUES (
        v_member_id,
        v_user_id,
        NEW.customer_name,
        NEW.customer_phone,
        NEW.customer_email,
        'member',
        0,
        'LY' || UPPER(SUBSTRING(MD5(v_member_id::text) FROM 1 FOR 6)),
        NOW()
      );

      -- 更新 users 表的 role
      UPDATE users SET role = 'member' WHERE id = v_user_id AND role = 'user';

      -- 更新订单的 member_id
      UPDATE orders SET member_id = v_member_id WHERE id = NEW.id;

      RAISE NOTICE 'Created new member for user % with member_id %', v_user_id, v_member_id;
    ELSE
      -- 更新订单的 member_id（如果还没有设置）
      IF NEW.member_id IS NULL THEN
        UPDATE orders SET member_id = v_existing_member_id WHERE id = NEW.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 触发器：订单状态变为 delivered 时创建 member
DROP TRIGGER IF EXISTS trg_order_delivered_create_member ON orders;
CREATE TRIGGER trg_order_delivered_create_member
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND OLD.status != 'delivered')
  EXECUTE FUNCTION public.handle_order_delivered_member();

-- 也为新订单创建时检查（如果订单直接创建为 delivered 状态）
DROP TRIGGER IF EXISTS trg_order_insert_create_member ON orders;
CREATE TRIGGER trg_order_insert_create_member
  AFTER INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION public.handle_order_delivered_member();

-- =====================================================
-- 3. 确保 members 表有必要的字段
-- =====================================================
DO $$
BEGIN
  -- 添加 referral_code 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE members ADD COLUMN referral_code VARCHAR(20);
  END IF;

  -- 添加 referrer_id 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'referrer_id'
  ) THEN
    ALTER TABLE members ADD COLUMN referrer_id UUID REFERENCES members(id);
  END IF;
END $$;

-- =====================================================
-- 4. 为现有订单补充创建 member（一次性迁移）
-- =====================================================
DO $$
DECLARE
  v_order RECORD;
  v_user_id uuid;
  v_member_id uuid;
BEGIN
  -- 遍历所有已交付但没有 member 的订单
  FOR v_order IN
    SELECT o.* FROM orders o
    WHERE o.status = 'delivered'
    AND o.member_id IS NULL
    AND o.customer_email IS NOT NULL
  LOOP
    -- 找到对应的 user
    SELECT id INTO v_user_id FROM users WHERE email = v_order.customer_email LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      -- 检查是否已有 member
      SELECT id INTO v_member_id FROM members WHERE user_id = v_user_id LIMIT 1;

      IF v_member_id IS NULL THEN
        -- 创建新 member
        v_member_id := gen_random_uuid();
        INSERT INTO members (id, user_id, name, phone, email, role, points_balance, referral_code, created_at)
        VALUES (
          v_member_id,
          v_user_id,
          v_order.customer_name,
          v_order.customer_phone,
          v_order.customer_email,
          'member',
          0,
          'LY' || UPPER(SUBSTRING(MD5(v_member_id::text) FROM 1 FOR 6)),
          NOW()
        );

        UPDATE users SET role = 'member' WHERE id = v_user_id AND role = 'user';
      END IF;

      -- 更新订单
      UPDATE orders SET member_id = v_member_id WHERE id = v_order.id;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- 5. 设置 admin 用户权限
-- =====================================================
UPDATE users SET role = 'admin' WHERE email = 'admin@alpha-centauri.io';

-- 输出完成信息
DO $$
BEGIN
  RAISE NOTICE 'Migration 004_auto_member_triggers completed successfully';
END $$;
