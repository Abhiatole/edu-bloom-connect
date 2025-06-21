-- COMPREHENSIVE EXAM SYSTEM FIX
-- This script ensures all exam-related tables have consistent structure

-- Create subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create topics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.subjects(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure exams table exists with all needed columns
DO $$
BEGIN
    -- Check if exams table exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'exams'
        AND table_schema = 'public'
    ) THEN
        -- Create the exams table
        CREATE TABLE public.exams (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT,
            subject TEXT,
            subject_id UUID REFERENCES public.subjects(id),
            topic_id UUID REFERENCES public.topics(id),
            class_level TEXT,
            exam_type TEXT,
            max_marks INTEGER DEFAULT 100,
            created_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        RAISE NOTICE 'Created exams table with all required columns';
    ELSE
        -- Add any missing columns
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
        
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exams' 
            AND column_name = 'subject_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exams ADD COLUMN subject_id UUID REFERENCES public.subjects(id);
            RAISE NOTICE 'Added subject_id column to exams table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exams' 
            AND column_name = 'topic_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exams ADD COLUMN topic_id UUID REFERENCES public.topics(id);
            RAISE NOTICE 'Added topic_id column to exams table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exams' 
            AND column_name = 'created_by'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exams ADD COLUMN created_by UUID REFERENCES auth.users(id);
            RAISE NOTICE 'Added created_by column to exams table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exams' 
            AND column_name = 'max_marks'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exams ADD COLUMN max_marks INTEGER DEFAULT 100;
            RAISE NOTICE 'Added max_marks column to exams table';
        END IF;
    END IF;
END $$;

-- Ensure exam_results table exists with all needed columns
DO $$
BEGIN
    -- Check if exam_results table exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'exam_results'
        AND table_schema = 'public'
    ) THEN
        -- Create the exam_results table
        CREATE TABLE public.exam_results (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
            student_id UUID NOT NULL,
            examiner_id UUID REFERENCES auth.users(id),
            marks_obtained INTEGER,
            percentage DECIMAL(5,2),
            status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
            feedback TEXT,
            submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            CONSTRAINT valid_status_check CHECK (status IN ('PENDING', 'GRADING', 'GRADED', 'SUBMITTED'))
        );
        
        -- Add unique constraint but allow for error handling
        ALTER TABLE public.exam_results ADD CONSTRAINT unique_exam_student UNIQUE (exam_id, student_id);
        
        RAISE NOTICE 'Created exam_results table with all required columns';
    ELSE
        -- Add any missing columns
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exam_results' 
            AND column_name = 'examiner_id'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exam_results ADD COLUMN examiner_id UUID REFERENCES auth.users(id);
            RAISE NOTICE 'Added examiner_id column to exam_results table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exam_results' 
            AND column_name = 'status'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exam_results ADD COLUMN status VARCHAR(20) DEFAULT 'GRADED' NOT NULL;
            RAISE NOTICE 'Added status column to exam_results table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exam_results' 
            AND column_name = 'percentage'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exam_results ADD COLUMN percentage DECIMAL(5,2);
            RAISE NOTICE 'Added percentage column to exam_results table';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exam_results' 
            AND column_name = 'feedback'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE exam_results ADD COLUMN feedback TEXT;
            RAISE NOTICE 'Added feedback column to exam_results table';
        END IF;
        
        -- Check if marks_obtained is NOT NULL and modify it
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exam_results' 
            AND column_name = 'marks_obtained'
            AND table_schema = 'public'
            AND is_nullable = 'NO'
        ) THEN
            ALTER TABLE exam_results ALTER COLUMN marks_obtained DROP NOT NULL;
            RAISE NOTICE 'Modified marks_obtained to allow NULL values for pending results';
        END IF;
    END IF;
      -- Add constraint for status if not exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'valid_status_check'
        AND conrelid = 'public.exam_results'::regclass
    ) THEN
        BEGIN
            ALTER TABLE public.exam_results ADD CONSTRAINT valid_status_check 
                CHECK (status IN ('PENDING', 'GRADING', 'GRADED', 'SUBMITTED'));
            RAISE NOTICE 'Added status check constraint';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Status check constraint already exists';
        END;
    END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Create or replace views
DO $$
BEGIN
    -- Drop views if they exist
    DROP VIEW IF EXISTS exam_results_with_percentage;
    DROP VIEW IF EXISTS exam_summary_view;
    
    -- Create view for exam results with calculated percentage
    EXECUTE '
    CREATE OR REPLACE VIEW exam_results_with_percentage AS
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
        exams e ON er.exam_id = e.id';
    
    -- Create view for exam summary
    EXECUTE '
    CREATE OR REPLACE VIEW exam_summary_view AS
    SELECT 
        e.id,
        e.title,
        e.description,
        CASE 
            WHEN e.subject_id IS NOT NULL AND s.name IS NOT NULL THEN s.name
            ELSE COALESCE(e.subject, ''Unknown'')
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
    
    RAISE NOTICE 'Created or updated views';
END $$;

-- Create trigger for auto-calculating percentage
DO $$
BEGIN
    -- Create function
    EXECUTE '
    CREATE OR REPLACE FUNCTION update_exam_result_percentage()
    RETURNS TRIGGER AS $$
    DECLARE
        max_marks INTEGER;
    BEGIN
        -- Get the max marks from the exam
        SELECT e.max_marks INTO max_marks 
        FROM exams e 
        WHERE e.id = NEW.exam_id;
        
        -- Calculate percentage if marks_obtained is not null
        IF NEW.marks_obtained IS NOT NULL AND max_marks > 0 THEN
            NEW.percentage := ROUND((NEW.marks_obtained::numeric / max_marks::numeric) * 100, 2);
            
            -- Auto-update status to GRADED if it was PENDING/GRADING
            IF NEW.status IN (''PENDING'', ''GRADING'') THEN
                NEW.status := ''GRADED'';
            END IF;
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql';

    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS exam_result_percentage_trigger ON exam_results;
    
    -- Create the trigger
    CREATE TRIGGER exam_result_percentage_trigger
    BEFORE INSERT OR UPDATE OF marks_obtained
    ON exam_results
    FOR EACH ROW
    EXECUTE FUNCTION update_exam_result_percentage();
    
    RAISE NOTICE 'Created trigger for auto-calculation';
END $$;

-- Add basic policies if they don't exist
DO $$
BEGIN
    -- Check if policies exist and create them if they don't
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subjects' AND policyname = 'Allow read access to subjects') THEN
        CREATE POLICY "Allow read access to subjects" ON public.subjects
            FOR SELECT USING (true);
        RAISE NOTICE 'Created read policy for subjects';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'topics' AND policyname = 'Allow read access to topics') THEN
        CREATE POLICY "Allow read access to topics" ON public.topics
            FOR SELECT USING (true);
        RAISE NOTICE 'Created read policy for topics';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exams' AND policyname = 'Allow read access to exams') THEN
        CREATE POLICY "Allow read access to exams" ON public.exams
            FOR SELECT USING (true);
        RAISE NOTICE 'Created read policy for exams';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exam_results' AND policyname = 'Allow read access to exam_results') THEN
        CREATE POLICY "Allow read access to exam_results" ON public.exam_results
            FOR SELECT USING (true);
        RAISE NOTICE 'Created read policy for exam_results';
    END IF;
END $$;

-- Add some sample data if the tables are empty
DO $$
BEGIN
    -- Add sample subjects if none exist
    IF NOT EXISTS (SELECT 1 FROM public.subjects LIMIT 1) THEN
        BEGIN
            INSERT INTO public.subjects (name, description)
            VALUES 
            ('Mathematics', 'Core mathematics curriculum'),
            ('Science', 'General science topics'),
            ('English', 'Language and literature'),
            ('History', 'World and regional history')
            ON CONFLICT (name) DO NOTHING;
            
            RAISE NOTICE 'Added sample subjects';
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Error adding sample subjects: %', SQLERRM;
        END;
    END IF;
    
    -- Add sample topics if none exist
    IF NOT EXISTS (SELECT 1 FROM public.topics LIMIT 1) THEN
        BEGIN
            INSERT INTO public.topics (name, description, subject_id)
            SELECT 
                'Introduction to ' || s.name, 
                'Foundational concepts in ' || s.name, 
                s.id
            FROM public.subjects s
            WHERE s.name IN ('Mathematics', 'Science', 'English', 'History')
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Added sample topics';
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Error adding sample topics: %', SQLERRM;
        END;
    END IF;
    
    -- Add sample exams if none exist
    IF NOT EXISTS (SELECT 1 FROM public.exams LIMIT 1) THEN
        BEGIN
            INSERT INTO public.exams (title, description, subject_id, max_marks)
            SELECT 
                'Basic ' || s.name || ' Exam',
                'Foundational assessment for ' || s.name,
                s.id,
                100
            FROM public.subjects s
            WHERE s.name IN ('Mathematics', 'Science')
            LIMIT 2
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Added sample exams';
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Error adding sample exams: %', SQLERRM;
        END;
    END IF;
END $$;
