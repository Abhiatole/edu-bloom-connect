-- Check current status of the database implementation
-- This will help us understand what needs to be fixed

-- 1. Check if status columns exist
SELECT 'STUDENT_PROFILES COLUMNS' as check_type, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'student_profiles' 
AND table_schema = 'public'
AND column_name LIKE '%status%'
ORDER BY ordinal_position;

SELECT 'TEACHER_PROFILES COLUMNS' as check_type, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
AND table_schema = 'public'
AND column_name LIKE '%status%'
ORDER BY ordinal_position;

-- 2. Check if user_status enum exists
SELECT 'USER_STATUS_ENUM' as check_type, typname, typtype
FROM pg_type 
WHERE typname = 'user_status';

-- 3. Check current status values in tables
SELECT 'STUDENT_STATUS_DISTRIBUTION' as check_type, 
       status, 
       COUNT(*) as count,
       MIN(created_at) as first_registration,
       MAX(created_at) as last_registration
FROM student_profiles
GROUP BY status
ORDER BY count DESC;

SELECT 'TEACHER_STATUS_DISTRIBUTION' as check_type, 
       status, 
       COUNT(*) as count,
       MIN(created_at) as first_registration,
       MAX(created_at) as last_registration
FROM teacher_profiles
GROUP BY status
ORDER BY count DESC;

-- 4. Check for any records with null status
SELECT 'STUDENTS_NULL_STATUS' as check_type, COUNT(*) as null_status_count
FROM student_profiles 
WHERE status IS NULL;

SELECT 'TEACHERS_NULL_STATUS' as check_type, COUNT(*) as null_status_count
FROM teacher_profiles 
WHERE status IS NULL;

-- 5. Check triggers
SELECT 'TRIGGERS' as check_type, trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%status%'
ORDER BY event_object_table;

-- 6. Check functions
SELECT 'FUNCTIONS' as check_type, routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%status%' 
AND routine_schema = 'public';

-- 7. Sample data to verify structure
SELECT 'SAMPLE_STUDENT' as check_type, 
       id, user_id, status, approval_date, rejected_at, created_at
FROM student_profiles 
ORDER BY created_at DESC
LIMIT 3;

SELECT 'SAMPLE_TEACHER' as check_type, 
       id, user_id, status, approval_date, rejected_at, created_at
FROM teacher_profiles 
ORDER BY created_at DESC
LIMIT 3;
