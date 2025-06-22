-- CHECK_TEACHER_PROFILES_STRUCTURE.sql
-- This script inspects the structure of the teacher_profiles table

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'teacher_profiles'
ORDER BY 
    ordinal_position;
