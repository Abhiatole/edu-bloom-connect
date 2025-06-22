-- BASIC EXAM SYSTEM SETUP
-- This script sets up a minimal exam system with required types and tables

-- First check if subject_type exists and create it if not
DO $$
BEGIN
    -- Check if subject_type enum exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'subject_type'
    ) THEN
        -- Create the enum type if it doesn't exist
        CREATE TYPE subject_type AS ENUM ('Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other');
        RAISE NOTICE 'Created subject_type enum';
    ELSE
        RAISE NOTICE 'subject_type enum already exists';
    END IF;
    
    -- Check if exam_type enum exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'exam_type'
    ) THEN
        -- Create the enum type if it doesn't exist
        CREATE TYPE exam_type AS ENUM ('JEE', 'NEET', 'CET', 'Boards');
        RAISE NOTICE 'Created exam_type enum';
    ELSE
        RAISE NOTICE 'exam_type enum already exists';
    END IF;
    
    -- Check if approval_status enum exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'approval_status'
    ) THEN
        -- Create the enum type if it doesn't exist
        CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
        RAISE NOTICE 'Created approval_status enum';
    ELSE
        RAISE NOTICE 'approval_status enum already exists';
    END IF;
END $$;

-- Check if subjects table exists and create if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'subjects'
        AND table_schema = 'public'
    ) THEN
        -- Create the subjects table
        CREATE TABLE subjects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name subject_type NOT NULL,
            class_level INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        RAISE NOTICE 'Created subjects table';
    ELSE
        RAISE NOTICE 'subjects table already exists';
    END IF;
    
    -- Check if topics table exists and create if needed
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'topics'
        AND table_schema = 'public'
    ) THEN
        -- Create the topics table
        CREATE TABLE topics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            subject_id UUID,
            name VARCHAR(100) NOT NULL,
            chapter_number INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Add foreign key if subjects table exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = 'subjects'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE topics ADD CONSTRAINT topics_subject_id_fkey 
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
        END IF;
        
        RAISE NOTICE 'Created topics table';
    ELSE
        RAISE NOTICE 'topics table already exists';
    END IF;
    
    -- Check if exams table exists and create if needed
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'exams'
        AND table_schema = 'public'
    ) THEN
        -- Create the exams table
        CREATE TABLE exams (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(200) NOT NULL,
            description TEXT,
            subject TEXT,
            subject_id UUID,
            topic_id UUID,
            class_level INTEGER,
            max_marks INTEGER,
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        -- Add foreign keys if other tables exist
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = 'subjects'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exams ADD CONSTRAINT exams_subject_id_fkey 
            FOREIGN KEY (subject_id) REFERENCES subjects(id);
        END IF;
        
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = 'topics'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exams ADD CONSTRAINT exams_topic_id_fkey 
            FOREIGN KEY (topic_id) REFERENCES topics(id);
        END IF;
        
        RAISE NOTICE 'Created exams table';
    ELSE
        RAISE NOTICE 'exams table already exists';
    END IF;
END $$;

-- Create the view (text-based version without enum dependencies)
DO $$
BEGIN
    -- Drop the view if it exists
    DROP VIEW IF EXISTS exam_summary_view;
    
    -- Create a text-based view that doesn't rely on enum types
    CREATE OR REPLACE VIEW exam_summary_view AS
    SELECT 
        e.id,
        e.title,
        e.description,
        -- Use a text-based approach to avoid enum type issues
        CASE 
            -- If we have a subject_id and the subject name is available, use it
            WHEN e.subject_id IS NOT NULL AND s.name IS NOT NULL THEN 
                s.name::TEXT -- Convert to TEXT to avoid type issues
            -- Handle exact subject name matches directly
            WHEN e.subject = 'Physics' THEN 'Physics'
            WHEN e.subject = 'Chemistry' THEN 'Chemistry'
            WHEN e.subject = 'Mathematics' THEN 'Mathematics'
            WHEN e.subject = 'Biology' THEN 'Biology'
            WHEN e.subject = 'English' THEN 'English'
            -- Default fallback
            ELSE 'Other'
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
    
    RAISE NOTICE 'Created exam_summary_view with text-based subject handling';
END $$;
