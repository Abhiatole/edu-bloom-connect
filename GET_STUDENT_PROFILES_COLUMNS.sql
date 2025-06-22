-- Script to get columns for student_profiles specifically
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get a sample row to see the actual data
SELECT * FROM student_profiles LIMIT 1;
