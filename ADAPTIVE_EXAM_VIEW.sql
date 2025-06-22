-- ADAPTIVE EXAM SYSTEM VIEW
-- This script adapts to the actual database structure and creates a compatible view

-- Create a dynamic view based on existing columns
DO $$
DECLARE
    has_topic_id BOOLEAN;
    has_subject_id BOOLEAN;
    has_subject BOOLEAN;
    has_class_level BOOLEAN;
    has_max_marks BOOLEAN;
    has_created_by BOOLEAN;
    view_query TEXT;
BEGIN
    -- Check what columns exist in the exams table
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
    
    -- Drop the view if it exists
    DROP VIEW IF EXISTS exam_summary_view;
    
    -- Start building the view query
    view_query := 'CREATE OR REPLACE VIEW exam_summary_view AS
    SELECT 
        e.id,
        e.title,
        COALESCE(e.description, '''') AS description,';
        
    -- Build the subject_name part based on what's available
    IF has_subject_id AND has_subject THEN
        view_query := view_query || '
        CASE 
            WHEN e.subject_id IS NOT NULL AND s.name IS NOT NULL THEN s.name::TEXT
            WHEN e.subject IS NOT NULL THEN e.subject
            ELSE ''Other''
        END AS subject_name,';
    ELSIF has_subject_id THEN
        view_query := view_query || '
        CASE 
            WHEN e.subject_id IS NOT NULL AND s.name IS NOT NULL THEN s.name::TEXT
            ELSE ''Other''
        END AS subject_name,';
    ELSIF has_subject THEN
        view_query := view_query || '
        COALESCE(e.subject, ''Other'') AS subject_name,';
    ELSE
        view_query := view_query || '
        ''Unknown'' AS subject_name,';
    END IF;
    
    -- Add topic_name based on what's available
    IF has_topic_id THEN
        view_query := view_query || '
        COALESCE(t.name, ''General'') AS topic_name,';
    ELSE
        view_query := view_query || '
        ''General'' AS topic_name,';
    END IF;
    
    -- Add optional columns if they exist
    IF has_class_level THEN
        view_query := view_query || '
        e.class_level,';
    ELSE
        view_query := view_query || '
        NULL AS class_level,';
    END IF;
    
    IF has_max_marks THEN
        view_query := view_query || '
        e.max_marks,';
    ELSE
        view_query := view_query || '
        NULL AS max_marks,';
    END IF;
    
    IF has_created_by THEN
        view_query := view_query || '
        e.created_by,';
    ELSE
        view_query := view_query || '
        NULL AS created_by,';
    END IF;
    
    -- Add created_at (assuming this always exists)
    view_query := view_query || '
        e.created_at';
    
    -- Add FROM and JOINs based on what's available
    view_query := view_query || '
    FROM 
        exams e';
    
    IF has_subject_id THEN
        view_query := view_query || '
    LEFT JOIN 
        subjects s ON e.subject_id = s.id';
    END IF;
    
    IF has_topic_id THEN
        view_query := view_query || '
    LEFT JOIN 
        topics t ON e.topic_id = t.id';
    END IF;
    
    -- Close the query
    view_query := view_query || ';';
    
    -- Print the generated query for debugging
    RAISE NOTICE 'Generated view query: %', view_query;
    
    -- Execute the dynamically generated query
    EXECUTE view_query;
    
    RAISE NOTICE 'Created exam_summary_view adapted to the actual database structure';
END $$;
