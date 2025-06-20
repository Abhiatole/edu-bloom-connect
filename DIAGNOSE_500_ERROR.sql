-- DIAGNOSE SUPABASE 500 ERROR DURING REGISTRATION
-- This error typically occurs due to RLS policies or missing triggers/functions

-- 1. Check if auth.users table is accessible
SELECT 'Auth Users Count' as check_type, COUNT(*) as count FROM auth.users;

-- 2. Check RLS policies on student_profiles
SELECT 'Student Profiles RLS' as check_type, 
       tablename, 
       policyname, 
       permissive, 
       roles, 
       cmd, 
       qual,
       with_check
FROM pg_policies 
WHERE tablename = 'student_profiles';

-- 3. Check RLS policies on teacher_profiles  
SELECT 'Teacher Profiles RLS' as check_type,
       tablename, 
       policyname, 
       permissive, 
       roles, 
       cmd, 
       qual,
       with_check
FROM pg_policies 
WHERE tablename = 'teacher_profiles';

-- 4. Check if RLS is enabled on the tables
SELECT 'RLS Status' as check_type,
       schemaname,
       tablename,
       rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('student_profiles', 'teacher_profiles');

-- 5. Check for any triggers that might be failing
SELECT 'Triggers' as check_type,
       trigger_name,
       event_object_table,
       action_timing,
       event_manipulation,
       action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('student_profiles', 'teacher_profiles')
ORDER BY event_object_table, trigger_name;

-- 6. Check if functions exist and are accessible
SELECT 'Functions' as check_type,
       routine_name,
       routine_type,
       data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%user%'
ORDER BY routine_name;
