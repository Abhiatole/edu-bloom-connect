-- Check the structure of the student_insights table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'student_insights'
ORDER BY ordinal_position;
