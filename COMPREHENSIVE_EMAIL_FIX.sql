-- COMPREHENSIVE EMAIL & PROFILE FIX
-- This script handles email confirmation and profile creation with proper enrollment numbers

-- Step 1: Ensure enrollment_no column exists
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
        RAISE NOTICE 'Added enrollment_no column to student_profiles';
    END IF;
END $$;

-- Step 2: Update any existing students without enrollment numbers
UPDATE student_profiles 
SET enrollment_no = 'STU' || LPAD(id::text, 6, '0') 
WHERE enrollment_no IS NULL OR enrollment_no = '';

-- Step 3: Check current status
SELECT 
    'Current Email Status:' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as awaiting_confirmation
FROM auth.users;

-- Step 4: Show users awaiting confirmation
SELECT 
    'Users Awaiting Confirmation:' as info,
    email,
    created_at,
    raw_user_meta_data->>'role' as role
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- Step 5: DEVELOPMENT ONLY - Auto-confirm users (uncomment if needed)
-- WARNING: Only use in development environments
-- UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- Step 6: Create missing student profiles
DO $$
DECLARE
    user_record RECORD;
    next_enrollment_no TEXT;
    max_enrollment_num INTEGER;
BEGIN
    -- Get the highest enrollment number to generate unique ones
    SELECT COALESCE(MAX(CAST(SUBSTRING(enrollment_no FROM 4) AS INTEGER)), 0)
    INTO max_enrollment_num
    FROM student_profiles 
    WHERE enrollment_no ~ '^STU[0-9]+$';
    
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN student_profiles sp ON au.id = sp.user_id
        WHERE au.email_confirmed_at IS NOT NULL
        AND au.raw_user_meta_data->>'role' = 'student'
        AND sp.user_id IS NULL
    LOOP
        max_enrollment_num := max_enrollment_num + 1;
        next_enrollment_no := 'STU' || LPAD(max_enrollment_num::text, 6, '0');
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
            next_enrollment_no,
            'PENDING',
            NOW()
        ) ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Created student profile for % with enrollment %', user_record.email, next_enrollment_no;
    END LOOP;
END $$;

-- Step 7: Create missing teacher profiles
DO $$
DECLARE
    user_record RECORD;
BEGIN
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
        
        RAISE NOTICE 'Created teacher profile for %', user_record.email;
    END LOOP;
END $$;

-- Step 8: Final status report
SELECT 
    'Final Status Report:' as info,
    'Students' as type,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved,
    COUNT(CASE WHEN enrollment_no IS NOT NULL THEN 1 END) as with_enrollment_no
FROM student_profiles
UNION ALL
SELECT 
    'Final Status Report:' as info,
    'Teachers' as type,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved,
    NULL as with_enrollment_no
FROM teacher_profiles;

-- Step 9: Show sample enrollments
SELECT 
    'Sample Student Enrollments:' as info,
    enrollment_no,
    status,
    created_at
FROM student_profiles 
ORDER BY created_at DESC
LIMIT 5;

SELECT 'Email confirmation and profile creation fix completed!' as result;
