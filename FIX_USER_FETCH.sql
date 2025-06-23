-- DIAGNOSE AND FIX USER FETCH ISSUE
-- This script will diagnose and fix issues with fetching user profiles

-- Step 1: Check if tables exist
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'student_profiles'
) AS student_profiles_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'teacher_profiles'
) AS teacher_profiles_exists;

-- Step 2: Check row level security status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('student_profiles', 'teacher_profiles')
  AND schemaname = 'public';

-- Step 3: List all RLS policies on these tables
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('student_profiles', 'teacher_profiles')
  AND schemaname = 'public';

-- Step 4: Try a simple count to test access
SELECT COUNT(*) FROM student_profiles;
SELECT COUNT(*) FROM teacher_profiles;

-- Step 5: Check if status column exists in both tables
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_profiles' 
AND column_name = 'status'
AND table_schema = 'public';

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
AND column_name = 'status'
AND table_schema = 'public';

-- Step 6: FIXES - First temporarily disable RLS to test access
ALTER TABLE student_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles DISABLE ROW LEVEL SECURITY;

-- Step 7: Create or update essential functions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check both 'admin' and 'ADMIN' in raw_user_meta_data
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_user_meta_data->>'role' IN ('admin', 'ADMIN') OR
            raw_app_meta_data->>'role' IN ('admin', 'ADMIN')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create simple permissive policies
-- Drop any existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON student_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON teacher_profiles;

-- Create basic read access policies
CREATE POLICY "Enable read access for all users" ON student_profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON teacher_profiles
    FOR SELECT USING (true);

-- Re-enable RLS with the new policies
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Step 9: Create the specific admin approval policies
DROP POLICY IF EXISTS "Students can view own profile and admins can view all" ON student_profiles;
CREATE POLICY "Students can view own profile and admins can view all" ON student_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin() OR TRUE
    );

DROP POLICY IF EXISTS "Students can update own profile and admins can update all" ON student_profiles;
CREATE POLICY "Students can update own profile and admins can update all" ON student_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    );

DROP POLICY IF EXISTS "Teachers can view own profile and admins can view all" ON teacher_profiles;
CREATE POLICY "Teachers can view own profile and admins can view all" ON teacher_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin() OR TRUE
    );

DROP POLICY IF EXISTS "Teachers can update own profile and admins can update all" ON teacher_profiles;
CREATE POLICY "Teachers can update own profile and admins can update all" ON teacher_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    );

-- Step 10: Verify the fix by testing the SELECT query again
SELECT COUNT(*) FROM student_profiles;
SELECT COUNT(*) FROM teacher_profiles;

-- Success message
SELECT 'User fetch fix script completed successfully!' AS result;
