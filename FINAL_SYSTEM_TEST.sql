-- FINAL SYSTEM TEST - Run this to verify everything works
-- This script tests the complete admin approval and email confirmation system

-- Step 1: Show current system state
SELECT '=== SYSTEM STATUS OVERVIEW ===' as section;

-- Check if all required tables exist
SELECT 
    'TABLE EXISTENCE CHECK' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_profiles') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as student_profiles_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_profiles') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as teacher_profiles_table,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_profiles') THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as admin_profiles_table;

-- Check if enrollment_no column exists
SELECT 
    'ENROLLMENT COLUMN CHECK' as check_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'student_profiles' 
            AND column_name = 'enrollment_no'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - Run ADD_ENROLLMENT_COLUMN.sql'
    END as enrollment_no_column;

-- Show user and profile counts
SELECT 
    'USER COUNTS' as check_name,
    (SELECT COUNT(*) FROM auth.users WHERE raw_user_meta_data ? 'role') as total_users,
    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL AND raw_user_meta_data ? 'role') as confirmed_users,
    (SELECT COUNT(*) FROM student_profiles) as student_profiles,
    (SELECT COUNT(*) FROM teacher_profiles) as teacher_profiles;

-- Show approval status distribution
SELECT 
    'APPROVAL STATUS' as check_name,
    status,
    COUNT(*) as count
FROM (
    SELECT status FROM student_profiles
    UNION ALL
    SELECT status FROM teacher_profiles
) combined
GROUP BY status
ORDER BY status;

-- Check for users without profiles (potential issues)
SELECT 
    'USERS WITHOUT PROFILES' as issue_type,
    COUNT(*) as count,
    STRING_AGG(DISTINCT au.raw_user_meta_data->>'role', ', ') as roles_affected
FROM auth.users au
LEFT JOIN student_profiles sp ON au.id = sp.user_id AND au.raw_user_meta_data->>'role' = 'student'
LEFT JOIN teacher_profiles tp ON au.id = tp.user_id AND au.raw_user_meta_data->>'role' = 'teacher'
WHERE au.raw_user_meta_data ? 'role'
AND au.email_confirmed_at IS NOT NULL
AND (
    (au.raw_user_meta_data->>'role' = 'student' AND sp.user_id IS NULL) OR
    (au.raw_user_meta_data->>'role' = 'teacher' AND tp.user_id IS NULL)
);

-- Check RLS policies
SELECT 
    'RLS POLICIES CHECK' as check_name,
    schemaname,
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('student_profiles', 'teacher_profiles', 'admin_profiles')
ORDER BY tablename, policyname;

-- Final recommendation
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users au
            LEFT JOIN student_profiles sp ON au.id = sp.user_id AND au.raw_user_meta_data->>'role' = 'student'
            LEFT JOIN teacher_profiles tp ON au.id = tp.user_id AND au.raw_user_meta_data->>'role' = 'teacher'
            WHERE au.raw_user_meta_data ? 'role'
            AND au.email_confirmed_at IS NOT NULL
            AND (
                (au.raw_user_meta_data->>'role' = 'student' AND sp.user_id IS NULL) OR
                (au.raw_user_meta_data->>'role' = 'teacher' AND tp.user_id IS NULL)
            )
        ) THEN '⚠️  RECOMMENDED: Run COMPREHENSIVE_EMAIL_FIX.sql to create missing profiles'
        ELSE '✅ SYSTEM READY: All confirmed users have profiles!'
    END as recommendation;
