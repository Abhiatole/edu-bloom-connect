-- EMERGENCY FIX: Registration Database Issues
-- Run this FIRST to fix immediate registration problems

-- =========================================
-- STEP 1: DISABLE ALL RLS TEMPORARILY
-- =========================================
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS student_profiles DISABLE ROW LEVEL SECURITY;  
ALTER TABLE IF EXISTS teacher_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_profiles DISABLE ROW LEVEL SECURITY;

-- =========================================
-- STEP 2: DROP PROBLEMATIC CONSTRAINTS
-- =========================================
-- Drop foreign key constraints that might be causing issues
ALTER TABLE IF EXISTS student_profiles DROP CONSTRAINT IF EXISTS student_profiles_user_id_fkey;
ALTER TABLE IF EXISTS teacher_profiles DROP CONSTRAINT IF EXISTS teacher_profiles_user_id_fkey;
ALTER TABLE IF EXISTS admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_user_id_fkey;

-- =========================================
-- STEP 3: ENSURE BASIC TABLES EXIST
-- =========================================

-- Create user_profiles if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('STUDENT', 'TEACHER', 'ADMIN')),
    full_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create student_profiles if it doesn't exist  
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    enrollment_no TEXT UNIQUE,
    full_name TEXT,
    email TEXT, 
    parent_email TEXT,
    parent_phone TEXT,
    guardian_name TEXT,
    guardian_mobile TEXT,
    grade TEXT,
    subjects TEXT[],
    batch TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teacher_profiles if it doesn't exist
CREATE TABLE IF NOT EXISTS teacher_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    full_name TEXT,
    email TEXT,
    subject_expertise TEXT,
    experience_years INTEGER,
    qualification TEXT,
    bio TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_profiles if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'ADMIN',
    status TEXT DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =========================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_email ON student_profiles(email);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON teacher_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_email ON teacher_profiles(email);

-- =========================================
-- STEP 5: GRANT NECESSARY PERMISSIONS
-- =========================================
-- Grant permissions to authenticated users
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON student_profiles TO authenticated;
GRANT ALL ON teacher_profiles TO authenticated;
GRANT ALL ON admin_profiles TO authenticated;

-- Grant permissions to anon users (for registration)
GRANT INSERT ON user_profiles TO anon;
GRANT INSERT ON student_profiles TO anon;  
GRANT INSERT ON teacher_profiles TO anon;
GRANT INSERT ON admin_profiles TO anon;

-- =========================================
-- STEP 6: CLEAN UP OLD POLICIES AND CREATE NEW ONES
-- =========================================

-- Drop existing policies first (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Allow registration inserts" ON user_profiles;
DROP POLICY IF EXISTS "Allow student registration inserts" ON student_profiles;
DROP POLICY IF EXISTS "Allow teacher registration inserts" ON teacher_profiles;
DROP POLICY IF EXISTS "Allow admin registration inserts" ON admin_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Students can read own profile" ON student_profiles;
DROP POLICY IF EXISTS "Teachers can read own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Admins can read own profile" ON admin_profiles;

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies for registration (allow anyone to insert)
CREATE POLICY "Allow registration inserts" ON user_profiles
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow student registration inserts" ON student_profiles
    FOR INSERT TO anon, authenticated  
    WITH CHECK (true);

CREATE POLICY "Allow teacher registration inserts" ON teacher_profiles
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow admin registration inserts" ON admin_profiles
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Create policies for users to read their own profiles
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Students can read own profile" ON student_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Teachers can read own profile" ON teacher_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can read own profile" ON admin_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- =========================================
-- CONFIRMATION MESSAGE
-- =========================================
SELECT 'Emergency fix applied successfully! Try registration again.' as status;
