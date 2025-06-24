-- SQL to check the column names in the student_profiles table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND 
  table_name = 'student_profiles'
ORDER BY 
  ordinal_position;
