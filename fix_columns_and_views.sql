-- =====================================
-- EMERGENCY FIX: ADD MISSING COLUMNS AND RECREATE VIEWS
-- =====================================

-- Add missing columns to student_profiles if they don't exist
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS parent_phone TEXT,
ADD COLUMN IF NOT EXISTS enrollment_no TEXT,
ADD COLUMN IF NOT EXISTS class_level TEXT,
ADD COLUMN IF NOT EXISTS parent_email TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS class TEXT,
ADD COLUMN IF NOT EXISTS section TEXT,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by_teacher_id UUID;

-- Add missing columns to teacher_profiles if they don't exist  
ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS subject_expertise TEXT[],
ADD COLUMN IF NOT EXISTS experience_years INTEGER,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by_admin_id UUID;

-- Drop and recreate the problematic views
DROP VIEW IF EXISTS student_dashboard_data;
DROP VIEW IF EXISTS teacher_dashboard_data;

-- View for student dashboard data
CREATE OR REPLACE VIEW student_dashboard_data AS
SELECT 
  sp.id,
  sp.user_id,
  COALESCE(sp.enrollment_no, '') as enrollment_no,
  COALESCE(sp.class_level, sp.class) as class_level,
  COALESCE(sp.parent_email, '') as parent_email,
  COALESCE(sp.parent_phone, '') as parent_phone,
  CASE 
    WHEN sp.status IS NOT NULL THEN sp.status
    WHEN sp.approval_status IS NOT NULL THEN sp.approval_status::TEXT
    ELSE 'PENDING'
  END as status,
  COALESCE(sp.full_name, up.full_name, '') as full_name,
  COALESCE(up.email, '') as email,
  COUNT(sb.batch_id) as enrolled_batches_count,
  COUNT(ss.subject_id) as enrolled_subjects_count
FROM student_profiles sp
LEFT JOIN user_profiles up ON up.user_id = sp.user_id
LEFT JOIN student_batches sb ON sb.student_id = sp.id
LEFT JOIN student_subjects ss ON ss.student_id = sp.id
GROUP BY sp.id, sp.user_id, sp.enrollment_no, sp.class_level, sp.class,
         sp.parent_email, sp.parent_phone, sp.status, sp.approval_status,
         sp.full_name, up.full_name, up.email;

-- View for teacher dashboard data
CREATE OR REPLACE VIEW teacher_dashboard_data AS
SELECT 
  tp.id,
  tp.user_id,
  COALESCE(tp.employee_id, '') as employee_id,
  COALESCE(tp.full_name, up.full_name, '') as full_name,
  COALESCE(up.email, '') as email,
  COALESCE(tp.subject_expertise, ARRAY[]::TEXT[]) as subject_expertise,
  COALESCE(tp.experience_years, 0) as experience_years,
  COALESCE(tp.status, 'PENDING') as status,
  COUNT(DISTINCT sp.id) as pending_students_count
FROM teacher_profiles tp
LEFT JOIN user_profiles up ON up.user_id = tp.user_id
LEFT JOIN student_profiles sp ON sp.status = 'PENDING'
GROUP BY tp.id, tp.user_id, tp.employee_id, tp.full_name, up.full_name,
         up.email, tp.subject_expertise, tp.experience_years, tp.status;

COMMIT;
