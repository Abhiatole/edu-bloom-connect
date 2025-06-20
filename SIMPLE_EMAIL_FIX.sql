-- SIMPLE EMAIL CONFIRMATION FIX
-- Run this script to quickly resolve email confirmation issues

-- Step 0: Ensure enrollment_no column exists (add if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_profiles' 
        AND column_name = 'enrollment_no'
    ) THEN
        ALTER TABLE student_profiles ADD COLUMN enrollment_no TEXT;
        UPDATE student_profiles 
        SET enrollment_no = 'STU' || LPAD(id::text, 6, '0') 
        WHERE enrollment_no IS NULL;
    END IF;
END $$;

-- Step 0: Check table structure first
SELECT 
    'Student Profiles Columns:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'student_profiles'
ORDER BY ordinal_position;

SELECT 
    'Teacher Profiles Columns:' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'teacher_profiles'
ORDER BY ordinal_position;

-- Step 1: Check current email confirmation status
SELECT 
    'Current Status:' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as awaiting_confirmation
FROM auth.users;

-- Step 2: Show users waiting for confirmation
SELECT 
    'Users Awaiting Confirmation:' as info,
    email,
    created_at,
    raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Step 3: DEVELOPMENT FIX - Auto-confirm all users (uncomment to use)
-- WARNING: Only use this in development/testing environments
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- Step 4: Create missing profiles for confirmed users
-- This ensures users who are confirmed but missing profiles get them created

DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Create student profiles for confirmed users who registered as students
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN student_profiles sp ON au.id = sp.user_id
        WHERE au.email_confirmed_at IS NOT NULL
        AND au.raw_user_meta_data->>'role' = 'student'
        AND sp.user_id IS NULL    LOOP
        INSERT INTO student_profiles (
            user_id,
            full_name,
            email,
            class_level,
            guardian_name,
            guardian_mobile,
            enrollment_no,
            status,
            created_at
        ) VALUES (
            user_record.id,
            COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email),
            user_record.email,
            COALESCE((user_record.raw_user_meta_data->>'class_level')::integer, 11),
            user_record.raw_user_meta_data->>'guardian_name',
            user_record.raw_user_meta_data->>'guardian_mobile',
            'STU' || LPAD((COALESCE((SELECT MAX(id) FROM student_profiles), 0) + 1)::text, 6, '0'),
            'PENDING',
            NOW()
        ) ON CONFLICT (user_id) DO NOTHING;
    END LOOP;

    -- Create teacher profiles for confirmed users who registered as teachers  
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN teacher_profiles tp ON au.id = tp.user_id
        WHERE au.email_confirmed_at IS NOT NULL
        AND au.raw_user_meta_data->>'role' = 'teacher'
        AND tp.user_id IS NULL
    LOOP
        INSERT INTO teacher_profiles (
            user_id,
            full_name,
            email,
            subject_expertise,
            experience_years,
            status,
            created_at
        ) VALUES (
            user_record.id,
            COALESCE(user_record.raw_user_meta_data->>'full_name', 'Unknown'),
            user_record.email,
            COALESCE(user_record.raw_user_meta_data->>'subject_expertise', 'Other')::subject_type,
            COALESCE((user_record.raw_user_meta_data->>'experience_years')::integer, 0),
            'PENDING',
            NOW()
        ) ON CONFLICT (user_id) DO NOTHING;
    END LOOP;
END $$;

-- Step 5: Final status check
SELECT 
    'Final Status:' as info,
    'Students' as type,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved
FROM student_profiles
UNION ALL
SELECT 
    'Final Status:' as info,
    'Teachers' as type,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved
FROM teacher_profiles;

SELECT 'Email confirmation fix completed!' as result;
