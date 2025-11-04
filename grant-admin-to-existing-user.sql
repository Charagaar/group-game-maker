-- Run this SQL in Supabase SQL Editor to grant admin role to your existing user
-- Replace 'your-email@example.com' with your actual email address

-- Option 1: Grant admin by email (recommended)
SELECT public.grant_admin_to_user('your-email@example.com');

-- Option 2: Grant admin by user ID (if you know your user ID from auth.users)
-- First, find your user ID:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
-- Then run:
-- SELECT public.grant_admin_by_user_id('your-user-id-here');

-- Option 3: Direct insert (if you know your user ID)
-- Replace 'your-user-id-here' with your actual user ID from auth.users
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('your-user-id-here', 'admin'::public.app_role)
-- ON CONFLICT (user_id, role) DO NOTHING;

