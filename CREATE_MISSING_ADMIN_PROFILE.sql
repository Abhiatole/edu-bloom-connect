-- MANUAL FIX FOR EXISTING ADMIN USER
-- Run this AFTER running the FIX_ADMIN_LOGIN_ISSUES.sql script

-- Find the admin user that was created but has no profile
SELECT 
  'Admin users without profiles:' as info,
  au.id as user_id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE au.raw_user_meta_data->>'role' = 'admin'
  AND up.user_id IS NULL;

-- Create profile for the admin user (replace the user_id with the actual one from above)
-- You'll need to replace 'e5da2cd8-08c4-44d3-a543-c1bb42fb3b9c' with the actual user ID
INSERT INTO public.user_profiles (
  user_id,
  full_name,
  email,
  role,
  status
)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  au.email,
  'ADMIN',
  'APPROVED'
FROM auth.users au
WHERE au.id = 'e5da2cd8-08c4-44d3-a543-c1bb42fb3b9c'
  AND au.raw_user_meta_data->>'role' = 'admin';

-- Verify the profile was created
SELECT 
  'Admin profile created:' as result,
  up.*
FROM user_profiles up
WHERE up.user_id = 'e5da2cd8-08c4-44d3-a543-c1bb42fb3b9c';
