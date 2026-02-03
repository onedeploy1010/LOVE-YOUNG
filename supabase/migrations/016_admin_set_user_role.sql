-- Admin RPC to set user role — SECURITY DEFINER bypasses RLS
-- This ensures admin role changes always work regardless of client-side RLS restrictions

CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_user_id TEXT,
  p_new_role TEXT,
  p_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
  v_referral_code TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- Security: only admins can call this
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.members WHERE user_id = auth.uid()::text AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Permission denied: only admins can change user roles';
  END IF;

  -- Validate role
  IF p_new_role NOT IN ('user', 'member', 'partner', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', p_new_role;
  END IF;

  -- Check if member record exists
  SELECT id INTO v_member_id FROM public.members WHERE user_id = p_user_id;

  -- If no member record and role is not 'user', create one
  IF v_member_id IS NULL AND p_new_role != 'user' THEN
    v_referral_code := UPPER(SUBSTRING(MD5(gen_random_uuid()::text) FROM 1 FOR 6));

    INSERT INTO public.members (user_id, name, email, phone, role, points_balance, referral_code, created_at)
    VALUES (
      p_user_id,
      COALESCE(p_name, p_email, '未命名'),
      COALESCE(p_email, ''),
      COALESCE(p_phone, ''),
      p_new_role,
      0,
      v_referral_code,
      NOW()
    )
    RETURNING id INTO v_member_id;
  ELSIF v_member_id IS NOT NULL THEN
    -- Update existing member role
    UPDATE public.members SET role = p_new_role WHERE id = v_member_id;
    SELECT referral_code INTO v_referral_code FROM public.members WHERE id = v_member_id;
  END IF;

  -- Update users table role
  UPDATE public.users SET role = p_new_role, updated_at = NOW() WHERE id = p_user_id;

  -- If partner or admin, ensure partner record exists
  IF p_new_role IN ('partner', 'admin') AND v_member_id IS NOT NULL THEN
    INSERT INTO public.partners (member_id, user_id, referral_code, tier, status, ly_balance, cash_wallet_balance, rwa_tokens, total_sales, total_cashback)
    VALUES (v_member_id, p_user_id, v_referral_code, 'phase1', 'active', 0, 0, 0, 0, 0)
    ON CONFLICT (member_id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'member_id', v_member_id,
    'role', p_new_role
  );
END;
$$;

-- Grant execute to authenticated users (admin check is inside the function)
GRANT EXECUTE ON FUNCTION public.admin_set_user_role TO authenticated;

-- Also ensure members table has INSERT grant for authenticated (needed for other flows)
GRANT INSERT ON public.members TO authenticated;
