-- DIAGNOSE TEACHER_PROFILES TABLE STRUCTURE
-- Run this to see what columns actually exist in teacher_profiles table

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show a sample row to see actual data structure
SELECT * FROM teacher_profiles LIMIT 1;

-- Count rows
SELECT COUNT(*) as total_teacher_profiles FROM teacher_profiles;
