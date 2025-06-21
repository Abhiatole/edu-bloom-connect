-- TEACHER ACCESS TO STUDENT PROFILES FIX
-- This script fixes the RLS policies to ensure teachers can view student profiles

-- First drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Teachers can view approved student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Teachers can view all student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Allow teacher access to student profiles" ON student_profiles;

-- Create a new policy to allow teachers to view all student profiles
-- This is more permissive to ensure teachers can see students
CREATE POLICY "Allow teacher access to student profiles" ON student_profiles
  FOR SELECT 
  USING (
    -- Teachers can view all student profiles
    EXISTS (
      SELECT 1 FROM teacher_profiles 
      WHERE user_id = auth.uid()
    )
    -- Admins can also view all profiles
    OR EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE user_id = auth.uid()
    )
    -- Each student can view their own profile
    OR (
      auth.uid() = user_id
    )
  );

-- Verify that the policies are created correctly
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'student_profiles'
ORDER BY
  policyname;
