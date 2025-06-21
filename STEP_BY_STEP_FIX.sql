-- STEP_BY_STEP_FIX.sql
-- Run each section separately for maximum safety

-- Section 1: Create basic tables if they don't exist
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

-- Section 2: Add status check constraint (run separately)
DO $$
BEGIN
    BEGIN
        -- Try to add the constraint directly
        ALTER TABLE public.exam_results 
            ADD CONSTRAINT valid_status_check 
            CHECK (status IN ('PENDING', 'GRADING', 'GRADED', 'SUBMITTED'));
        
        RAISE NOTICE 'Added status check constraint';
    EXCEPTION 
        WHEN duplicate_object THEN
            RAISE NOTICE 'Status check constraint already exists';
        WHEN others THEN
            RAISE NOTICE 'Error adding status check constraint: %', SQLERRM;
    END;
END $$;

-- Section 3: Add unique constraint (run separately)
DO $$
BEGIN
    BEGIN
        -- Try to add the unique constraint directly
        ALTER TABLE public.exam_results 
            ADD CONSTRAINT unique_exam_student 
            UNIQUE (exam_id, student_id);
        
        RAISE NOTICE 'Added unique constraint for exam_id and student_id';
    EXCEPTION 
        WHEN duplicate_object THEN
            RAISE NOTICE 'Unique constraint already exists';
        WHEN others THEN
            RAISE NOTICE 'Error adding unique constraint: %', SQLERRM;
    END;
END $$;

-- Section 4: Enable RLS (run separately)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Section 5: Create basic policies (run separately)
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow read access to subjects" ON public.subjects
            FOR SELECT USING (true);
        RAISE NOTICE 'Created read policy for subjects';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Subjects policy already exists';
    END;
END $$;

DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow read access to topics" ON public.topics
            FOR SELECT USING (true);
        RAISE NOTICE 'Created read policy for topics';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Topics policy already exists';
    END;
END $$;

DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow read access to exams" ON public.exams
            FOR SELECT USING (true);
        RAISE NOTICE 'Created read policy for exams';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Exams policy already exists';
    END;
END $$;

DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow read access to exam_results" ON public.exam_results
            FOR SELECT USING (true);
        RAISE NOTICE 'Created read policy for exam_results';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Exam results policy already exists';
    END;
END $$;

-- Section 6: Create function for percentage calculation (run separately)
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

-- Section 7: Create trigger (run separately)
DO $$
BEGIN
    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS exam_result_percentage_trigger ON exam_results;
    
    -- Create the trigger
    CREATE TRIGGER exam_result_percentage_trigger
    BEFORE INSERT OR UPDATE OF marks_obtained
    ON exam_results
    FOR EACH ROW
    EXECUTE FUNCTION update_exam_result_percentage();
    
    RAISE NOTICE 'Created trigger for percentage calculation';
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error creating trigger: %', SQLERRM;
END $$;

-- Section 8: Create first view (run separately)
DO $$
BEGIN
    -- Drop view if it exists
    DROP VIEW IF EXISTS exam_results_with_percentage;
    
    -- Create the view
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
    
    RAISE NOTICE 'Created exam_results_with_percentage view';
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error creating view: %', SQLERRM;
END $$;

-- Section 9: Create second view (run separately)
DO $$
DECLARE
    view_sql TEXT;
BEGIN
    -- Drop view if it exists
    DROP VIEW IF EXISTS exam_summary_view;
    
    -- Create a simpler view version to avoid errors
    view_sql := 'CREATE OR REPLACE VIEW exam_summary_view AS 
    SELECT 
        e.id, 
        e.title, 
        e.description, 
        COALESCE(s.name, e.subject, ''Unknown'') AS subject_name,
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
    
    -- Execute the SQL
    EXECUTE view_sql;
    
    RAISE NOTICE 'Created exam_summary_view';
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error creating summary view: %', SQLERRM;
END $$;

-- Section 10: Add sample data (run separately)
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
    ELSE
        RAISE NOTICE 'Subjects table already has data';
    END IF;
END $$;

DO $$
BEGIN
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
    ELSE
        RAISE NOTICE 'Topics table already has data';
    END IF;
END $$;

DO $$
BEGIN
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
    ELSE
        RAISE NOTICE 'Exams table already has data';
    END IF;
END $$;
