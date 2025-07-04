-- TEST EMAIL CONFIRMATION AFTER FIXES
-- Run this to test email confirmation functionality

-- 1. Check if the email confirmation trigger is working
SELECT 
    'TRIGGER CHECK' as test_name,
    COUNT(*) as trigger_count
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_email_confirmed';

-- 2. Simulate email confirmation for a test user
-- First, let's see current users
SELECT 
    'CURRENT USERS' as category,
    u.email,
    u.email_confirmed_at IS NOT NULL as is_confirmed,
    u.raw_user_meta_data->>'role' as metadata_role,
    up.role as profile_role,
    COALESCE(up.status::text, sp.status::text, tp.status::text, 'NO_PROFILE') as status
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN student_profiles sp ON u.id = sp.user_id  
LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
ORDER BY u.created_at DESC
LIMIT 5;

-- 3. Test manual email confirmation for users who aren't confirmed
-- (This simulates what happens when a user clicks confirmation link)
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL 
AND email IN (
    SELECT email FROM auth.users 
    WHERE email_confirmed_at IS NULL 
    LIMIT 1
)
RETURNING email, email_confirmed_at;

-- 4. Wait a moment for trigger to process, then check profiles
-- Run this a few seconds after the above UPDATE
SELECT 
    'AFTER CONFIRMATION TEST' as category,
    u.email,
    u.email_confirmed_at IS NOT NULL as is_confirmed,
    u.raw_user_meta_data->>'role' as metadata_role,
    up.role as profile_role,
    COALESCE(up.status::text, sp.status::text, tp.status::text, 'NO_PROFILE') as status,
    CASE 
        WHEN up.user_id IS NOT NULL THEN '✅ USER_PROFILE_CREATED'
        WHEN sp.user_id IS NOT NULL THEN '✅ STUDENT_PROFILE_CREATED'
        WHEN tp.user_id IS NOT NULL THEN '✅ TEACHER_PROFILE_CREATED'
        ELSE '❌ NO_PROFILE_CREATED'
    END as profile_check
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN student_profiles sp ON u.id = sp.user_id  
LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
WHERE u.email_confirmed_at IS NOT NULL
ORDER BY u.email_confirmed_at DESC
LIMIT 5;

SELECT '🧪 EMAIL CONFIRMATION TEST COMPLETE' as status;
