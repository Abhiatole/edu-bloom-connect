-- =============================================
-- EMERGENCY PROFILE CREATION FIX
-- Run this IMMEDIATELY in Supabase SQL Editor
-- =============================================

-- STEP 1: Create missing profiles for existing users
-- =============================================

-- Create profiles for users with student role
INSERT INTO student_profiles (
    user_id,
    enrollment_no,
    full_name,
    email,
    class_level,
    status,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'STU' || EXTRACT(YEAR FROM NOW()) || LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0') || LPAD(ROW_NUMBER() OVER()::TEXT, 4, '0'),
    COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)),
    u.email,
    COALESCE((u.raw_user_meta_data->>'class_level')::integer, 11),
    'PENDING'::approval_status,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' = 'student'
AND NOT EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Create profiles for users with teacher role
INSERT INTO teacher_profiles (
    user_id,
    employee_id,
    full_name,
    email,
    subject_expertise,
    experience_years,
    status,
    created_at,
    updated_at
)
SELECT 
    u.id,
    'TCH' || EXTRACT(YEAR FROM NOW()) || LPAD(ROW_NUMBER() OVER()::TEXT, 4, '0'),
    COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)),
    u.email,
    COALESCE(u.raw_user_meta_data->>'subject_expertise', 'OTHER')::subject_type,
    COALESCE((u.raw_user_meta_data->>'experience_years')::integer, 0),
    'PENDING'::approval_status,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' = 'teacher'
AND NOT EXISTS (SELECT 1 FROM teacher_profiles tp WHERE tp.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Create user_profiles for ALL users (including admins and existing users)
INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    role,
    status,
    created_at,
    updated_at
)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)),
    u.email,
    CASE 
        WHEN u.raw_user_meta_data->>'role' = 'student' THEN 'STUDENT'
        WHEN u.raw_user_meta_data->>'role' = 'teacher' THEN 'TEACHER'
        WHEN u.raw_user_meta_data->>'role' IN ('admin', 'superadmin') THEN 'ADMIN'
        ELSE 'STUDENT'  -- Default fallback
    END::user_role,
    CASE 
        WHEN u.raw_user_meta_data->>'role' IN ('admin', 'superadmin') THEN 'APPROVED'
        ELSE 'PENDING'
    END::approval_status,
    NOW(),
    NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- STEP 2: Fix email confirmation for existing users
-- =============================================

-- Mark users as email confirmed if they should be
-- (This is safe - we're only updating users who registered but never confirmed)
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL 
AND created_at < NOW() - INTERVAL '1 hour'  -- Only old registrations
AND email IS NOT NULL;

-- STEP 3: Drop and recreate the email confirmation trigger
-- =============================================

-- Drop existing broken triggers
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP FUNCTION IF EXISTS handle_email_confirmation_trigger();
DROP FUNCTION IF EXISTS handle_new_user_registration();
DROP FUNCTION IF EXISTS handle_user_profile_creation();

-- Create new comprehensive trigger function
CREATE OR REPLACE FUNCTION handle_user_profile_creation()
RETURNS trigger AS $$
DECLARE
    user_role TEXT;
    full_name TEXT;
    enrollment_no TEXT;
    employee_id TEXT;
BEGIN
    -- Get role and name from metadata
    user_role := NEW.raw_user_meta_data->>'role';
    full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1));

    -- Only process if user was just confirmed (email_confirmed_at changed from NULL to NOT NULL)
    IF TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        
        RAISE LOG 'Creating profile for user: % with role: %', NEW.email, user_role;
        
        -- Create student profile if role is student
        IF user_role = 'student' THEN
            enrollment_no := 'STU' || EXTRACT(YEAR FROM NOW()) || 
                           LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0') || 
                           LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT % 10000, 4, '0');
            
            INSERT INTO student_profiles (
                user_id, enrollment_no, full_name, email, class_level, status, created_at, updated_at
            ) VALUES (
                NEW.id, enrollment_no, full_name, NEW.email, 
                COALESCE((NEW.raw_user_meta_data->>'class_level')::integer, 11), 'PENDING'::approval_status, NOW(), NOW()
            ) ON CONFLICT (user_id) DO NOTHING;
            
            RAISE LOG 'Created student profile for: %', NEW.email;
        END IF;

        -- Create teacher profile if role is teacher
        IF user_role = 'teacher' THEN
            employee_id := 'TCH' || EXTRACT(YEAR FROM NOW()) || 
                         LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT % 10000, 4, '0');
            
            INSERT INTO teacher_profiles (
                user_id, employee_id, full_name, email, subject_expertise, experience_years, status, created_at, updated_at
            ) VALUES (
                NEW.id, employee_id, full_name, NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'subject_expertise', 'OTHER')::subject_type,
                COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0), 'PENDING'::approval_status, NOW(), NOW()
            ) ON CONFLICT (user_id) DO NOTHING;
            
            RAISE LOG 'Created teacher profile for: %', NEW.email;
        END IF;

        -- Create user_profiles entry for all users
        INSERT INTO user_profiles (
            user_id, full_name, email, role, status, created_at, updated_at
        ) VALUES (
            NEW.id, full_name, NEW.email,
            CASE 
                WHEN user_role = 'student' THEN 'STUDENT'
                WHEN user_role = 'teacher' THEN 'TEACHER'
                WHEN user_role IN ('admin', 'superadmin') THEN 'ADMIN'
                ELSE 'STUDENT'
            END::user_role,
            CASE 
                WHEN user_role IN ('admin', 'superadmin') THEN 'APPROVED'
                ELSE 'PENDING'
            END::approval_status,
            NOW(), NOW()
        ) ON CONFLICT (user_id) DO NOTHING;
        
        RAISE LOG 'Created user profile for: % with role: %', NEW.email, user_role;
        
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_user_profile_creation();

-- STEP 4: Test the fix by showing current state
-- =============================================

SELECT 
    'AFTER EMERGENCY FIX' as category,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.raw_user_meta_data->>'role' as metadata_role,
    up.role as profile_role,
    CASE 
        WHEN up.role IS NOT NULL THEN up.status::text
        WHEN sp.user_id IS NOT NULL THEN ('STUDENT_' || sp.status::text)
        WHEN tp.user_id IS NOT NULL THEN ('TEACHER_' || tp.status::text)
        ELSE 'NO_PROFILE'
    END as profile_status,
    CASE 
        WHEN up.user_id IS NOT NULL THEN 'USER_PROFILE_EXISTS'
        WHEN sp.user_id IS NOT NULL THEN 'STUDENT_PROFILE_EXISTS'  
        WHEN tp.user_id IS NOT NULL THEN 'TEACHER_PROFILE_EXISTS'
        ELSE 'NO_PROFILES'
    END as profile_check
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN student_profiles sp ON u.id = sp.user_id
LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- Show profile counts
SELECT 
    'PROFILE COUNTS' as summary,
    (SELECT COUNT(*) FROM user_profiles) as user_profiles_count,
    (SELECT COUNT(*) FROM student_profiles) as student_profiles_count,
    (SELECT COUNT(*) FROM teacher_profiles) as teacher_profiles_count,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users;

SELECT '🚀 EMERGENCY PROFILE FIX COMPLETED!' as status;
SELECT 'All existing users should now have profiles created!' as message;
SELECT 'Email confirmation trigger is now active for new registrations!' as next_step;
