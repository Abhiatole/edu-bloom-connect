-- CHECK_EXAMS_TABLE_STRUCTURE.sql
-- This script inspects the structure of the exams table

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
    AND table_name = 'exams'
ORDER BY 
    ordinal_position;
