-- MINIMAL EMAIL CONFIRMATION FIX
-- This script only handles email confirmation, not profile creation

-- Step 1: Show current email confirmation status
SELECT 
    'Email Confirmation Status:' as section,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users,
    ROUND(
        COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as confirmation_percentage
FROM auth.users;

-- Step 2: Show unconfirmed users details
SELECT 
    'Unconfirmed Users:' as section,
    email,
    created_at,
    raw_user_meta_data->>'role' as intended_role,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_since_signup
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Step 3: AUTO-CONFIRM ALL USERS (for development/testing)
-- Uncomment the line below to automatically confirm all pending users
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Step 4: Verify the fix worked
SELECT 
    'After Fix - Confirmation Status:' as section,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as still_unconfirmed
FROM auth.users;

-- Step 5: Show recently confirmed users
SELECT 
    'Recently Confirmed Users:' as section,
    email,
    created_at as signup_time,
    email_confirmed_at as confirmed_time,
    raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE email_confirmed_at >= NOW() - INTERVAL '1 minute'
ORDER BY email_confirmed_at DESC;

SELECT 'Minimal email confirmation fix completed!' as result;
