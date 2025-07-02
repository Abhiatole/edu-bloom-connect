-- DIAGNOSTIC: Test All User Types and Email Confirmation
-- Run this to check if login works for all user types

-- 1. Check existing users by role
SELECT 
    'STUDENT USERS' as type,
    COUNT(*) as count,
    string_agg(DISTINCT status::text, ', ') as statuses
FROM student_profiles

UNION ALL

SELECT 
    'TEACHER USERS' as type,
    COUNT(*) as count,
    string_agg(DISTINCT status::text, ', ') as statuses
FROM teacher_profiles

UNION ALL

SELECT 
    'ADMIN USERS' as type,
    COUNT(*) as count,
    string_agg(DISTINCT COALESCE(status::text, role::text), ', ') as statuses
FROM user_profiles
WHERE role = 'ADMIN';

-- 2. Check for users without profiles
SELECT 
    'USERS WITHOUT PROFILES' as issue,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE up.user_id IS NULL 
  AND au.email_confirmed_at IS NOT NULL;

-- 3. Check email confirmation status
SELECT 
    'EMAIL CONFIRMATION STATUS' as category,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed,
    COUNT(*) as total
FROM auth.users;

-- 4. Check user metadata for role information
SELECT 
    'USER METADATA ROLES' as category,
    raw_user_meta_data->>'role' as role,
    COUNT(*) as count,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_count
FROM auth.users
WHERE raw_user_meta_data IS NOT NULL
GROUP BY raw_user_meta_data->>'role';

-- 5. Test trigger functionality
SELECT 
    'TRIGGER STATUS' as category,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

-- 6. Check for orphaned profiles (profiles without auth users)
SELECT 
    'ORPHANED STUDENT PROFILES' as issue,
    COUNT(*) as count
FROM student_profiles sp
LEFT JOIN auth.users au ON sp.user_id = au.id
WHERE au.id IS NULL

UNION ALL

SELECT 
    'ORPHANED TEACHER PROFILES' as issue,
    COUNT(*) as count
FROM teacher_profiles tp
LEFT JOIN auth.users au ON tp.user_id = au.id
WHERE au.id IS NULL

UNION ALL

SELECT 
    'ORPHANED USER PROFILES' as issue,
    COUNT(*) as count
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL;

-- 7. Sample of users for manual verification
SELECT 
    'SAMPLE USERS' as category,
    au.email,
    au.email_confirmed_at,
    au.raw_user_meta_data->>'role' as metadata_role,
    up.role as profile_role,
    CASE 
        WHEN sp.user_id IS NOT NULL THEN 'STUDENT_PROFILE_EXISTS'
        WHEN tp.user_id IS NOT NULL THEN 'TEACHER_PROFILE_EXISTS'
        WHEN up.role = 'ADMIN' THEN 'ADMIN_PROFILE_EXISTS'
        ELSE 'NO_ROLE_PROFILE'
    END as profile_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LEFT JOIN student_profiles sp ON au.id = sp.user_id
LEFT JOIN teacher_profiles tp ON au.id = tp.user_id
ORDER BY au.created_at DESC
LIMIT 10;
