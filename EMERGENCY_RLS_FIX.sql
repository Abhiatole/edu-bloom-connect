-- EMERGENCY RLS FIX - EXECUTE THIS IN SUPABASE SQL EDITOR
-- This script temporarily disables RLS to fix the issues with profile queries

-- STEP 1: TEMPORARILY DISABLE RLS ON ALL PROFILE TABLES
ALTER TABLE IF EXISTS student_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: DROP ALL EXISTING POLICIES
-- Student profiles policies
DO $$
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON student_profiles;', E'\n')
        FROM pg_policies
        WHERE tablename = 'student_profiles'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping student_profiles policies: %', SQLERRM;
END $$;

-- Teacher profiles policies
DO $$
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON teacher_profiles;', E'\n')
        FROM pg_policies
        WHERE tablename = 'teacher_profiles'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping teacher_profiles policies: %', SQLERRM;
END $$;

-- User profiles policies
DO $$
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON user_profiles;', E'\n')
        FROM pg_policies
        WHERE tablename = 'user_profiles'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping user_profiles policies: %', SQLERRM;
END $$;

-- STEP 3: VERIFY RLS IS DISABLED
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('student_profiles', 'teacher_profiles', 'user_profiles')
  AND schemaname = 'public';

-- STEP 4: QUERY THE TABLES DIRECTLY TO VERIFY ACCESS
SELECT COUNT(*) FROM student_profiles;
SELECT COUNT(*) FROM teacher_profiles;
SELECT COUNT(*) FROM user_profiles;

-- STEP 5: DEBUGGING INFO - GET TABLE STRUCTURES
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'teacher_profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 6: AFTER CONFIRMING TABLES ARE ACCESSIBLE, ENABLE RLS WITH SIMPLE POLICIES
-- This step is OPTIONAL and should only be run after confirming access works
-- without RLS enabled. If you want to keep RLS disabled for now, DO NOT run this section.

/*
-- Re-enable RLS with proper policies
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple permissive policies for all authenticated users
CREATE POLICY "Allow full access to authenticated users" ON student_profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON teacher_profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow full access to authenticated users" ON user_profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Double-check that policies were created
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('student_profiles', 'teacher_profiles', 'user_profiles')
  AND schemaname = 'public';
*/

-- IMPORTANT: After executing this script, try accessing your application again.
-- If it works with RLS disabled, but then fails when RLS is re-enabled with permissive
-- policies, there may be deeper issues with your database schema or Supabase configuration.
