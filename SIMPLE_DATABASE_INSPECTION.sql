-- SIMPLE_DATABASE_INSPECTION.sql
-- This script contains simplified queries to inspect your database structure
-- Run these queries in Supabase SQL Editor to get the current schema details

-- 1. Check if the exam-related tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('subjects', 'topics', 'exams', 'exam_results')
ORDER BY table_name;

-- 2. Get column details for subjects table (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'subjects'
ORDER BY ordinal_position;

-- 3. Get column details for topics table (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'topics'
ORDER BY ordinal_position;

-- 4. Get column details for exams table (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'exams'
ORDER BY ordinal_position;

-- 5. Get column details for exam_results table (if it exists)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'exam_results'
ORDER BY ordinal_position;

-- 6. Check existing constraints (simple version)
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE 
    tc.table_schema = 'public'
    AND tc.table_name IN ('subjects', 'topics', 'exams', 'exam_results')
ORDER BY 
    tc.table_name, tc.constraint_type;

-- 7. Check existing RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname
FROM 
    pg_policies
WHERE 
    schemaname = 'public' 
    AND tablename IN ('subjects', 'topics', 'exams', 'exam_results')
ORDER BY 
    tablename, policyname;

-- 8. Check existing views related to exams
SELECT 
    table_name
FROM 
    information_schema.views
WHERE 
    table_schema = 'public'
    AND table_name LIKE '%exam%'
ORDER BY 
    table_name;

-- 9. Check existing triggers (simplified)
SELECT 
    trigger_name, 
    event_object_table
FROM 
    information_schema.triggers
WHERE 
    trigger_schema = 'public'
    AND event_object_table IN ('subjects', 'topics', 'exams', 'exam_results')
ORDER BY 
    event_object_table, trigger_name;

-- 10. Check for duplicate records that could cause unique constraint violations
-- (Only run this if exam_results table exists)
-- SELECT exam_id, student_id, COUNT(*) 
-- FROM public.exam_results 
-- GROUP BY exam_id, student_id 
-- HAVING COUNT(*) > 1;

-- 11. Sample data inspection (limited to 3 rows per table)
-- (Uncomment and run queries individually based on which tables exist)

-- SELECT * FROM public.subjects LIMIT 3;
-- SELECT * FROM public.topics LIMIT 3;
-- SELECT * FROM public.exams LIMIT 3;
-- SELECT * FROM public.exam_results LIMIT 3;
