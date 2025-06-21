-- DATABASE_INSPECTION.sql
-- This script contains queries to inspect your database structure
-- Run these queries in Supabase SQL Editor to get the current schema details before making changes

-- 1. Check if the exam-related tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('subjects', 'topics', 'exams', 'exam_results')
ORDER BY table_name;

-- 2. Get column details for existing tables
-- Run these individually based on which tables exist from the first query

-- For subjects table
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'subjects'
ORDER BY ordinal_position;

-- For topics table
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'topics'
ORDER BY ordinal_position;

-- For exams table
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'exams'
ORDER BY ordinal_position;

-- For exam_results table
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'exam_results'
ORDER BY ordinal_position;

-- 3. Check existing constraints
SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition,
    rel.relname AS table_name
FROM 
    pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE 
    nsp.nspname = 'public'
    AND rel.relname IN ('subjects', 'topics', 'exams', 'exam_results')
ORDER BY 
    rel.relname, con.contype;

-- 4. Check existing RLS policies
SELECT 
    schemaname, tablename, policyname, 
    permissive, roles, cmd, qual
FROM 
    pg_policies
WHERE 
    schemaname = 'public' 
    AND tablename IN ('subjects', 'topics', 'exams', 'exam_results')
ORDER BY 
    tablename, policyname;

-- 5. Check existing views related to exams
SELECT 
    table_name, view_definition
FROM 
    information_schema.views
WHERE 
    table_schema = 'public'
    AND (table_name LIKE '%exam%' OR view_definition LIKE '%exam%')
ORDER BY 
    table_name;

-- 6. Check existing triggers on exam-related tables
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement, 
    action_timing,
    event_object_table
FROM 
    information_schema.triggers
WHERE 
    trigger_schema = 'public'
    AND event_object_table IN ('subjects', 'topics', 'exams', 'exam_results')
ORDER BY 
    event_object_table, trigger_name;

-- 7. Sample data inspection (limited to 5 rows per table)
-- Run these individually based on which tables exist

-- SELECT * FROM public.subjects LIMIT 5;
-- SELECT * FROM public.topics LIMIT 5;
-- SELECT * FROM public.exams LIMIT 5;
-- SELECT * FROM public.exam_results LIMIT 5;

-- 8. Check for duplicate records that could cause unique constraint violations
-- For exam_results table (check unique_exam_student potential constraint)
SELECT exam_id, student_id, COUNT(*) 
FROM public.exam_results 
GROUP BY exam_id, student_id 
HAVING COUNT(*) > 1;

-- 9. Verify auth.users references (if used in constraints)
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
) AS auth_users_exists;
