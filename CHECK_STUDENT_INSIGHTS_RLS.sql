-- Check the structure of student_insights table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_insights' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if RLS is enabled on this table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'student_insights'
AND schemaname = 'public';

-- Check existing RLS policies on student_insights table
SELECT * FROM pg_policies 
WHERE tablename = 'student_insights'
AND schemaname = 'public';

-- Check sample data
SELECT * FROM student_insights LIMIT 5;
