-- RLS_REACTIVATION.sql
-- Run this script after fixing any database access issues to reestablish proper RLS policies

-- STEP 1: ENSURE RLS IS CURRENTLY DISABLED FOR TESTING
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('student_profiles', 'teacher_profiles', 'user_profiles')
  AND schemaname = 'public';

-- STEP 2: DROP ALL EXISTING POLICIES FOR A CLEAN START
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

-- STEP 3: ENABLE RLS ON ALL TABLES
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: CREATE PERMISSIVE POLICIES FOR AUTHENTICATION

-- STUDENT PROFILES POLICIES
-- Allow anyone to read student profiles
CREATE POLICY "Allow all to read student profiles" ON student_profiles
  FOR SELECT TO authenticated, anon
  USING (true);
  
-- Allow authenticated users to create their own student profile
CREATE POLICY "Allow authenticated to create student profile" ON student_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own student profile
CREATE POLICY "Allow authenticated to update own student profile" ON student_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- TEACHER PROFILES POLICIES
-- Allow anyone to read teacher profiles
CREATE POLICY "Allow all to read teacher profiles" ON teacher_profiles
  FOR SELECT TO authenticated, anon
  USING (true);
  
-- Allow authenticated users to create their own teacher profile
CREATE POLICY "Allow authenticated to create teacher profile" ON teacher_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own teacher profile
CREATE POLICY "Allow authenticated to update own teacher profile" ON teacher_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- USER PROFILES (ADMIN) POLICIES
-- Allow anyone to read user profiles
CREATE POLICY "Allow all to read user profiles" ON user_profiles
  FOR SELECT TO authenticated, anon
  USING (true);
  
-- Allow authenticated users to create their own user profile
CREATE POLICY "Allow authenticated to create user profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own user profile
CREATE POLICY "Allow authenticated to update own user profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- STEP 5: VERIFY POLICIES ARE APPLIED
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('student_profiles', 'teacher_profiles', 'user_profiles')
ORDER BY tablename, policyname;

-- STEP 6: TEST QUERIES
-- These should now return data without error
SELECT COUNT(*) FROM student_profiles;
SELECT COUNT(*) FROM teacher_profiles;
SELECT COUNT(*) FROM user_profiles;

-- Note: These policies are intentionally very permissive for diagnostic purposes.
-- In a production environment, you should implement more restrictive policies
-- based on user roles and access requirements.
