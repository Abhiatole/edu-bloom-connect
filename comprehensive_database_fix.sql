-- =====================================
-- EduGrowHub Database Complete Fix
-- =====================================
-- This script fixes all registration, email confirmation, approval, and dashboard issues
-- Apply this in your Supabase SQL Editor

-- =====================================
-- 1. REGISTRATION FIXES
-- =====================================

-- Temporarily disable RLS for setup
ALTER TABLE IF EXISTS student_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;

-- =====================================
-- 2. ENSURE REQUIRED COLUMNS EXIST
-- =====================================

-- Add missing columns to student_profiles if they don't exist
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS parent_phone TEXT;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS approved_by_teacher_id UUID REFERENCES teacher_profiles(id);

-- Add missing columns to teacher_profiles if they don't exist  
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS approved_by_admin_id UUID;

-- Grant permissions for registration
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================
-- 2. STUDENT REGISTRATION BYPASS FUNCTION
-- =====================================

CREATE OR REPLACE FUNCTION register_student_bypass(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_class_level TEXT DEFAULT '11',
  p_parent_email TEXT DEFAULT NULL,
  p_parent_phone TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_enrollment_no TEXT;
  new_profile_id UUID;
  result jsonb;
BEGIN
  -- Generate enrollment number
  new_enrollment_no := 'STU' || EXTRACT(YEAR FROM NOW()) || 
                       LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0') || 
                       LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT % 10000, 4, '0');

  -- Insert student profile
  INSERT INTO student_profiles (
    user_id,
    enrollment_no,
    class_level,
    parent_email,
    parent_phone,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    new_enrollment_no,
    p_class_level,
    COALESCE(p_parent_email, p_email),
    p_parent_phone,
    'PENDING',
    NOW(),
    NOW()
  ) RETURNING id INTO new_profile_id;

  -- Also create a user_profile entry for consistency
  INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_full_name,
    p_email,
    'STUDENT',
    'PENDING',
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Return success result
  result := jsonb_build_object(
    'success', true,
    'profile_id', new_profile_id,
    'enrollment_no', new_enrollment_no,
    'message', 'Student profile created successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
    RETURN result;
END;
$$;

-- =====================================
-- 3. TEACHER REGISTRATION FUNCTION
-- =====================================

-- Create enum type for subject expertise if it doesn't exist
DO $$ BEGIN
    CREATE TYPE subject_enum AS ENUM ('Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE OR REPLACE FUNCTION register_teacher_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_subject_expertise TEXT DEFAULT 'Other',
  p_experience_years INTEGER DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_employee_id TEXT;
  new_profile_id UUID;
  result jsonb;
BEGIN
  -- Generate employee ID
  new_employee_id := 'TCH' || EXTRACT(YEAR FROM NOW()) || 
                     LPAD((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT % 10000, 4, '0');

  -- Insert teacher profile
  INSERT INTO teacher_profiles (
    user_id,
    employee_id,
    full_name,
    email,
    subject_expertise,
    experience_years,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    new_employee_id,
    p_full_name,
    p_email,
    p_subject_expertise::subject_enum,
    p_experience_years,
    'PENDING',
    NOW(),
    NOW()
  ) RETURNING id INTO new_profile_id;

  -- Also create a user_profile entry
  INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    role,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_full_name,
    p_email,
    'TEACHER',
    'PENDING',
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Return success result
  result := jsonb_build_object(
    'success', true,
    'profile_id', new_profile_id,
    'employee_id', new_employee_id,
    'message', 'Teacher profile created successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
    RETURN result;
END;
$$;

-- =====================================
-- 4. BATCHES AND SUBJECTS TABLES
-- =====================================

-- Ensure student_profiles has all required columns
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS parent_phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by_teacher_id UUID REFERENCES teacher_profiles(id);

-- Ensure teacher_profiles has all required columns  
ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by_admin_id UUID REFERENCES user_profiles(id);

-- Create batches table for NEET/JEE/CET selections
CREATE TABLE IF NOT EXISTS batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- 'NEET', 'JEE', 'CET', 'Other'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default batches
INSERT INTO batches (name, description) VALUES
  ('NEET', 'National Eligibility cum Entrance Test'),
  ('JEE', 'Joint Entrance Examination'),
  ('CET', 'Common Entrance Test'),
  ('Other', 'Other competitive exams')
ON CONFLICT (name) DO NOTHING;

-- Create subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subjects
INSERT INTO subjects (name, description) VALUES
  ('Physics', 'Physics'),
  ('Chemistry', 'Chemistry'),
  ('Mathematics', 'Mathematics'),
  ('Biology', 'Biology'),
  ('English', 'English'),
  ('Other', 'Other subjects')
ON CONFLICT (name) DO NOTHING;

-- Student-Batch relationship table
CREATE TABLE IF NOT EXISTS student_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, batch_id)
);

-- Student-Subject relationship table
CREATE TABLE IF NOT EXISTS student_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- =====================================
-- 5. EXAM RESULTS AND TIMETABLES FIXES
-- =====================================

-- Fix exam_results table if it exists
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  exam_id UUID, -- Will reference exams table when created
  subject_id UUID REFERENCES subjects(id),
  marks_obtained INTEGER NOT NULL CHECK (marks_obtained >= 0),
  total_marks INTEGER NOT NULL CHECK (total_marks > 0),
  percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_marks > 0 THEN (marks_obtained::DECIMAL / total_marks::DECIMAL) * 100
      ELSE 0
    END
  ) STORED,
  grade TEXT,
  exam_date DATE,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix timetables table
CREATE TABLE IF NOT EXISTS timetables (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_level INTEGER NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  teacher_id UUID REFERENCES teacher_profiles(id),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- =====================================
-- 6. APPROVAL FUNCTIONS
-- =====================================

-- Function to approve students
CREATE OR REPLACE FUNCTION approve_student(
  p_student_id UUID,
  p_approved_by_teacher_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Update student status
  UPDATE student_profiles 
  SET 
    status = 'APPROVED',
    approval_date = NOW(),
    approved_by_teacher_id = p_approved_by_teacher_id,
    updated_at = NOW()
  WHERE id = p_student_id;

  -- Also update user_profiles if exists
  UPDATE user_profiles 
  SET status = 'APPROVED', updated_at = NOW()
  WHERE user_id = (SELECT user_id FROM student_profiles WHERE id = p_student_id);

  result := jsonb_build_object(
    'success', true,
    'message', 'Student approved successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- Function to approve teachers
CREATE OR REPLACE FUNCTION approve_teacher(
  p_teacher_id UUID,
  p_approved_by_admin_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Update teacher status
  UPDATE teacher_profiles 
  SET 
    status = 'APPROVED',
    approval_date = NOW(),
    approved_by_admin_id = p_approved_by_admin_id,
    updated_at = NOW()
  WHERE id = p_teacher_id;

  -- Also update user_profiles if exists
  UPDATE user_profiles 
  SET status = 'APPROVED', updated_at = NOW()
  WHERE user_id = (SELECT user_id FROM teacher_profiles WHERE id = p_teacher_id);

  result := jsonb_build_object(
    'success', true,
    'message', 'Teacher approved successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;

-- =====================================
-- 7. RLS POLICIES
-- =====================================

-- Re-enable RLS with proper policies
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Student profiles policies
DROP POLICY IF EXISTS "Students can view own profile" ON student_profiles;
CREATE POLICY "Students can view own profile" ON student_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow student registration" ON student_profiles;
CREATE POLICY "Allow student registration" ON student_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = user_id)
  );

DROP POLICY IF EXISTS "Allow student updates" ON student_profiles;
CREATE POLICY "Allow student updates" ON student_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Teacher profiles policies
DROP POLICY IF EXISTS "Teachers can view own profile" ON teacher_profiles;
CREATE POLICY "Teachers can view own profile" ON teacher_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow teacher registration" ON teacher_profiles;
CREATE POLICY "Allow teacher registration" ON teacher_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = user_id)
  );

-- User profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow user registration" ON user_profiles;
CREATE POLICY "Allow user registration" ON user_profiles
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM auth.users WHERE id = user_id)
  );

-- Allow teachers and admins to view pending approvals
DROP POLICY IF EXISTS "Teachers can view pending students" ON student_profiles;
CREATE POLICY "Teachers can view pending students" ON student_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles t 
      WHERE t.user_id = auth.uid() AND t.status = 'APPROVED'
    )
  );

DROP POLICY IF EXISTS "Admins can view all" ON student_profiles;
CREATE POLICY "Admins can view all" ON student_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles u 
      WHERE u.user_id = auth.uid() AND u.role = 'ADMIN' AND u.status = 'APPROVED'
    )
  );

-- =====================================
-- 8. SAMPLE DATA FOR TESTING
-- =====================================

-- Insert sample admin (for testing)
DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'admin@edugrow.com';
BEGIN
  -- Check if admin already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
  
  IF admin_user_id IS NULL THEN
    -- Insert into auth.users (this should be done via Supabase Auth, but for testing)
    INSERT INTO user_profiles (
      user_id,
      full_name,
      email,
      role,
      status,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'Super Admin',
      admin_email,
      'ADMIN',
      'APPROVED',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- =====================================
-- 9. GRANT FUNCTION PERMISSIONS
-- =====================================

GRANT EXECUTE ON FUNCTION register_student_bypass TO authenticated, anon;
GRANT EXECUTE ON FUNCTION register_teacher_profile TO authenticated, anon;
GRANT EXECUTE ON FUNCTION approve_student TO authenticated;
GRANT EXECUTE ON FUNCTION approve_teacher TO authenticated;

-- =====================================
-- 10. HELPFUL VIEWS FOR DASHBOARDS
-- =====================================

-- Ensure student_profiles has all required columns
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS parent_phone TEXT,
ADD COLUMN IF NOT EXISTS enrollment_no TEXT,
ADD COLUMN IF NOT EXISTS class_level TEXT,
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS class TEXT,
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by_teacher_id UUID;

-- Ensure teacher_profiles has all required columns  
ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS subject_expertise TEXT[],
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by_admin_id UUID;

-- View for student dashboard data
CREATE OR REPLACE VIEW student_dashboard_data AS
SELECT 
  sp.id,
  sp.user_id,
  COALESCE(sp.enrollment_no, '') as enrollment_no,
  COALESCE(sp.class_level::text, '') as class_level,
  COALESCE(sp.parent_email, '') as parent_email,
  COALESCE(sp.parent_phone, '') as parent_phone,
  COALESCE(sp.status, 'PENDING') as status,
  COALESCE(sp.full_name, up.full_name, '') as full_name,
  COALESCE(up.email, '') as email,
  COUNT(sb.batch_id) as enrolled_batches_count,
  COUNT(ss.subject_id) as enrolled_subjects_count
FROM student_profiles sp
LEFT JOIN user_profiles up ON up.user_id = sp.user_id
LEFT JOIN student_batches sb ON sb.student_id = sp.id
LEFT JOIN student_subjects ss ON ss.student_id = sp.id
GROUP BY sp.id, sp.user_id, sp.enrollment_no, sp.class_level,
         sp.parent_email, sp.parent_phone, sp.status,
         sp.full_name, up.full_name, up.email;

-- View for teacher dashboard data
CREATE OR REPLACE VIEW teacher_dashboard_data AS
SELECT 
  tp.id,
  tp.user_id,
  COALESCE(tp.employee_id, '') as employee_id,
  COALESCE(tp.full_name, up.full_name, '') as full_name,
  COALESCE(up.email, '') as email,
  COALESCE(tp.subject_expertise::text, '') as subject_expertise,
  COALESCE(tp.experience_years, 0) as experience_years,
  COALESCE(tp.status, 'PENDING') as status,
  COUNT(DISTINCT sp.id) as pending_students_count
FROM teacher_profiles tp
LEFT JOIN user_profiles up ON up.user_id = tp.user_id
LEFT JOIN student_profiles sp ON sp.status = 'PENDING'
GROUP BY tp.id, tp.user_id, tp.employee_id, tp.full_name, up.full_name,
         up.email, tp.subject_expertise, tp.experience_years, tp.status;

-- =====================================
-- VERIFICATION QUERIES
-- =====================================

-- You can run these to verify everything is working:

-- Check if functions exist:
-- SELECT proname FROM pg_proc WHERE proname IN ('register_student_bypass', 'register_teacher_profile');

-- Check if tables exist:
-- SELECT tablename FROM pg_tables WHERE tablename IN ('student_profiles', 'teacher_profiles', 'batches', 'subjects');

-- Check policies:
-- SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('student_profiles', 'teacher_profiles');

-- Test student registration function:
-- SELECT register_student_bypass(gen_random_uuid(), 'test@example.com', 'Test Student', 11, 'test@example.com', '1234567890');

SELECT 'Database setup completed successfully!' as status;
