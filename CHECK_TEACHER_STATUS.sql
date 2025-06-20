-- Check teacher_profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if teacher_profiles has status column
SELECT 'Teacher Status Column Exists' as check_result, 
       CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END as status_column_exists
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
AND table_schema = 'public'
AND column_name = 'status';

-- Sample data from both tables to see current structure
SELECT 'Student Sample' as table_type, 
       id, user_id, full_name, status, approval_date, created_at
FROM student_profiles 
ORDER BY created_at DESC
LIMIT 3;

SELECT 'Teacher Sample' as table_type, 
       id, user_id, employee_id, status, approval_date, created_at
FROM teacher_profiles 
ORDER BY created_at DESC
LIMIT 3;
