-- Comprehensive RLS fix for all profile types
-- This migration consolidates and fixes RLS policies for profiles

-- First enable RLS on all tables if not already enabled
ALTER TABLE IF EXISTS student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;

-- Clear out existing policies for clean slate
DROP POLICY IF EXISTS "Allow student profile creation during registration" ON student_profiles;
DROP POLICY IF EXISTS "Students can update own profile" ON student_profiles;
DROP POLICY IF EXISTS "Allow teacher profile creation during registration" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Admins can create own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can approve users" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Teachers can view approved student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Students can view own profile" ON student_profiles;
DROP POLICY IF EXISTS "Teachers can view own profile" ON teacher_profiles;

-- STUDENT PROFILES POLICIES
-- Student view own profile
CREATE POLICY "Students can view own profile" ON student_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
  
-- Student insert own profile
CREATE POLICY "Students can create own profile" ON student_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Student update own profile
CREATE POLICY "Students can update own profile" ON student_profiles
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Teachers can view approved student profiles
CREATE POLICY "Teachers can view approved student profiles" ON student_profiles
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid()) OR
         EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'ADMIN'));

-- TEACHER PROFILES POLICIES
-- Teacher view own profile
CREATE POLICY "Teachers can view own profile" ON teacher_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Teacher insert own profile
CREATE POLICY "Teachers can create own profile" ON teacher_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Teacher update own profile
CREATE POLICY "Teachers can update own profile" ON teacher_profiles
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin view all teacher profiles
CREATE POLICY "Admins can view all teacher profiles" ON teacher_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'ADMIN'));

-- Admin update teacher profiles (for approval)
CREATE POLICY "Admins can update teacher profiles" ON teacher_profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'ADMIN'));

-- USER PROFILES (ADMIN) POLICIES
-- Admin view own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin insert own profile
CREATE POLICY "Users can create own profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admin update own profile
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'ADMIN'));

-- Admin update all profiles (for approval)
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'ADMIN'));

-- Grant permissions to all tables
GRANT ALL ON public.student_profiles TO authenticated, anon;
GRANT ALL ON public.teacher_profiles TO authenticated, anon;
GRANT ALL ON public.user_profiles TO authenticated, anon;
