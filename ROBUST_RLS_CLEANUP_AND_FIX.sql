-- ROBUST RLS CLEANUP AND FIX
-- This script only works with tables that actually exist and fixes column references

-- Drop all existing policies to start fresh
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('student_profiles', 'teacher_profiles', 'admin_profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on table %', pol.policyname, pol.tablename;
    END LOOP;
END $$;

-- Helper function to check if user is admin
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

-- Helper function to check if user is teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'teacher'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is student
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND raw_user_meta_data->>'role' = 'student'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on core tables
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin_profiles if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_profiles') THEN
        ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =======================
-- STUDENT PROFILES POLICIES
-- =======================
CREATE POLICY "student_profiles_select" ON student_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin() OR is_teacher()
    );

CREATE POLICY "student_profiles_insert" ON student_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "student_profiles_update" ON student_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    );

-- =======================
-- TEACHER PROFILES POLICIES
-- =======================
CREATE POLICY "teacher_profiles_select" ON teacher_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "teacher_profiles_insert" ON teacher_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "teacher_profiles_update" ON teacher_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    );

-- =======================
-- ADMIN PROFILES POLICIES (if table exists)
-- =======================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_profiles') THEN
        EXECUTE 'CREATE POLICY "admin_profiles_select" ON admin_profiles FOR SELECT USING (user_id = auth.uid() OR is_admin())';
        EXECUTE 'CREATE POLICY "admin_profiles_insert" ON admin_profiles FOR INSERT WITH CHECK (user_id = auth.uid() OR is_admin())';
        EXECUTE 'CREATE POLICY "admin_profiles_update" ON admin_profiles FOR UPDATE USING (user_id = auth.uid() OR is_admin())';
    END IF;
END $$;

-- =======================
-- OTHER TABLES (only if they exist)
-- =======================

-- Subjects table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subjects') THEN
        ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "subjects_select" ON subjects FOR SELECT TO authenticated USING (true)';
        EXECUTE 'CREATE POLICY "subjects_insert" ON subjects FOR INSERT WITH CHECK (is_admin() OR is_teacher())';
        EXECUTE 'CREATE POLICY "subjects_update" ON subjects FOR UPDATE USING (is_admin() OR is_teacher())';
    END IF;
END $$;

-- Fee payments table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fee_payments') THEN
        ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "fee_payments_select" ON fee_payments FOR SELECT USING (is_admin() OR (is_student() AND student_id = auth.uid()))';
        EXECUTE 'CREATE POLICY "fee_payments_insert" ON fee_payments FOR INSERT WITH CHECK (is_admin() OR (is_student() AND student_id = auth.uid()))';
        EXECUTE 'CREATE POLICY "fee_payments_update" ON fee_payments FOR UPDATE USING (is_admin())';
    END IF;
END $$;

-- Exam results table (references student_profiles.id, not auth.users.id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_results') THEN
        ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "exam_results_select" ON exam_results FOR SELECT USING (is_admin() OR is_teacher() OR (is_student() AND student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())))';
        EXECUTE 'CREATE POLICY "exam_results_insert" ON exam_results FOR INSERT WITH CHECK (is_admin() OR is_teacher())';
        EXECUTE 'CREATE POLICY "exam_results_update" ON exam_results FOR UPDATE USING (is_admin() OR is_teacher())';
    END IF;
END $$;

-- Student insights table (references student_profiles.id, not auth.users.id)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_insights') THEN
        ALTER TABLE student_insights ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "student_insights_select" ON student_insights FOR SELECT USING (is_admin() OR is_teacher() OR (is_student() AND student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())))';
        EXECUTE 'CREATE POLICY "student_insights_insert" ON student_insights FOR INSERT WITH CHECK (is_admin() OR is_teacher())';
        EXECUTE 'CREATE POLICY "student_insights_update" ON student_insights FOR UPDATE USING (is_admin() OR is_teacher())';
    END IF;
END $$;

-- Parent students table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parent_students') THEN
        ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
        EXECUTE 'CREATE POLICY "parent_students_select" ON parent_students FOR SELECT USING (is_admin() OR student_id = auth.uid() OR parent_id = auth.uid())';
        EXECUTE 'CREATE POLICY "parent_students_insert" ON parent_students FOR INSERT WITH CHECK (is_admin() OR student_id = auth.uid())';
        EXECUTE 'CREATE POLICY "parent_students_update" ON parent_students FOR UPDATE USING (is_admin())';
    END IF;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Show final policy summary
SELECT 
    'RLS POLICY SUMMARY' as info,
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

SELECT 'Robust RLS cleanup and fix completed successfully!' as result;
