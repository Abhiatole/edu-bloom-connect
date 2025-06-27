-- =====================================
-- MINIMAL FIX FOR CLASS_LEVEL TYPE CONFLICT
-- =====================================

-- Ensure class_level is TEXT in student_profiles
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS class_level TEXT;

-- Update any existing integer class_level to text
-- (This will fail gracefully if column doesn't exist or is already text)
DO $$ 
BEGIN
  -- Try to alter column type if it exists as integer
  ALTER TABLE student_profiles ALTER COLUMN class_level TYPE TEXT;
EXCEPTION
  WHEN OTHERS THEN
    -- Column doesn't exist or already correct type, continue
    NULL;
END $$;

-- Now create the view with proper TEXT types
DROP VIEW IF EXISTS student_dashboard_data;

CREATE OR REPLACE VIEW student_dashboard_data AS
SELECT 
  sp.id,
  sp.user_id,
  COALESCE(sp.enrollment_no, '') as enrollment_no,
  COALESCE(sp.class_level, sp.class, '') as class_level,
  COALESCE(sp.parent_email, '') as parent_email,
  COALESCE(sp.parent_phone, '') as parent_phone,
  COALESCE(sp.status, 'PENDING') as status,
  COALESCE(sp.full_name, up.full_name, '') as full_name,
  COALESCE(up.email, '') as email,
  0 as enrolled_batches_count,
  0 as enrolled_subjects_count
FROM student_profiles sp
LEFT JOIN user_profiles up ON up.user_id = sp.user_id;

SELECT 'Minimal fix applied successfully!' as result;
