-- BASIC_TABLE_INSPECTION.sql
-- This script checks for table existence and basic structure

-- Table existence check (this is guaranteed to work in any PostgreSQL version)
SELECT EXISTS(
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subjects'
) AS subjects_exists;

SELECT EXISTS(
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'topics'
) AS topics_exists;

SELECT EXISTS(
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exams'
) AS exams_exists;

SELECT EXISTS(
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exam_results'
) AS exam_results_exists;

-- Column existence check for key columns
-- For exams table
SELECT EXISTS(
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exams' 
    AND column_name = 'subject_id'
) AS exams_has_subject_id;

SELECT EXISTS(
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exams' 
    AND column_name = 'topic_id'
) AS exams_has_topic_id;

-- For exam_results table
SELECT EXISTS(
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exam_results' 
    AND column_name = 'status'
) AS exam_results_has_status;

SELECT EXISTS(
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exam_results' 
    AND column_name = 'percentage'
) AS exam_results_has_percentage;

-- Check constraint existence using pg_constraint
-- This requires concatenation of the constraint name but is safer than more complex queries
SELECT 
    'valid_status_check' AS constraint_name,
    EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'valid_status_check'
    ) AS constraint_exists;

SELECT 
    'unique_exam_student' AS constraint_name,
    EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'unique_exam_student'
    ) AS constraint_exists;

-- Basic RLS policy check 
SELECT 
    tablename, 
    COUNT(policyname) AS policy_count
FROM 
    pg_policies
WHERE 
    schemaname = 'public' 
    AND tablename IN ('subjects', 'topics', 'exams', 'exam_results')
GROUP BY 
    tablename;
