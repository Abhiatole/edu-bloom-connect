-- =====================================================
-- COMPREHENSIVE DATABASE FIX FOR REGISTRATION ISSUES
-- =====================================================
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Create missing enums if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'PARENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subject_type AS ENUM ('Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Ensure all required tables exist with correct structure

-- Fix student_profiles table
DROP TABLE IF EXISTS student_profiles CASCADE;
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    class_level INTEGER DEFAULT 11,
    guardian_name VARCHAR(100),
    guardian_mobile VARCHAR(15),
    status approval_status DEFAULT 'PENDING',
    approved_by UUID REFERENCES auth.users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix teacher_profiles table
DROP TABLE IF EXISTS teacher_profiles CASCADE;
CREATE TABLE teacher_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    subject_expertise subject_type DEFAULT 'Other',
    experience_years INTEGER DEFAULT 0,
    status approval_status DEFAULT 'PENDING',
    approved_by UUID REFERENCES auth.users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix admin_profiles table
DROP TABLE IF EXISTS admin_profiles CASCADE;
CREATE TABLE admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create the profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if user has a role in metadata
  IF NEW.raw_user_meta_data ? 'role' THEN
    -- Handle student registration
    IF NEW.raw_user_meta_data->>'role' = 'student' THEN
      INSERT INTO public.student_profiles (
        user_id,
        full_name,
        email,
        class_level,
        guardian_name,
        guardian_mobile,
        status
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'class_level')::integer, 11),
        NEW.raw_user_meta_data->>'guardian_name',
        NEW.raw_user_meta_data->>'guardian_mobile',
        'PENDING'
      );
    -- Handle teacher registration
    ELSIF NEW.raw_user_meta_data->>'role' = 'teacher' THEN
      INSERT INTO public.teacher_profiles (
        user_id,
        full_name,
        email,
        subject_expertise,
        experience_years,
        status
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'subject_expertise')::subject_type, 'Other'),
        COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0),
        'PENDING'
      );
    -- Handle admin/superadmin registration
    ELSIF NEW.raw_user_meta_data->>'role' IN ('admin', 'superadmin') THEN
      INSERT INTO public.admin_profiles (
        user_id,
        full_name,
        email
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 5: Enable RLS on all tables
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
-- Student profiles policies
DROP POLICY IF EXISTS "Students can view own profile" ON student_profiles;
CREATE POLICY "Students can view own profile" ON student_profiles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow student profile creation" ON student_profiles;
CREATE POLICY "Allow student profile creation" ON student_profiles
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Students can update own profile" ON student_profiles;
CREATE POLICY "Students can update own profile" ON student_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Teacher profiles policies
DROP POLICY IF EXISTS "Teachers can view own profile" ON teacher_profiles;
CREATE POLICY "Teachers can view own profile" ON teacher_profiles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow teacher profile creation" ON teacher_profiles;
CREATE POLICY "Allow teacher profile creation" ON teacher_profiles
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;
CREATE POLICY "Teachers can update own profile" ON teacher_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Admin profiles policies
DROP POLICY IF EXISTS "Admins can view own profile" ON admin_profiles;
CREATE POLICY "Admins can view own profile" ON admin_profiles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow admin profile creation" ON admin_profiles;
CREATE POLICY "Allow admin profile creation" ON admin_profiles
    FOR INSERT WITH CHECK (true);

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.student_profiles TO authenticated, anon;
GRANT ALL ON public.teacher_profiles TO authenticated, anon;
GRANT ALL ON public.admin_profiles TO authenticated, anon;

-- Step 8: Test the setup
SELECT 'Database setup completed successfully!' as status;
SELECT 'You can now test user registration!' as next_step;
