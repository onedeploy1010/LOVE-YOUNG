-- Migration: Referral System
-- Description:
--   1. 创建递归推荐网络视图（所有会员角色：member, partner, admin）
--   2. 创建只筛选 partner 角色的推荐树视图
--   3. 添加处理推荐码注册的函数

-- =====================================================
-- 1. 确保 members 表有推荐相关字段
-- =====================================================
DO $$
BEGIN
  -- 添加 referral_code 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE members ADD COLUMN referral_code VARCHAR(20) UNIQUE;
  END IF;

  -- 添加 referrer_id 列（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'referrer_id'
  ) THEN
    ALTER TABLE members ADD COLUMN referrer_id UUID REFERENCES members(id);
  END IF;

  -- 为没有推荐码的会员生成推荐码
  UPDATE members
  SET referral_code = 'LY' || UPPER(SUBSTRING(MD5(id::text) FROM 1 FOR 6))
  WHERE referral_code IS NULL;
END $$;

-- =====================================================
-- 2. 创建递归推荐网络视图（10层，所有会员角色）
-- =====================================================
CREATE OR REPLACE VIEW member_referral_network AS
WITH RECURSIVE referral_tree AS (
  -- 基础层：所有顶级会员（没有推荐人的）
  SELECT
    m.id,
    m.user_id,
    m.name,
    m.email,
    m.phone,
    m.role,
    m.referral_code,
    m.referrer_id,
    m.points_balance,
    m.created_at,
    1 AS level,
    ARRAY[m.id] AS path,
    m.id AS root_id
  FROM members m
  WHERE m.referrer_id IS NULL

  UNION ALL

  -- 递归层：找到每个会员的下级（最多10层）
  SELECT
    m.id,
    m.user_id,
    m.name,
    m.email,
    m.phone,
    m.role,
    m.referral_code,
    m.referrer_id,
    m.points_balance,
    m.created_at,
    rt.level + 1 AS level,
    rt.path || m.id AS path,
    rt.root_id
  FROM members m
  INNER JOIN referral_tree rt ON m.referrer_id = rt.id
  WHERE rt.level < 10
    AND NOT (m.id = ANY(rt.path))  -- 防止循环引用
)
SELECT
  id,
  user_id,
  name,
  email,
  phone,
  role,
  referral_code,
  referrer_id,
  points_balance,
  created_at,
  level,
  path,
  root_id
FROM referral_tree;

-- =====================================================
-- 3. 创建只筛选 partner 角色的推荐树视图
-- =====================================================
CREATE OR REPLACE VIEW partner_referral_network AS
WITH RECURSIVE partner_tree AS (
  -- 基础层：顶级合伙人（没有推荐人或推荐人不是partner）
  SELECT
    m.id,
    m.user_id,
    m.name,
    m.email,
    m.phone,
    m.role,
    m.referral_code,
    m.referrer_id,
    m.points_balance,
    m.created_at,
    p.tier,
    p.status AS partner_status,
    p.ly_balance,
    p.rwa_tokens,
    p.total_sales,
    p.cash_wallet_balance,
    1 AS level,
    ARRAY[m.id] AS path,
    m.id AS root_id
  FROM members m
  INNER JOIN partners p ON p.member_id = m.id
  WHERE m.referrer_id IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM members rm
       INNER JOIN partners rp ON rp.member_id = rm.id
       WHERE rm.id = m.referrer_id
     )

  UNION ALL

  -- 递归层：找到每个合伙人的下级合伙人（最多10层）
  SELECT
    m.id,
    m.user_id,
    m.name,
    m.email,
    m.phone,
    m.role,
    m.referral_code,
    m.referrer_id,
    m.points_balance,
    m.created_at,
    p.tier,
    p.status AS partner_status,
    p.ly_balance,
    p.rwa_tokens,
    p.total_sales,
    p.cash_wallet_balance,
    pt.level + 1 AS level,
    pt.path || m.id AS path,
    pt.root_id
  FROM members m
  INNER JOIN partners p ON p.member_id = m.id
  INNER JOIN partner_tree pt ON m.referrer_id = pt.id
  WHERE pt.level < 10
    AND NOT (m.id = ANY(pt.path))  -- 防止循环引用
)
SELECT
  id,
  user_id,
  name,
  email,
  phone,
  role,
  referral_code,
  referrer_id,
  points_balance,
  created_at,
  tier,
  partner_status,
  ly_balance,
  rwa_tokens,
  total_sales,
  cash_wallet_balance,
  level,
  path,
  root_id
FROM partner_tree;

-- =====================================================
-- 4. 创建获取指定会员的下级网络函数
-- =====================================================
CREATE OR REPLACE FUNCTION get_member_downline(
  p_member_id UUID,
  p_max_level INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  role VARCHAR,
  referral_code VARCHAR,
  referrer_id UUID,
  points_balance INT,
  created_at TIMESTAMPTZ,
  level INT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE downline AS (
    -- 直接下级
    SELECT
      m.id,
      m.user_id,
      m.name,
      m.email,
      m.phone,
      m.role,
      m.referral_code,
      m.referrer_id,
      m.points_balance,
      m.created_at,
      1 AS level,
      ARRAY[m.id] AS path
    FROM members m
    WHERE m.referrer_id = p_member_id

    UNION ALL

    -- 递归下级
    SELECT
      m.id,
      m.user_id,
      m.name,
      m.email,
      m.phone,
      m.role,
      m.referral_code,
      m.referrer_id,
      m.points_balance,
      m.created_at,
      d.level + 1 AS level,
      d.path || m.id AS path
    FROM members m
    INNER JOIN downline d ON m.referrer_id = d.id
    WHERE d.level < p_max_level
      AND NOT (m.id = ANY(d.path))
  )
  SELECT
    downline.id,
    downline.user_id,
    downline.name,
    downline.email,
    downline.phone,
    downline.role,
    downline.referral_code,
    downline.referrer_id,
    downline.points_balance,
    downline.created_at,
    downline.level
  FROM downline
  ORDER BY downline.level, downline.created_at;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 5. 创建获取指定 Partner 的下级合伙人网络函数
-- =====================================================
CREATE OR REPLACE FUNCTION get_partner_downline(
  p_member_id UUID,
  p_max_level INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  role VARCHAR,
  referral_code VARCHAR,
  referrer_id UUID,
  tier VARCHAR,
  partner_status VARCHAR,
  ly_balance INT,
  rwa_tokens NUMERIC,
  total_sales INT,
  level INT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE partner_downline AS (
    -- 直接下级合伙人
    SELECT
      m.id,
      m.user_id,
      m.name,
      m.email,
      m.phone,
      m.role,
      m.referral_code,
      m.referrer_id,
      p.tier,
      p.status AS partner_status,
      p.ly_balance,
      p.rwa_tokens,
      p.total_sales,
      1 AS level,
      ARRAY[m.id] AS path
    FROM members m
    INNER JOIN partners p ON p.member_id = m.id
    WHERE m.referrer_id = p_member_id

    UNION ALL

    -- 递归下级合伙人
    SELECT
      m.id,
      m.user_id,
      m.name,
      m.email,
      m.phone,
      m.role,
      m.referral_code,
      m.referrer_id,
      p.tier,
      p.status AS partner_status,
      p.ly_balance,
      p.rwa_tokens,
      p.total_sales,
      pd.level + 1 AS level,
      pd.path || m.id AS path
    FROM members m
    INNER JOIN partners p ON p.member_id = m.id
    INNER JOIN partner_downline pd ON m.referrer_id = pd.id
    WHERE pd.level < p_max_level
      AND NOT (m.id = ANY(pd.path))
  )
  SELECT
    partner_downline.id,
    partner_downline.user_id,
    partner_downline.name,
    partner_downline.email,
    partner_downline.phone,
    partner_downline.role,
    partner_downline.referral_code,
    partner_downline.referrer_id,
    partner_downline.tier,
    partner_downline.partner_status,
    partner_downline.ly_balance,
    partner_downline.rwa_tokens,
    partner_downline.total_sales,
    partner_downline.level
  FROM partner_downline
  ORDER BY partner_downline.level, partner_downline.total_sales DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 6. 创建通过推荐码设置推荐人的函数
-- =====================================================
CREATE OR REPLACE FUNCTION set_referrer_by_code(
  p_member_id UUID,
  p_referral_code VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- 查找推荐码对应的会员
  SELECT id INTO v_referrer_id
  FROM members
  WHERE referral_code = UPPER(p_referral_code)
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- 不能自己推荐自己
  IF v_referrer_id = p_member_id THEN
    RETURN FALSE;
  END IF;

  -- 更新会员的推荐人
  UPDATE members
  SET referrer_id = v_referrer_id
  WHERE id = p_member_id
    AND referrer_id IS NULL;  -- 只有没有推荐人的才能设置

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. 创建获取推荐统计的函数
-- =====================================================
CREATE OR REPLACE FUNCTION get_referral_stats(p_member_id UUID)
RETURNS TABLE (
  direct_referrals BIGINT,
  total_network BIGINT,
  partners_in_network BIGINT,
  level1_count BIGINT,
  level2_count BIGINT,
  level3_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH downline AS (
    SELECT * FROM get_member_downline(p_member_id, 10)
  )
  SELECT
    COUNT(*) FILTER (WHERE level = 1) AS direct_referrals,
    COUNT(*) AS total_network,
    COUNT(*) FILTER (WHERE role = 'partner') AS partners_in_network,
    COUNT(*) FILTER (WHERE level = 1) AS level1_count,
    COUNT(*) FILTER (WHERE level = 2) AS level2_count,
    COUNT(*) FILTER (WHERE level = 3) AS level3_count
  FROM downline;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 8. 授予视图和函数的访问权限
-- =====================================================
GRANT SELECT ON member_referral_network TO authenticated;
GRANT SELECT ON partner_referral_network TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_downline TO authenticated;
GRANT EXECUTE ON FUNCTION get_partner_downline TO authenticated;
GRANT EXECUTE ON FUNCTION set_referrer_by_code TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_stats TO authenticated;

-- 完成
DO $$
BEGIN
  RAISE NOTICE 'Migration 005_referral_system completed successfully';
END $$;
