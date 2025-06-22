-- FIX EXAMS TABLE STRUCTURE (TYPE-SAFE VERSION)
-- This script ensures the exams table has the necessary columns and creates a type-safe view

-- First part: Add required columns to the exams table
DO $$
BEGIN
    -- Check if the exams table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'exams'
        AND table_schema = 'public'
    ) THEN
        -- Add created_by column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exams' 
            AND column_name = 'created_by'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exams ADD COLUMN created_by UUID REFERENCES auth.users(id);
            CREATE INDEX idx_exams_created_by ON exams(created_by);
            UPDATE exams e
            SET created_by = (SELECT user_id FROM teacher_profiles LIMIT 1)
            WHERE e.created_by IS NULL;
            RAISE NOTICE 'Added created_by column to exams table';
        ELSE
            RAISE NOTICE 'created_by column already exists in exams table';
        END IF;
        
        -- Add subject column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exams' 
            AND column_name = 'subject'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exams ADD COLUMN subject TEXT;
            RAISE NOTICE 'Added subject column to exams table';
        END IF;
        
        -- Add description column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exams' 
            AND column_name = 'description'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exams ADD COLUMN description TEXT;
            RAISE NOTICE 'Added description column to exams table';
        END IF;
        
        -- Add subject_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exams' 
            AND column_name = 'subject_id'
            AND table_schema = 'public'
        ) THEN
            IF EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_name = 'subjects'
                AND table_schema = 'public'
            ) THEN
                ALTER TABLE exams ADD COLUMN subject_id UUID REFERENCES subjects(id);
                RAISE NOTICE 'Added subject_id column to exams table';
            ELSE
                ALTER TABLE exams ADD COLUMN subject_id UUID;
                RAISE NOTICE 'Added subject_id column (without FK) to exams table';
            END IF;
        END IF;
        
        -- Add topic_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exams' 
            AND column_name = 'topic_id'
            AND table_schema = 'public'
        ) THEN
            IF EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_name = 'topics'
                AND table_schema = 'public'
            ) THEN
                ALTER TABLE exams ADD COLUMN topic_id UUID REFERENCES topics(id);
                RAISE NOTICE 'Added topic_id column to exams table';
            ELSE
                ALTER TABLE exams ADD COLUMN topic_id UUID;
                RAISE NOTICE 'Added topic_id column (without FK) to exams table';
            END IF;
        END IF;
    ELSE
        RAISE NOTICE 'The exams table does not exist';
    END IF;
END $$;

-- Second part: Create a type-safe view for exam summary
DO $$
DECLARE
    valid_subjects text;
BEGIN
    -- Get a comma-separated list of valid enum values
    SELECT string_agg(quote_literal(enumlabel), ', ') 
    FROM pg_enum 
    WHERE enumtypid = 'subject_type'::regtype
    INTO valid_subjects;
    
    RAISE NOTICE 'Valid subject_type values: %', valid_subjects;
    
    -- Drop the view if it exists
    DROP VIEW IF EXISTS exam_summary_view;
      -- Create a custom function to safely convert text to subject_type
    EXECUTE 
    'CREATE OR REPLACE FUNCTION safe_to_subject_type(input_text TEXT) 
    RETURNS subject_type AS $func$
    BEGIN
        -- Try direct casting first (will work for exact matches)
        BEGIN
            RETURN input_text::subject_type;
        EXCEPTION WHEN OTHERS THEN
            -- Default to ''Other'' if conversion fails
            RETURN ''Other''::subject_type;
        END;
    END;
    $func$ LANGUAGE plpgsql IMMUTABLE;';
      -- Create the view with type-safe conversions
    EXECUTE 
    'CREATE OR REPLACE VIEW exam_summary_view AS
    SELECT 
        e.id,
        e.title,
        e.description,
        CASE 
            -- If we have a subject_id and it links to a subject with a name, use that
            WHEN e.subject_id IS NOT NULL AND s.name IS NOT NULL THEN 
                s.name
            -- Otherwise try to convert the text subject field to a subject_type
            ELSE
                safe_to_subject_type(COALESCE(e.subject, ''Other''))
        END AS subject_name,
        COALESCE(t.name, ''General'') AS topic_name,
        e.class_level,
        e.max_marks,
        e.created_by,
        e.created_at
    FROM 
        exams e
    LEFT JOIN 
        subjects s ON e.subject_id = s.id
    LEFT JOIN 
        topics t ON e.topic_id = t.id';
    
    RAISE NOTICE 'Created exam_summary_view with type-safe subject handling';
END $$;
