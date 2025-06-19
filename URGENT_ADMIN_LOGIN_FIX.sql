-- =====================================================
-- URGENT ADMIN LOGIN FIX
-- =====================================================
-- This script fixes the immediate admin login issue
-- Run this in your Supabase SQL Editor NOW

-- Step 1: Fix RLS policies to allow admin access
-- First, let's check if user_profiles table exists and has the right structure
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'STUDENT',
    status approval_status DEFAULT 'APPROVED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might be blocking
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- Create permissive policies for admin access
CREATE POLICY "Allow authenticated users to read all profiles" ON user_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 2: Create a trigger to automatically create user_profiles for new users
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, full_name, email, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.email,
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'ADMIN'::user_role
            WHEN NEW.raw_user_meta_data->>'role' = 'teacher' THEN 'TEACHER'::user_role
            WHEN NEW.raw_user_meta_data->>'role' = 'student' THEN 'STUDENT'::user_role
            ELSE 'STUDENT'::user_role
        END,
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'APPROVED'::approval_status
            ELSE 'PENDING'::approval_status
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- Create the trigger
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Step 3: Create missing profile for any existing admin users
-- Check if we have any admin users without profiles and create them
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

-- Step 4: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- Step 5: Create the required enums if they don't exist
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

-- Step 6: Verify the setup
SELECT 'Database setup completed successfully!' as status;

-- Show any admin users and their profiles
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
