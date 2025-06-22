-- Check the structure of student_profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'student_profiles'
) AS table_exists;

-- Check what columns are in teacher_profiles for comparison
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check specific table content samples to see actual field names
SELECT * FROM student_profiles LIMIT 5;

-- Check subjects table to verify its fields
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'subjects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check topics table to verify its fields
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'topics' 
AND table_schema = 'public'
ORDER BY ordinal_position;
