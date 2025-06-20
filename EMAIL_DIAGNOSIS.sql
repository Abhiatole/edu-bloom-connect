-- EMAIL CONFIRMATION TROUBLESHOOTING
-- Run these queries to diagnose and fix email confirmation issues

-- 1. Check current auth users and confirmation status
SELECT 
    'Auth Users Summary:' as section,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- 2. Show unconfirmed users
SELECT 
    'Unconfirmed Users:' as section,
    COUNT(*) as count,
    STRING_AGG(email, ', ') as emails
FROM auth.users 
WHERE email_confirmed_at IS NULL;

-- 3. Show recent signups waiting for confirmation
SELECT 
    'Recent Signups (Last 24h):' as section,
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'Waiting for confirmation'
        ELSE 'Confirmed'
    END as status
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 4. Emergency fix: Manually confirm all users (DEVELOPMENT ONLY)
-- Uncomment the line below to auto-confirm all pending users
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- 5. Check if user profiles were created for confirmed users
SELECT 
    'Profile Creation Status:' as section,
    COUNT(CASE WHEN sp.user_id IS NOT NULL THEN 1 END) as students_with_profiles,
    COUNT(CASE WHEN tp.user_id IS NOT NULL THEN 1 END) as teachers_with_profiles,
    COUNT(*) as total_confirmed_users
FROM auth.users au
LEFT JOIN student_profiles sp ON au.id = sp.user_id
LEFT JOIN teacher_profiles tp ON au.id = tp.user_id
WHERE au.email_confirmed_at IS NOT NULL;

-- 6. Show users without profiles (may need manual profile creation)
SELECT 
    'Users Without Profiles:' as section,
    au.email,
    au.raw_user_meta_data->>'role' as intended_role,
    au.created_at
FROM auth.users au
LEFT JOIN student_profiles sp ON au.id = sp.user_id
LEFT JOIN teacher_profiles tp ON au.id = tp.user_id
WHERE au.email_confirmed_at IS NOT NULL
AND sp.user_id IS NULL 
AND tp.user_id IS NULL
ORDER BY au.created_at DESC;

-- 7. Check for recent authentication attempts and errors
SELECT 
    'Recent Auth Activity:' as section,
    au.email,
    au.created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    CASE 
        WHEN au.email_confirmed_at IS NULL AND au.created_at < NOW() - INTERVAL '1 hour' 
        THEN 'Email confirmation overdue'
        WHEN au.email_confirmed_at IS NULL 
        THEN 'Waiting for confirmation'
        ELSE 'Confirmed'
    END as status
FROM auth.users au
ORDER BY au.created_at DESC
LIMIT 10;

-- 8. Quick fix for development - manually confirm specific user by email
-- Replace 'user@example.com' with actual email that needs confirmation
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'user@example.com' AND email_confirmed_at IS NULL;

-- 9. Show auth.users table structure for reference
SELECT 
    'Auth Users Table Columns:' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

SELECT 'Email confirmation diagnosis complete!' as result;
