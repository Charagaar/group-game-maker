-- Fix infinite recursion in user_roles policies
-- The issue: Policies query user_roles directly, which triggers RLS and causes infinite recursion

-- First, ensure has_role function bypasses RLS properly
-- SECURITY DEFINER functions should already bypass RLS, but let's ensure it's set up correctly
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- SECURITY DEFINER bypasses RLS automatically
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create a helper function to check if any admin exists (bypasses RLS)
CREATE OR REPLACE FUNCTION public.has_any_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'::public.app_role
  )
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_admin() TO authenticated;

-- Fix the "Admins can manage all roles" policy to use has_role() instead of direct query
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Fix the "Allow first admin creation" policy to use has_any_admin() instead of direct query
DROP POLICY IF EXISTS "Allow first admin creation" ON public.user_roles;

CREATE POLICY "Allow first admin creation"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    role = 'admin'::app_role 
    AND user_id = auth.uid()
    AND NOT public.has_any_admin()
  );