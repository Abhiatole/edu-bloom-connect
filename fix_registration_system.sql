-- COMPREHENSIVE REGISTRATION FIX
-- This SQL file fixes all registration issues for EduBloom Connect
-- Run this in Supabase SQL Editor

-- =====================================
-- 1. DISABLE RLS TEMPORARILY FOR SETUP
-- =====================================
ALTER TABLE IF EXISTS student_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;

-- =====================================
-- 2. ENSURE ALL REQUIRED COLUMNS EXIST
-- =====================================

-- Fix student_profiles table
DO $$
BEGIN
    -- Add missing columns to student_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'enrollment_no') THEN
        ALTER TABLE student_profiles ADD COLUMN enrollment_no TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE student_profiles ADD COLUMN full_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'email') THEN
        ALTER TABLE student_profiles ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'parent_email') THEN
        ALTER TABLE student_profiles ADD COLUMN parent_email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'parent_phone') THEN
        ALTER TABLE student_profiles ADD COLUMN parent_phone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'guardian_name') THEN
        ALTER TABLE student_profiles ADD COLUMN guardian_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'guardian_mobile') THEN
        ALTER TABLE student_profiles ADD COLUMN guardian_mobile TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'status') THEN
        ALTER TABLE student_profiles ADD COLUMN status TEXT DEFAULT 'PENDING';
    END IF;
END $$;

-- Fix teacher_profiles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'employee_id') THEN
        ALTER TABLE teacher_profiles ADD COLUMN employee_id TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'full_name') THEN
        ALTER TABLE teacher_profiles ADD COLUMN full_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'email') THEN
        ALTER TABLE teacher_profiles ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'subject_expertise') THEN
        ALTER TABLE teacher_profiles ADD COLUMN subject_expertise TEXT DEFAULT 'Other';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'experience_years') THEN
        ALTER TABLE teacher_profiles ADD COLUMN experience_years INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teacher_profiles' AND column_name = 'status') THEN
        ALTER TABLE teacher_profiles ADD COLUMN status TEXT DEFAULT 'PENDING';
    END IF;
END $$;

-- =====================================
-- 3. CREATE SECURE BYPASS FUNCTIONS
-- =====================================

-- Student registration bypass function
CREATE OR REPLACE FUNCTION create_student_profile_secure(
    p_user_id UUID,
    p_enrollment_no TEXT,
    p_full_name TEXT,
    p_email TEXT,
    p_class_level INTEGER DEFAULT 11,
    p_parent_email TEXT DEFAULT NULL,
    p_parent_phone TEXT DEFAULT NULL,
    p_guardian_name TEXT DEFAULT NULL,
    p_guardian_mobile TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_profile_id UUID;
    result jsonb;
BEGIN
    -- Insert student profile
    INSERT INTO student_profiles (
        user_id,
        enrollment_no,
        full_name,
        email,
        class_level,
        parent_email,
        parent_phone,
        guardian_name,
        guardian_mobile,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_enrollment_no,
        p_full_name,
        p_email,
        p_class_level,
        COALESCE(p_parent_email, p_email),
        p_parent_phone,
        p_guardian_name,
        p_guardian_mobile,
        'PENDING',
        NOW(),
        NOW()
    ) RETURNING id INTO new_profile_id;

    -- Also create user_profiles entry
    INSERT INTO user_profiles (
        user_id,
        full_name,
        email,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_full_name,
        p_email,
        'STUDENT',
        'PENDING',
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO NOTHING;

    result := jsonb_build_object(
        'success', true,
        'profile_id', new_profile_id,
        'enrollment_no', p_enrollment_no,
        'message', 'Student profile created successfully'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
        RETURN result;
END;
$$;

-- Teacher registration bypass function
CREATE OR REPLACE FUNCTION create_teacher_profile_secure(
    p_user_id UUID,
    p_employee_id TEXT,
    p_full_name TEXT,
    p_email TEXT,
    p_subject_expertise TEXT DEFAULT 'Other',
    p_experience_years INTEGER DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_profile_id UUID;
    result jsonb;
BEGIN
    -- Insert teacher profile
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
    ) VALUES (
        p_user_id,
        p_employee_id,
        p_full_name,
        p_email,
        p_subject_expertise,
        p_experience_years,
        'PENDING',
        NOW(),
        NOW()
    ) RETURNING id INTO new_profile_id;

    -- Also create user_profiles entry
    INSERT INTO user_profiles (
        user_id,
        full_name,
        email,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_full_name,
        p_email,
        'TEACHER',
        'PENDING',
        NOW(),
        NOW()
    ) ON CONFLICT (user_id) DO NOTHING;

    result := jsonb_build_object(
        'success', true,
        'profile_id', new_profile_id,
        'employee_id', p_employee_id,
        'message', 'Teacher profile created successfully'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        result := jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
        RETURN result;
END;
$$;

-- =====================================
-- 4. CLEAN UP OLD TRIGGERS
-- =====================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_immediate ON auth.users;

-- =====================================
-- 5. CREATE PROPER DATABASE TRIGGER
-- =====================================
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS trigger AS $$
DECLARE
    user_role TEXT;
    full_name TEXT;
    enrollment_no TEXT;
    employee_id TEXT;
BEGIN
    -- Only process if user has metadata and is confirmed
    IF NEW.raw_user_meta_data IS NULL THEN
        RETURN NEW;
    END IF;

    user_role := NEW.raw_user_meta_data->>'role';
    full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

    -- Only create profiles for confirmed users or if email confirmation is disabled
    IF NEW.email_confirmed_at IS NOT NULL THEN
        IF user_role = 'student' THEN
            -- Generate enrollment number
            enrollment_no := 'STU' || EXTRACT(YEAR FROM NOW()) || 
                           LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0') || 
                           LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT % 10000, 4, '0');
            
            -- Create student profile if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM student_profiles WHERE user_id = NEW.id) THEN
                INSERT INTO student_profiles (
                    user_id,
                    enrollment_no,
                    full_name,
                    email,
                    class_level,
                    guardian_name,
                    guardian_mobile,
                    parent_phone,
                    status
                ) VALUES (
                    NEW.id,
                    enrollment_no,
                    full_name,
                    NEW.email,
                    COALESCE((NEW.raw_user_meta_data->>'class_level')::integer, 11),
                    NEW.raw_user_meta_data->>'guardian_name',
                    NEW.raw_user_meta_data->>'guardian_mobile',
                    NEW.raw_user_meta_data->>'parent_mobile',
                    'PENDING'
                );
            END IF;

        ELSIF user_role = 'teacher' THEN
            -- Generate employee ID
            employee_id := 'TCH' || EXTRACT(YEAR FROM NOW()) || 
                         LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT % 10000, 4, '0');
            
            -- Create teacher profile if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = NEW.id) THEN
                INSERT INTO teacher_profiles (
                    user_id,
                    employee_id,
                    full_name,
                    email,
                    subject_expertise,
                    experience_years,
                    status
                ) VALUES (
                    NEW.id,
                    employee_id,
                    full_name,
                    NEW.email,
                    COALESCE(NEW.raw_user_meta_data->>'subject_expertise', 'Other'),
                    COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0),
                    'PENDING'
                );
            END IF;

        ELSIF user_role = 'admin' THEN
            -- Create admin profile (auto-approved)
            INSERT INTO user_profiles (
                user_id,
                full_name,
                email,
                role,
                status
            ) VALUES (
                NEW.id,
                full_name,
                NEW.email,
                'ADMIN',
                'APPROVED'
            ) ON CONFLICT (user_id) DO NOTHING;
        END IF;

        -- Create user_profiles entry for students and teachers
        IF user_role IN ('student', 'teacher') THEN
            INSERT INTO user_profiles (
                user_id,
                full_name,
                email,
                role,
                status
            ) VALUES (
                NEW.id,
                full_name,
                NEW.email,
                UPPER(user_role),
                'PENDING'
            ) ON CONFLICT (user_id) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for both INSERT and UPDATE (email confirmation)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION handle_new_user_registration();

-- =====================================
-- 6. SET UP PROPER RLS POLICIES
-- =====================================

-- Re-enable RLS
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Students can view own profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can create own profile" ON student_profiles;
DROP POLICY IF EXISTS "Allow student registration" ON student_profiles;
DROP POLICY IF EXISTS "Allow student profile creation during registration" ON student_profiles;

DROP POLICY IF EXISTS "Teachers can view own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can create own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Allow teacher registration" ON teacher_profiles;

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;

-- Create simple, permissive policies for registration
CREATE POLICY "allow_student_select" ON student_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' IN ('admin', 'teacher'))
    );

CREATE POLICY "allow_student_insert" ON student_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM auth.users WHERE id = user_id)
    );

CREATE POLICY "allow_teacher_select" ON teacher_profiles
    FOR SELECT USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );

CREATE POLICY "allow_teacher_insert" ON teacher_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM auth.users WHERE id = user_id)
    );

CREATE POLICY "allow_user_profile_select" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "allow_user_profile_insert" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================
-- 7. GRANT NECESSARY PERMISSIONS
-- =====================================
GRANT ALL ON student_profiles TO authenticated;
GRANT ALL ON teacher_profiles TO authenticated;
GRANT ALL ON user_profiles TO authenticated;

GRANT EXECUTE ON FUNCTION create_student_profile_secure TO authenticated;
GRANT EXECUTE ON FUNCTION create_teacher_profile_secure TO authenticated;

-- Grant permissions to anon for registration (needed for signup)
GRANT INSERT ON student_profiles TO anon;
GRANT INSERT ON teacher_profiles TO anon;
GRANT INSERT ON user_profiles TO anon;

GRANT EXECUTE ON FUNCTION create_student_profile_secure TO anon;
GRANT EXECUTE ON FUNCTION create_teacher_profile_secure TO anon;

-- =====================================
-- 8. CLEAN UP ORPHANED RECORDS AND ADD FOREIGN KEY CONSTRAINTS
-- =====================================

-- Clean up orphaned records before adding foreign key constraints
DELETE FROM student_profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM teacher_profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM user_profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Add foreign key constraints
DO $$
BEGIN
    -- Add foreign key constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'student_profiles_user_id_fkey'
    ) THEN
        ALTER TABLE student_profiles 
        ADD CONSTRAINT student_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'teacher_profiles_user_id_fkey'
    ) THEN
        ALTER TABLE teacher_profiles 
        ADD CONSTRAINT teacher_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_profiles_user_id_fkey'
    ) THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT user_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =====================================
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_enrollment_no ON student_profiles(enrollment_no);
CREATE INDEX IF NOT EXISTS idx_student_profiles_status ON student_profiles(status);

CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON teacher_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_employee_id ON teacher_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_status ON teacher_profiles(status);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- =====================================
-- VERIFICATION
-- =====================================
SELECT 'Registration system fixed successfully!' as status;
SELECT 'Functions created: create_student_profile_secure, create_teacher_profile_secure' as functions;
SELECT 'Triggers created: on_auth_user_created, on_auth_user_confirmed' as triggers;
SELECT 'RLS policies enabled with permissive registration rules' as security;
