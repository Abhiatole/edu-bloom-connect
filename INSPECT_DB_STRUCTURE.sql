-- INSPECT DATABASE STRUCTURE
-- This script checks the database structure to help diagnose issues

-- 1. Check which tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check enum types
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM 
    pg_type t
JOIN 
    pg_enum e ON t.oid = e.enumtypid
ORDER BY 
    t.typname, e.enumsortorder;

-- 3. Check exams table structure
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'exams' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- 4. Check subjects table structure (if it exists)
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'subjects' 
    AND table_schema = 'public'
ORDER BY 
    ordinal_position;

-- 5. Sample data from exams
SELECT * FROM exams LIMIT 5;

-- 6. Sample data from subjects
SELECT * FROM subjects LIMIT 5;
