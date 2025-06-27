-- QUICK DATABASE STATUS CHECK
-- Run this first to see what we're working with

-- Check if teacher_profiles table exists
SELECT 
    'TABLE CHECK' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_profiles')
        THEN '✅ teacher_profiles table exists'
        ELSE '❌ teacher_profiles table missing'
    END as result;

-- Check status column details
SELECT 
    'STATUS COLUMN' as check_type,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'status')
        THEN '❌ status column missing'
        WHEN data_type = 'USER-DEFINED'
        THEN '📋 status is ENUM type: ' || udt_name
        ELSE '📝 status is ' || data_type || ' type'
    END as result
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' AND column_name = 'status'
UNION ALL
SELECT 'STATUS COLUMN' as check_type, '❌ status column does not exist' as result
WHERE NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'status');

-- Check if approval_status ENUM exists
SELECT 
    'ENUM TYPE' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status')
        THEN '✅ approval_status ENUM exists with values: ' || (
            SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'approval_status')
        )
        ELSE '❌ approval_status ENUM does not exist'
    END as result;

-- Check current teacher profiles
SELECT 
    'TEACHER PROFILES' as check_type,
    'Found ' || COUNT(*) || ' teacher profiles' as result
FROM teacher_profiles;

-- Check status values in use
SELECT 
    'STATUS VALUES' as check_type,
    'Status distribution: ' || string_agg(
        COALESCE(status::text, 'NULL') || ' (' || count || ')', 
        ', '
    ) as result
FROM (
    SELECT 
        status, 
        COUNT(*) as count
    FROM teacher_profiles 
    GROUP BY status
) status_counts;

-- Check for teachers with empty string status (this causes the error)
SELECT 
    'EMPTY STATUS CHECK' as check_type,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '⚠️ Found ' || COUNT(*) || ' profiles with empty string status - THIS CAUSES THE ERROR'
        ELSE '✅ No empty string status values found'
    END as result
FROM teacher_profiles 
WHERE status = '';

SELECT '🎯 Run the appropriate fix script based on results above' as next_action;
