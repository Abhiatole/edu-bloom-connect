-- FIX EXAMS TABLE STRUCTURE (DIRECT TYPE HANDLING)
-- This script ensures the exams table has the necessary columns and creates a view with direct type handling

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

-- Create the exam summary view with direct type handling
DROP VIEW IF EXISTS exam_summary_view;

CREATE OR REPLACE VIEW exam_summary_view AS
SELECT 
    e.id,
    e.title,
    e.description,
    CASE 
        -- If we have a subject_id and it links to a subject with a name, use that
        WHEN e.subject_id IS NOT NULL AND s.name IS NOT NULL THEN 
            s.name
        -- Handle exact subject name matches directly
        WHEN e.subject = 'Physics' THEN 'Physics'::subject_type
        WHEN e.subject = 'Chemistry' THEN 'Chemistry'::subject_type
        WHEN e.subject = 'Mathematics' THEN 'Mathematics'::subject_type
        WHEN e.subject = 'Biology' THEN 'Biology'::subject_type
        WHEN e.subject = 'English' THEN 'English'::subject_type
        -- Default fallback
        ELSE 'Other'::subject_type
    END AS subject_name,
    COALESCE(t.name, 'General') AS topic_name,
    e.class_level,
    e.max_marks,
    e.created_by,
    e.created_at
FROM 
    exams e
LEFT JOIN 
    subjects s ON e.subject_id = s.id
LEFT JOIN 
    topics t ON e.topic_id = t.id;
