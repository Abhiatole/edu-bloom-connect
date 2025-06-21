-- EXAM VIEWS
-- This script creates the views for exam results and summary

-- Create the view for exam results with percentage
DROP VIEW IF EXISTS exam_results_with_percentage;

CREATE VIEW exam_results_with_percentage AS
SELECT 
    er.*,
    CASE 
        WHEN er.percentage IS NOT NULL THEN er.percentage
        WHEN e.max_marks > 0 AND er.marks_obtained IS NOT NULL THEN 
            ROUND((er.marks_obtained::numeric / e.max_marks::numeric) * 100, 2)
        ELSE 
            NULL
    END AS calculated_percentage
FROM 
    exam_results er
JOIN 
    exams e ON er.exam_id = e.id;

-- Create the view for exam summary
DROP VIEW IF EXISTS exam_summary_view;

-- Use dynamic SQL to create the view safely
DO $$
DECLARE
    has_topic_id BOOLEAN;
    has_subject_id BOOLEAN;
    view_sql TEXT;
BEGIN
    -- Check if required columns exist
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'topic_id'
        AND table_schema = 'public'
    ) INTO has_topic_id;
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'subject_id'
        AND table_schema = 'public'
    ) INTO has_subject_id;
    
    -- Start building the SQL for the view
    view_sql := 'CREATE VIEW exam_summary_view AS SELECT e.id, e.title, e.description, ';
    
    -- Add the subject name expression
    IF has_subject_id THEN
        view_sql := view_sql || 'CASE WHEN e.subject_id IS NOT NULL AND s.name IS NOT NULL THEN s.name ELSE COALESCE(e.subject, ''Unknown'') END AS subject_name, ';
    ELSE
        view_sql := view_sql || 'COALESCE(e.subject, ''Unknown'') AS subject_name, ';
    END IF;
    
    -- Add the topic name expression
    IF has_topic_id THEN
        view_sql := view_sql || 'COALESCE(t.name, ''General'') AS topic_name, ';
    ELSE
        view_sql := view_sql || '''General'' AS topic_name, ';
    END IF;
    
    -- Add the remaining fields
    view_sql := view_sql || 'e.class_level, e.max_marks, e.created_by, e.created_at FROM exams e ';
    
    -- Add the joins if needed
    IF has_subject_id THEN
        view_sql := view_sql || 'LEFT JOIN subjects s ON e.subject_id = s.id ';
    END IF;
    
    IF has_topic_id THEN
        view_sql := view_sql || 'LEFT JOIN topics t ON e.topic_id = t.id';
    END IF;
    
    -- Execute the constructed SQL
    EXECUTE view_sql;
    
    RAISE NOTICE 'Created exam_summary_view with appropriate joins';
END $$;
