-- SIMPLIFIED EXAM SYSTEM FIX
-- This script fixes exam-related tables in smaller, safer steps

-- Step 1: Create basic tables if they don't exist
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.subjects(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    subject_id UUID REFERENCES public.subjects(id),
    topic_id UUID REFERENCES public.topics(id),
    class_level TEXT,
    exam_type TEXT,
    max_marks INTEGER DEFAULT 100,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    examiner_id UUID,
    marks_obtained INTEGER,
    percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'PENDING',
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Add constraints if not already present
-- Use DO block to safely add constraint
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'valid_status_check'
        AND conrelid = 'public.exam_results'::regclass
    ) THEN
        BEGIN
            ALTER TABLE public.exam_results 
                ADD CONSTRAINT valid_status_check 
                CHECK (status IN ('PENDING', 'GRADING', 'GRADED', 'SUBMITTED'));
            RAISE NOTICE 'Added status check constraint';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Status check constraint already exists';
        END;
    END IF;
END $$;

-- Try to add unique constraint but ignore if it fails (might already exist)
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'unique_exam_student'
        AND conrelid = 'public.exam_results'::regclass
    ) THEN
        BEGIN
            ALTER TABLE public.exam_results 
                ADD CONSTRAINT unique_exam_student 
                UNIQUE (exam_id, student_id);
            RAISE NOTICE 'Added unique constraint for exam_id and student_id';
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists
            RAISE NOTICE 'Unique constraint already exists';
        WHEN others THEN
            -- Other error, such as duplicate data would violate constraint
            RAISE NOTICE 'Could not create unique constraint: %', SQLERRM;
        END;
    END IF;
END $$;

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies (these will fail silently if they already exist)
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow read access to subjects" ON public.subjects
            FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists
    END;
    
    BEGIN
        CREATE POLICY "Allow read access to topics" ON public.topics
            FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists
    END;
    
    BEGIN
        CREATE POLICY "Allow read access to exams" ON public.exams
            FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists
    END;
    
    BEGIN
        CREATE POLICY "Allow read access to exam_results" ON public.exam_results
            FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists
    END;
END $$;

-- Step 5: Create function for percentage calculation
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
        IF NEW.status IN ('PENDING', 'GRADING') THEN
            NEW.status := 'GRADED';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS exam_result_percentage_trigger ON exam_results;

CREATE TRIGGER exam_result_percentage_trigger
BEFORE INSERT OR UPDATE OF marks_obtained
ON exam_results
FOR EACH ROW
EXECUTE FUNCTION update_exam_result_percentage();

-- Step 7: Create views (drop first if exists)
DROP VIEW IF EXISTS exam_results_with_percentage;

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
    exams e ON er.exam_id = e.id;

-- Step 8: Create view for exam summary (more resilient)
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
    
    -- Drop the view if it exists
    DROP VIEW IF EXISTS exam_summary_view;
    
    -- Start building the SQL for the view
    view_sql := 'CREATE OR REPLACE VIEW exam_summary_view AS SELECT e.id, e.title, e.description, ';
    
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

-- Step 9: Add sample data if the tables are empty
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
