-- ULTRA ADAPTIVE EXAM SYSTEM VIEW
-- This script thoroughly checks every column and only includes what exists

DO $$
DECLARE
    has_description BOOLEAN;
    has_subject_id BOOLEAN;
    has_subject BOOLEAN;
    has_topic_id BOOLEAN;
    has_class_level BOOLEAN;
    has_max_marks BOOLEAN;
    has_created_by BOOLEAN;
    has_created_at BOOLEAN;
    view_query TEXT;
    column_names TEXT;
BEGIN
    -- Get the list of actual column names in the exams table
    SELECT string_agg(column_name, ', ') 
    FROM information_schema.columns 
    WHERE table_name = 'exams' AND table_schema = 'public'
    INTO column_names;
    
    RAISE NOTICE 'Actual columns in exams table: %', column_names;
    
    -- Check each column individually
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'description'
        AND table_schema = 'public'
    ) INTO has_description;
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'subject_id'
        AND table_schema = 'public'
    ) INTO has_subject_id;
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'subject'
        AND table_schema = 'public'
    ) INTO has_subject;
    
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
        AND column_name = 'class_level'
        AND table_schema = 'public'
    ) INTO has_class_level;
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'max_marks'
        AND table_schema = 'public'
    ) INTO has_max_marks;
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'created_by'
        AND table_schema = 'public'
    ) INTO has_created_by;
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) INTO has_created_at;
    
    -- Log the results of the column checks
    RAISE NOTICE 'has_description: %, has_subject_id: %, has_subject: %, has_topic_id: %, has_class_level: %, has_max_marks: %, has_created_by: %, has_created_at: %', 
        has_description, has_subject_id, has_subject, has_topic_id, has_class_level, has_max_marks, has_created_by, has_created_at;
    
    -- Drop the view if it exists
    DROP VIEW IF EXISTS exam_summary_view;
    
    -- Start building the view query
    view_query := 'CREATE OR REPLACE VIEW exam_summary_view AS
    SELECT 
        e.id,
        e.title';
        
    -- Add description if it exists
    IF has_description THEN
        view_query := view_query || ',
        e.description';
    ELSE
        view_query := view_query || ',
        '''' AS description';
    END IF;
    
    -- Add subject_name based on what's available
    view_query := view_query || ',';
    IF has_subject_id AND has_subject THEN
        view_query := view_query || '
        CASE 
            WHEN e.subject_id IS NOT NULL AND s.name IS NOT NULL THEN s.name::TEXT
            WHEN e.subject IS NOT NULL THEN e.subject
            ELSE ''Other''
        END AS subject_name';
    ELSIF has_subject_id THEN
        view_query := view_query || '
        CASE 
            WHEN e.subject_id IS NOT NULL AND s.name IS NOT NULL THEN s.name::TEXT
            ELSE ''Other''
        END AS subject_name';
    ELSIF has_subject THEN
        view_query := view_query || '
        CASE
            WHEN e.subject IS NOT NULL THEN e.subject
            ELSE ''Other''
        END AS subject_name';
    ELSE
        view_query := view_query || '
        ''Other'' AS subject_name';
    END IF;
    
    -- Add topic_name
    view_query := view_query || ',
        ''General'' AS topic_name';
    
    -- Add remaining fields if they exist
    IF has_class_level THEN
        view_query := view_query || ',
        e.class_level';
    ELSE
        view_query := view_query || ',
        NULL AS class_level';
    END IF;
    
    IF has_max_marks THEN
        view_query := view_query || ',
        e.max_marks';
    ELSE
        view_query := view_query || ',
        NULL AS max_marks';
    END IF;
    
    IF has_created_by THEN
        view_query := view_query || ',
        e.created_by';
    ELSE
        view_query := view_query || ',
        NULL AS created_by';
    END IF;
    
    IF has_created_at THEN
        view_query := view_query || ',
        e.created_at';
    ELSE
        view_query := view_query || ',
        NOW() AS created_at';
    END IF;
    
    -- Add FROM clause
    view_query := view_query || '
    FROM 
        exams e';
    
    -- Add JOIN clauses if needed
    IF has_subject_id THEN
        view_query := view_query || '
    LEFT JOIN 
        subjects s ON e.subject_id = s.id';
    END IF;
    
    -- Close the query
    view_query := view_query || ';';
    
    -- Print the generated query for debugging
    RAISE NOTICE 'Generated view query: %', view_query;
    
    -- Execute the dynamically generated query
    EXECUTE view_query;
    
    RAISE NOTICE 'Created exam_summary_view with only columns that actually exist';
END $$;
