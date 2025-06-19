-- Fix RLS policies for student registration
-- This migration adds missing INSERT policies for student_profiles and teacher_profiles

-- Add INSERT policy for student registration
CREATE POLICY "Allow student profile creation during registration" ON student_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'PENDING');

-- Add UPDATE policy for students to update their own profiles
CREATE POLICY "Students can update own profile" ON student_profiles
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add INSERT policy for teacher registration
CREATE POLICY "Allow teacher profile creation during registration" ON teacher_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'PENDING');

-- Add UPDATE policy for teachers to update their own profiles
CREATE POLICY "Teachers can update own profile" ON teacher_profiles
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Fix the incorrect teacher policy that was applied to teacher_profiles instead of student_profiles
DROP POLICY IF EXISTS "Teachers can view approved student profiles" ON teacher_profiles;

-- Add the correct policy for teachers to view approved student profiles
CREATE POLICY "Teachers can view approved student profiles" ON student_profiles
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid() AND status = 'APPROVED') AND status = 'APPROVED');
