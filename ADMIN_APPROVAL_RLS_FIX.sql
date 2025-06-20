-- ADMIN APPROVAL SYSTEM - TARGETED RLS FIX
-- This script fixes only the policies needed for admin approval to work

-- First, ensure we have the admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' IN ('admin', 'superadmin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove conflicting policies that prevent admin approval
DROP POLICY IF EXISTS "Admins can view own profile" ON admin_profiles;
DROP POLICY IF EXISTS "Allow admin profile creation" ON admin_profiles;
DROP POLICY IF EXISTS "Admins can update any student profile" ON student_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Allow student profile creation" ON student_profiles;
DROP POLICY IF EXISTS "Allow users to insert their own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Allow users to update their own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Enable read own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Enable update own student profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can update own profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can update own profile and admins can update all" ON student_profiles;
DROP POLICY IF EXISTS "Students can view own profile" ON student_profiles;
DROP POLICY IF EXISTS "Students can view own profile and admins can view all" ON student_profiles;

-- Teacher profiles cleanup
DROP POLICY IF EXISTS "allow_teacher_registration" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can update own profile and admins can update all" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can view own profile and admins can view all" ON teacher_profiles;

-- User profiles cleanup (if exists)
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to insert their own user profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own user profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read own user profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable update own user profile" ON user_profiles;

-- Approval logs cleanup
DROP POLICY IF EXISTS "approval_logs_insert_policy" ON approval_logs;
DROP POLICY IF EXISTS "approval_logs_select_policy" ON approval_logs;

-- NOW CREATE CLEAN, WORKING POLICIES FOR ADMIN APPROVAL

-- =======================
-- STUDENT PROFILES - ADMIN APPROVAL FOCUS
-- =======================
CREATE POLICY "admin_approval_student_read" ON student_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "admin_approval_student_update" ON student_profiles
    FOR UPDATE USING (
        is_admin() OR user_id = auth.uid()
    ) WITH CHECK (
        is_admin() OR user_id = auth.uid()
    );

CREATE POLICY "admin_approval_student_insert" ON student_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

-- =======================
-- TEACHER PROFILES - ADMIN APPROVAL FOCUS
-- =======================
CREATE POLICY "admin_approval_teacher_read" ON teacher_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "admin_approval_teacher_update" ON teacher_profiles
    FOR UPDATE USING (
        is_admin() OR user_id = auth.uid()
    ) WITH CHECK (
        is_admin() OR user_id = auth.uid()
    );

CREATE POLICY "admin_approval_teacher_insert" ON teacher_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

-- =======================
-- ADMIN PROFILES
-- =======================
CREATE POLICY "admin_profile_access" ON admin_profiles
    FOR ALL USING (
        user_id = auth.uid() OR is_admin()
    ) WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

-- =======================
-- APPROVAL LOGS (if needed)
-- =======================
CREATE POLICY "approval_logs_admin_only" ON approval_logs
    FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Ensure RLS is properly enabled
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Test the admin approval functionality
SELECT 
    'ADMIN APPROVAL TEST' as test_name,
    'Checking if admin can read student profiles...' as test_description,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'student_profiles' 
            AND policyname LIKE '%admin%'
        ) THEN '✅ Admin policies exist for student_profiles'
        ELSE '❌ No admin policies found'
    END as result;

-- Show current clean policies
SELECT 
    'CLEAN ADMIN APPROVAL POLICIES' as status,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('student_profiles', 'teacher_profiles', 'admin_profiles')
AND policyname LIKE '%admin%approval%'
ORDER BY tablename, policyname;

-- Final verification
SELECT 
    'ADMIN APPROVAL SYSTEM STATUS' as final_check,
    COUNT(CASE WHEN tablename = 'student_profiles' THEN 1 END) as student_policies,
    COUNT(CASE WHEN tablename = 'teacher_profiles' THEN 1 END) as teacher_policies,
    COUNT(CASE WHEN tablename = 'admin_profiles' THEN 1 END) as admin_policies
FROM pg_policies 
WHERE tablename IN ('student_profiles', 'teacher_profiles', 'admin_profiles')
AND policyname LIKE '%admin%approval%';

SELECT 'Admin approval RLS policies fixed and ready!' as result;
