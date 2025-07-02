-- TEST PROFILE CREATION AFTER EMERGENCY FIX
-- Run this AFTER running EMERGENCY_PROFILE_CREATION_FIX.sql

-- Check the current state of all users and their profiles
SELECT 
    'VERIFICATION CHECK' as test_name,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.raw_user_meta_data->>'role' as metadata_role,
    up.role as profile_role,
    COALESCE(up.status::text, sp.status::text, tp.status::text, 'NO_STATUS') as profile_status,
    CASE 
        WHEN up.user_id IS NOT NULL THEN '✅ USER_PROFILE'
        WHEN sp.user_id IS NOT NULL THEN '✅ STUDENT_PROFILE'  
        WHEN tp.user_id IS NOT NULL THEN '✅ TEACHER_PROFILE'
        ELSE '❌ NO_PROFILES'
    END as profile_exists
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN student_profiles sp ON u.id = sp.user_id
LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
ORDER BY u.created_at DESC;

-- Check profile counts
SELECT 
    'PROFILE SUMMARY' as category,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM user_profiles) as user_profiles,
    (SELECT COUNT(*) FROM student_profiles) as student_profiles,
    (SELECT COUNT(*) FROM teacher_profiles) as teacher_profiles;

-- Check trigger status
SELECT 
    'TRIGGER STATUS' as category,
    COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_email_confirmed';

-- Expected results after fix:
-- ✅ All users should have profiles
-- ✅ Profile counts should match user counts  
-- ✅ Trigger should exist
-- ✅ Email confirmation should work for new users

SELECT '🔍 PROFILE VERIFICATION COMPLETE' as status;
