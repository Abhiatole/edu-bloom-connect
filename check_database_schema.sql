-- Database Schema Check for Enhanced Teacher Dashboard
-- Run this query to check if your database has all required columns

-- Check exams table structure
SELECT 
    'exams' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'exams'
ORDER BY ordinal_position;

-- Check exam_results table structure
SELECT 
    'exam_results' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'exam_results'
ORDER BY ordinal_position;

-- Check parent_notifications table structure
SELECT 
    'parent_notifications' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'parent_notifications'
ORDER BY ordinal_position;

-- Check if required columns exist
SELECT 
    'Required Column Check' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exams' 
            AND column_name = 'status'
        ) THEN '✅ exams.status exists'
        ELSE '❌ exams.status missing - run migration'
    END as status_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exams' 
            AND (column_name = 'max_marks' OR column_name = 'total_marks')
        ) THEN '✅ exams.max_marks/total_marks exists'
        ELSE '❌ exams.max_marks missing - run migration'
    END as marks_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results'
        ) THEN '✅ exam_results table exists'
        ELSE '❌ exam_results table missing - run migration'
    END as exam_results_table,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'parent_notifications'
        ) THEN '✅ parent_notifications table exists'
        ELSE '❌ parent_notifications table missing - run migration'
    END as notifications_table;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('exams', 'exam_results', 'parent_notifications');

-- Sample data check
SELECT 
    'Sample Data' as check_type,
    (SELECT COUNT(*) FROM public.exams) as exam_count,
    (SELECT COUNT(*) FROM public.exam_results) as results_count,
    (SELECT COUNT(*) FROM public.parent_notifications) as notifications_count;
