-- Get all tables in the current schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

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

-- Check the structure of the subjects table (if exists)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subjects'
) AS subjects_table_exists;

-- Check the structure of the topics table (if exists)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'topics'
) AS topics_table_exists;

-- Check what columns are in student_profiles
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'student_profiles' 
AND table_schema = 'public';

-- Check what columns are in the exam_results table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'exam_results' 
AND table_schema = 'public';

-- Check what columns are in the exams table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'exams' 
AND table_schema = 'public';

-- Sample content from student_profiles for field structure analysis
SELECT * FROM student_profiles LIMIT 2;

-- Get exact data types of relevant columns
SELECT 
    table_name, 
    column_name, 
    data_type, 
    udt_name
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' AND 
    table_name IN ('subjects', 'exams') AND
    column_name IN ('name', 'subject', 'subject_id');

-- Check for enum definition
SELECT 
    pg_type.typname AS enum_type,
    pg_enum.enumlabel AS enum_value
FROM 
    pg_type 
    JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
WHERE 
    pg_type.typname = 'subject_type'
ORDER BY 
    pg_enum.enumsortorder;
