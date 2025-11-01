-- Allow inserting the first admin role when no admins exist
-- This solves the chicken-and-egg problem of creating the first admin
CREATE POLICY "Allow first admin creation"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    role = 'admin'::app_role 
    AND user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE role = 'admin'::app_role
    )
  );