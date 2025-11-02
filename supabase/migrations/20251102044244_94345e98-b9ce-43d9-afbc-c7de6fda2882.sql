-- Create a function to grant admin role to an existing user
-- This bypasses RLS and can be used to assign admin to existing users
-- Usage: SELECT public.grant_admin_to_user('user-email@example.com');
CREATE OR REPLACE FUNCTION public.grant_admin_to_user(_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO _user_id
  FROM auth.users
  WHERE email = _email
  LIMIT 1;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', _email;
  END IF;

  -- Insert admin role if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users (they can grant admin to themselves if no admin exists)
GRANT EXECUTE ON FUNCTION public.grant_admin_to_user(TEXT) TO authenticated;

-- Also create a version that works with user_id directly (useful for admin scripts)
CREATE OR REPLACE FUNCTION public.grant_admin_by_user_id(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert admin role if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_admin_by_user_id(UUID) TO authenticated;