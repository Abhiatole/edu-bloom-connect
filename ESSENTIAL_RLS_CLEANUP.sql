-- ESSENTIAL RLS POLICIES - SIMPLIFIED VERSION
-- This script sets up only the most important RLS policies for core functionality

-- Helper functions for role checking
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

-- Clean up existing policies for core tables only
DROP POLICY IF EXISTS "student_profiles_select" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_insert" ON student_profiles;
DROP POLICY IF EXISTS "student_profiles_update" ON student_profiles;
DROP POLICY IF EXISTS "teacher_profiles_select" ON teacher_profiles;
DROP POLICY IF EXISTS "teacher_profiles_insert" ON teacher_profiles;
DROP POLICY IF EXISTS "teacher_profiles_update" ON teacher_profiles;
DROP POLICY IF EXISTS "admin_profiles_select" ON admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_insert" ON admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_update" ON admin_profiles;

-- Remove duplicate/conflicting policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename IN ('student_profiles', 'teacher_profiles', 'admin_profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, 
            CASE 
                WHEN pol.policyname LIKE '%student%' THEN 'student_profiles'
                WHEN pol.policyname LIKE '%teacher%' THEN 'teacher_profiles'
                WHEN pol.policyname LIKE '%admin%' THEN 'admin_profiles'
            END
        );
    END LOOP;
END $$;

-- =======================
-- STUDENT PROFILES - CLEAN POLICIES
-- =======================
CREATE POLICY "student_profiles_read" ON student_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "student_profiles_create" ON student_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "student_profiles_modify" ON student_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    ) WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

-- =======================
-- TEACHER PROFILES - CLEAN POLICIES
-- =======================
CREATE POLICY "teacher_profiles_read" ON teacher_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "teacher_profiles_create" ON teacher_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "teacher_profiles_modify" ON teacher_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    ) WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

-- =======================
-- ADMIN PROFILES - CLEAN POLICIES
-- =======================
CREATE POLICY "admin_profiles_read" ON admin_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "admin_profiles_create" ON admin_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "admin_profiles_modify" ON admin_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    ) WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

-- Ensure RLS is enabled
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Show the clean policy setup
SELECT 
    'CLEAN RLS POLICIES' as status,
    tablename,
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename IN ('student_profiles', 'teacher_profiles', 'admin_profiles')
ORDER BY tablename, policyname;

SELECT 'Essential RLS policies cleaned and fixed!' as result;
