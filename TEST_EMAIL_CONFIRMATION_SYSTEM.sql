-- EMAIL CONFIRMATION SYSTEM TEST
-- Run this to verify the email confirmation system is working properly

-- Check if email confirmation triggers are working
SELECT 
    'EMAIL CONFIRMATION SYSTEM STATUS' as check_type,
    'Database triggers for profile creation' as component,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'handle_user_confirmation'
        ) THEN '✅ Profile creation trigger exists'
        ELSE '❌ Profile creation trigger missing'
    END as status;

-- Check if users are receiving proper role assignments
SELECT 
    'USER ROLE ASSIGNMENT' as check_type,
    raw_user_meta_data->>'role' as role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_count
FROM auth.users 
WHERE raw_user_meta_data ? 'role'
GROUP BY raw_user_meta_data->>'role'
ORDER BY role;

-- Check profile creation status
SELECT 
    'PROFILE CREATION STATUS' as check_type,
    'Students' as profile_type,
    COUNT(DISTINCT au.id) as total_users,
    COUNT(DISTINCT sp.user_id) as users_with_profiles,
    COUNT(DISTINCT CASE WHEN au.email_confirmed_at IS NOT NULL THEN au.id END) as confirmed_users
FROM auth.users au
LEFT JOIN student_profiles sp ON au.id = sp.user_id
WHERE au.raw_user_meta_data->>'role' = 'student'

UNION ALL

SELECT 
    'PROFILE CREATION STATUS' as check_type,
    'Teachers' as profile_type,
    COUNT(DISTINCT au.id) as total_users,
    COUNT(DISTINCT tp.user_id) as users_with_profiles,
    COUNT(DISTINCT CASE WHEN au.email_confirmed_at IS NOT NULL THEN au.id END) as confirmed_users
FROM auth.users au
LEFT JOIN teacher_profiles tp ON au.id = tp.user_id
WHERE au.raw_user_meta_data->>'role' = 'teacher';

-- Check recent registrations and their status
SELECT 
    'RECENT REGISTRATIONS' as check_type,
    au.email,
    au.raw_user_meta_data->>'role' as role,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN '✅ CONFIRMED'
        ELSE '⏳ PENDING CONFIRMATION'
    END as email_status,
    CASE 
        WHEN au.raw_user_meta_data->>'role' = 'student' AND sp.user_id IS NOT NULL THEN '✅ HAS PROFILE'
        WHEN au.raw_user_meta_data->>'role' = 'teacher' AND tp.user_id IS NOT NULL THEN '✅ HAS PROFILE'
        WHEN au.email_confirmed_at IS NULL THEN '⏳ WAITING FOR EMAIL CONFIRMATION'
        ELSE '❌ MISSING PROFILE'
    END as profile_status,
    au.created_at
FROM auth.users au
LEFT JOIN student_profiles sp ON au.id = sp.user_id AND au.raw_user_meta_data->>'role' = 'student'
LEFT JOIN teacher_profiles tp ON au.id = tp.user_id AND au.raw_user_meta_data->>'role' = 'teacher'
WHERE au.raw_user_meta_data ? 'role'
ORDER BY au.created_at DESC
LIMIT 10;

-- Email confirmation recommendations
SELECT 
    'EMAIL CONFIRMATION RECOMMENDATIONS' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email_confirmed_at IS NULL 
            AND raw_user_meta_data ? 'role'
            AND created_at < NOW() - INTERVAL '1 hour'
        ) THEN '⚠️  Some users have been waiting over 1 hour for email confirmation'
        ELSE '✅ No users waiting excessively for email confirmation'
    END as recommendation_1,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users au
            LEFT JOIN student_profiles sp ON au.id = sp.user_id
            LEFT JOIN teacher_profiles tp ON au.id = tp.user_id
            WHERE au.email_confirmed_at IS NOT NULL
            AND au.raw_user_meta_data ? 'role'
            AND ((au.raw_user_meta_data->>'role' = 'student' AND sp.user_id IS NULL) OR
                 (au.raw_user_meta_data->>'role' = 'teacher' AND tp.user_id IS NULL))
        ) THEN '⚠️  Some confirmed users are missing profiles - run COMPREHENSIVE_EMAIL_FIX.sql'
        ELSE '✅ All confirmed users have profiles'
    END as recommendation_2;

SELECT 'Email confirmation system test completed!' as result;
