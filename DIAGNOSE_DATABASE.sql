-- DATABASE DIAGNOSIS SCRIPT
-- Run this in Supabase SQL Editor to see the actual database structure

-- Check what columns exist in student_profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'student_profiles' 
ORDER BY ordinal_position;

-- Check what columns exist in teacher_profiles  
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
ORDER BY ordinal_position;

-- Check if approval_logs table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'approval_logs'
) as approval_logs_exists;

-- Check if user_profiles view exists
SELECT EXISTS (
   SELECT FROM information_schema.views 
   WHERE table_name = 'user_profiles'
) as user_profiles_view_exists;

-- Show sample data from student_profiles (first 3 rows)
SELECT * FROM student_profiles LIMIT 3;

-- Show sample data from teacher_profiles (first 3 rows)
SELECT * FROM teacher_profiles LIMIT 3;

-- Show current approval statuses if status column exists
SELECT 'student' as type, status, COUNT(*) as count 
FROM student_profiles 
WHERE status IS NOT NULL
GROUP BY status
UNION ALL
SELECT 'teacher' as type, status, COUNT(*) as count 
FROM teacher_profiles 
WHERE status IS NOT NULL
GROUP BY status;
