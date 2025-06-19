-- =====================================================
-- COMPLETE RLS POLICY FIX FOR ALL PROFILE TABLES
-- =====================================================
-- This fixes the 406 errors for student_profiles, teacher_profiles, and user_profiles
-- Run this ENTIRE script in your Supabase SQL Editor

-- Step 1: Fix student_profiles table RLS policies
-- First ensure the table exists and has RLS enabled
ALTER TABLE IF EXISTS student_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing restrictive policies on student_profiles
DROP POLICY IF EXISTS "Users can read their own profile" ON student_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON student_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON student_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON student_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON student_profiles;
DROP POLICY IF EXISTS "Students can read own profile" ON student_profiles;
DROP POLICY IF EXISTS "Admins can read all student profiles" ON student_profiles;

-- Create permissive policies for student_profiles
CREATE POLICY "Allow authenticated users to read student profiles" ON student_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert their own student profile" ON student_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own student profile" ON student_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 2: Fix teacher_profiles table RLS policies
-- First ensure the table exists and has RLS enabled
ALTER TABLE IF EXISTS teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing restrictive policies on teacher_profiles
DROP POLICY IF EXISTS "Users can read their own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON teacher_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON teacher_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can read own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Admins can read all teacher profiles" ON teacher_profiles;

-- Create permissive policies for teacher_profiles
CREATE POLICY "Allow authenticated users to read teacher profiles" ON teacher_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert their own teacher profile" ON teacher_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own teacher profile" ON teacher_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 3: Fix user_profiles table RLS policies (for admin profiles)
-- First ensure the table exists and has RLS enabled
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing restrictive policies on user_profiles
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON user_profiles;

-- Create permissive policies for user_profiles
CREATE POLICY "Allow authenticated users to read user profiles" ON user_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to insert their own user profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own user profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 4: Grant necessary permissions on all tables
GRANT SELECT, INSERT, UPDATE ON student_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON teacher_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- Step 5: Create or update the user profile creation trigger
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile in user_profiles for admin users
    IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
        INSERT INTO user_profiles (user_id, full_name, email, role, status)
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin User'),
            NEW.email,
            'ADMIN'::user_role,
            'APPROVED'::approval_status
        )
        ON CONFLICT (user_id) DO UPDATE SET
            role = 'ADMIN',
            status = 'APPROVED';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Step 6: Create missing admin profiles for existing users
INSERT INTO user_profiles (user_id, full_name, email, role, status)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Admin User'),
    u.email,
    'ADMIN'::user_role,
    'APPROVED'::approval_status
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' = 'admin'
AND NOT EXISTS (
    SELECT 1 FROM user_profiles p WHERE p.user_id = u.id
)
ON CONFLICT (user_id) DO UPDATE SET
    role = 'ADMIN',
    status = 'APPROVED';

-- Step 7: Verify the setup
SELECT 'All RLS policies fixed successfully!' as status;

-- Show current policies for verification
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename IN ('student_profiles', 'teacher_profiles', 'user_profiles')
ORDER BY tablename, policyname;

-- Show admin users and their profiles
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as auth_role,
    p.role as profile_role,
    p.status,
    p.created_at
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.raw_user_meta_data->>'role' = 'admin'
ORDER BY u.created_at DESC;
