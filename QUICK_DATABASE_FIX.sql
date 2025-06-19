-- Quick Database Fix Script
-- Run this in your Supabase SQL Editor to fix registration issues

-- 1. Ensure user_profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    class_level INTEGER,
    guardian_name VARCHAR(100),
    guardian_mobile VARCHAR(15),
    subject_expertise TEXT,
    experience_years INTEGER,
    profile_picture TEXT,
    approved_by UUID REFERENCES auth.users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create admin_profiles table if missing
CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create basic RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;
CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 5. Create basic RLS policies for student_profiles
DROP POLICY IF EXISTS "Students can view own profile" ON student_profiles;
CREATE POLICY "Students can view own profile" ON student_profiles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow student profile creation" ON student_profiles;
CREATE POLICY "Allow student profile creation" ON student_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 6. Create basic RLS policies for teacher_profiles
DROP POLICY IF EXISTS "Teachers can view own profile" ON teacher_profiles;
CREATE POLICY "Teachers can view own profile" ON teacher_profiles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow teacher profile creation" ON teacher_profiles;
CREATE POLICY "Allow teacher profile creation" ON teacher_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 7. Create basic RLS policies for admin_profiles
DROP POLICY IF EXISTS "Admins can view own profile" ON admin_profiles;
CREATE POLICY "Admins can view own profile" ON admin_profiles
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Allow admin profile creation" ON admin_profiles;
CREATE POLICY "Allow admin profile creation" ON admin_profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.user_profiles TO authenticated, anon;
GRANT ALL ON public.student_profiles TO authenticated, anon;
GRANT ALL ON public.teacher_profiles TO authenticated, anon;
GRANT ALL ON public.admin_profiles TO authenticated, anon;

-- Test query to verify setup
SELECT 'Database setup completed successfully!' as status;
