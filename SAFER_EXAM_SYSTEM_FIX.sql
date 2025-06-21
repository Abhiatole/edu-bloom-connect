-- SAFER_EXAM_SYSTEM_FIX.sql
-- This script first checks your current database state then applies only necessary changes

----------------------------------------
-- PART 1: INSPECTION PHASE
----------------------------------------

-- Store database state in temporary tables for reference during fixes
DROP TABLE IF EXISTS temp_table_check, temp_column_check, temp_constraint_check, temp_policy_check;

-- Check which tables exist
CREATE TEMP TABLE temp_table_check AS
SELECT table_name, 'exists' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('subjects', 'topics', 'exams', 'exam_results');

-- Check which columns exist in our tables of interest
CREATE TEMP TABLE temp_column_check AS
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name IN (
        SELECT table_name FROM temp_table_check
    );

-- Check which constraints exist
CREATE TEMP TABLE temp_constraint_check AS
SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition,
    rel.relname AS table_name
FROM 
    pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE 
    nsp.nspname = 'public'
    AND rel.relname IN (
        SELECT table_name FROM temp_table_check
    );

-- Check which policies exist
CREATE TEMP TABLE temp_policy_check AS
SELECT 
    tablename, 
    policyname
FROM 
    pg_policies
WHERE 
    schemaname = 'public' 
    AND tablename IN (
        SELECT table_name FROM temp_table_check
    );

-- Report the current state
DO $$
DECLARE
    missing_tables TEXT := '';
    table_record RECORD;
    has_valid_status_check BOOLEAN := FALSE;
    has_unique_exam_student BOOLEAN := FALSE;
BEGIN
    -- Check for missing tables
    FOR table_record IN 
        SELECT unnest(ARRAY['subjects', 'topics', 'exams', 'exam_results']) AS table_name
        EXCEPT
        SELECT table_name FROM temp_table_check
    LOOP
        missing_tables := missing_tables || table_record.table_name || ', ';
    END LOOP;
    
    IF missing_tables <> '' THEN
        missing_tables := SUBSTRING(missing_tables, 1, LENGTH(missing_tables) - 2); -- Remove trailing comma
        RAISE NOTICE 'Missing tables: %', missing_tables;
    ELSE
        RAISE NOTICE 'All required tables exist';
    END IF;
    
    -- Check for key constraints
    SELECT EXISTS (
        SELECT 1 FROM temp_constraint_check 
        WHERE constraint_name = 'valid_status_check'
        AND table_name = 'exam_results'
    ) INTO has_valid_status_check;
    
    SELECT EXISTS (
        SELECT 1 FROM temp_constraint_check 
        WHERE constraint_name = 'unique_exam_student'
        AND table_name = 'exam_results'
    ) INTO has_unique_exam_student;
    
    IF NOT has_valid_status_check THEN
        RAISE NOTICE 'Missing constraint: valid_status_check on exam_results';
    END IF;
    
    IF NOT has_unique_exam_student THEN
        RAISE NOTICE 'Missing constraint: unique_exam_student on exam_results';
    END IF;
END $$;

----------------------------------------
-- PART 2: FIX PHASE - Create or fix tables
----------------------------------------

-- 1. Create base tables if they don't exist
DO $$
BEGIN
    -- Create subjects table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM temp_table_check WHERE table_name = 'subjects') THEN
        CREATE TABLE public.subjects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        RAISE NOTICE 'Created subjects table';
    END IF;
    
    -- Create topics table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM temp_table_check WHERE table_name = 'topics') THEN
        CREATE TABLE public.topics (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            description TEXT,
            subject_id UUID REFERENCES public.subjects(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        RAISE NOTICE 'Created topics table';
    END IF;
    
    -- Create exams table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM temp_table_check WHERE table_name = 'exams') THEN
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
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        RAISE NOTICE 'Created exams table';
    END IF;
    
    -- Create exam_results table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM temp_table_check WHERE table_name = 'exam_results') THEN
        CREATE TABLE public.exam_results (
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
        RAISE NOTICE 'Created exam_results table';
    END IF;
END $$;

-- 2. Add missing columns to existing tables
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check and fix the exams table
    SELECT EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'exams') INTO table_exists;
    
    IF table_exists THEN
        -- Add missing columns to exams table
        IF NOT EXISTS(SELECT 1 FROM temp_column_check WHERE table_name = 'exams' AND column_name = 'subject') THEN
            ALTER TABLE public.exams ADD COLUMN subject TEXT;
            RAISE NOTICE 'Added subject column to exams table';
        END IF;
        
        IF NOT EXISTS(SELECT 1 FROM temp_column_check WHERE table_name = 'exams' AND column_name = 'subject_id') THEN
            ALTER TABLE public.exams ADD COLUMN subject_id UUID REFERENCES public.subjects(id);
            RAISE NOTICE 'Added subject_id column to exams table';
        END IF;
        
        IF NOT EXISTS(SELECT 1 FROM temp_column_check WHERE table_name = 'exams' AND column_name = 'topic_id') THEN
            ALTER TABLE public.exams ADD COLUMN topic_id UUID REFERENCES public.topics(id);
            RAISE NOTICE 'Added topic_id column to exams table';
        END IF;
        
        IF NOT EXISTS(SELECT 1 FROM temp_column_check WHERE table_name = 'exams' AND column_name = 'max_marks') THEN
            ALTER TABLE public.exams ADD COLUMN max_marks INTEGER DEFAULT 100;
            RAISE NOTICE 'Added max_marks column to exams table';
        END IF;
    END IF;
    
    -- Check and fix the exam_results table
    SELECT EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'exam_results') INTO table_exists;
    
    IF table_exists THEN
        -- Add missing columns to exam_results table
        IF NOT EXISTS(SELECT 1 FROM temp_column_check WHERE table_name = 'exam_results' AND column_name = 'status') THEN
            ALTER TABLE public.exam_results ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING';
            RAISE NOTICE 'Added status column to exam_results table';
        END IF;
        
        IF NOT EXISTS(SELECT 1 FROM temp_column_check WHERE table_name = 'exam_results' AND column_name = 'percentage') THEN
            ALTER TABLE public.exam_results ADD COLUMN percentage DECIMAL(5,2);
            RAISE NOTICE 'Added percentage column to exam_results table';
        END IF;
        
        IF NOT EXISTS(SELECT 1 FROM temp_column_check WHERE table_name = 'exam_results' AND column_name = 'examiner_id') THEN
            ALTER TABLE public.exam_results ADD COLUMN examiner_id UUID;
            RAISE NOTICE 'Added examiner_id column to exam_results table';
        END IF;
        
        -- Make sure marks_obtained is nullable for pending exams
        IF EXISTS(SELECT 1 FROM temp_column_check WHERE table_name = 'exam_results' AND column_name = 'marks_obtained' AND is_nullable = 'NO') THEN
            ALTER TABLE public.exam_results ALTER COLUMN marks_obtained DROP NOT NULL;
            RAISE NOTICE 'Modified marks_obtained to allow NULL values for pending results';
        END IF;
    END IF;
END $$;

-- 3. Add constraints safely (only if needed)
DO $$
BEGIN
    -- Only proceed if exam_results table exists
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'exam_results') THEN
        -- Add status check constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM temp_constraint_check 
            WHERE constraint_name = 'valid_status_check' 
            AND table_name = 'exam_results'
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
        
        -- Add unique constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM temp_constraint_check 
            WHERE constraint_name = 'unique_exam_student' 
            AND table_name = 'exam_results'
        ) THEN
            BEGIN
                -- First check if there would be constraint violations
                PERFORM exam_id, student_id, COUNT(*) 
                FROM public.exam_results 
                GROUP BY exam_id, student_id 
                HAVING COUNT(*) > 1
                LIMIT 1;
                
                IF FOUND THEN
                    RAISE NOTICE 'Cannot add unique constraint - duplicate exam_id/student_id combinations exist';
                ELSE
                    ALTER TABLE public.exam_results 
                        ADD CONSTRAINT unique_exam_student 
                        UNIQUE (exam_id, student_id);
                    RAISE NOTICE 'Added unique constraint for exam_id and student_id';
                END IF;
            EXCEPTION WHEN duplicate_object THEN
                RAISE NOTICE 'Unique constraint already exists';
            WHEN others THEN
                RAISE NOTICE 'Could not create unique constraint: %', SQLERRM;
            END;
        END IF;
    END IF;
END $$;

-- 4. Enable RLS on all tables
DO $$
BEGIN
    -- Enable RLS for each table that exists
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'subjects') THEN
        ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on subjects table';
    END IF;
    
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'topics') THEN
        ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on topics table';
    END IF;
    
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'exams') THEN
        ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on exams table';
    END IF;
    
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'exam_results') THEN
        ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Enabled RLS on exam_results table';
    END IF;
END $$;

-- 5. Create policies (only if they don't exist)
DO $$
BEGIN
    -- Create read policies for each table if needed
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'subjects') THEN
        IF NOT EXISTS(SELECT 1 FROM temp_policy_check WHERE tablename = 'subjects' AND policyname = 'Allow read access to subjects') THEN
            BEGIN
                CREATE POLICY "Allow read access to subjects" ON public.subjects
                    FOR SELECT USING (true);
                RAISE NOTICE 'Created read policy for subjects';
            EXCEPTION WHEN duplicate_object THEN
                NULL;
            END;
        END IF;
    END IF;
    
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'topics') THEN
        IF NOT EXISTS(SELECT 1 FROM temp_policy_check WHERE tablename = 'topics' AND policyname = 'Allow read access to topics') THEN
            BEGIN
                CREATE POLICY "Allow read access to topics" ON public.topics
                    FOR SELECT USING (true);
                RAISE NOTICE 'Created read policy for topics';
            EXCEPTION WHEN duplicate_object THEN
                NULL;
            END;
        END IF;
    END IF;
    
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'exams') THEN
        IF NOT EXISTS(SELECT 1 FROM temp_policy_check WHERE tablename = 'exams' AND policyname = 'Allow read access to exams') THEN
            BEGIN
                CREATE POLICY "Allow read access to exams" ON public.exams
                    FOR SELECT USING (true);
                RAISE NOTICE 'Created read policy for exams';
            EXCEPTION WHEN duplicate_object THEN
                NULL;
            END;
        END IF;
    END IF;
    
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'exam_results') THEN
        IF NOT EXISTS(SELECT 1 FROM temp_policy_check WHERE tablename = 'exam_results' AND policyname = 'Allow read access to exam_results') THEN
            BEGIN
                CREATE POLICY "Allow read access to exam_results" ON public.exam_results
                    FOR SELECT USING (true);
                RAISE NOTICE 'Created read policy for exam_results';
            EXCEPTION WHEN duplicate_object THEN
                NULL;
            END;
        END IF;
    END IF;
END $$;

-- 6. Create function and trigger for percentage calculation
DO $$
BEGIN
    -- Only create if exam_results table exists
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'exam_results') THEN
        -- Create or replace the function
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
        
        -- Drop the trigger if it exists and recreate it
        DROP TRIGGER IF EXISTS exam_result_percentage_trigger ON exam_results;
        
        CREATE TRIGGER exam_result_percentage_trigger
        BEFORE INSERT OR UPDATE OF marks_obtained
        ON exam_results
        FOR EACH ROW
        EXECUTE FUNCTION update_exam_result_percentage();
        
        RAISE NOTICE 'Created or updated trigger for percentage calculation';
    END IF;
END $$;

-- 7. Create views
DO $$
BEGIN
    -- Only create views if related tables exist
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'exam_results') 
       AND EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'exams') THEN
        
        -- Create view for exam results with calculated percentage
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
        
        RAISE NOTICE 'Created exam_results_with_percentage view';
          -- Create exam summary view with dynamic SQL based on available columns
        DO $$
        DECLARE
            has_topic_id BOOLEAN;
            has_subject_id BOOLEAN;
            view_sql TEXT;
        BEGIN
            -- Check if required columns exist
            SELECT EXISTS (
                SELECT 1 FROM temp_column_check
                WHERE table_name = 'exams' AND column_name = 'topic_id'
            ) INTO has_topic_id;
            
            SELECT EXISTS (
                SELECT 1 FROM temp_column_check
                WHERE table_name = 'exams' AND column_name = 'subject_id'
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
        END;
        $$;
    END IF;
END $$;

-- 8. Add sample data if tables are empty
DO $$
BEGIN
    -- Add sample subjects if none exist and subjects table exists
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'subjects') THEN
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
    END IF;
    
    -- Add sample topics if none exist and both subjects and topics tables exist
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'subjects') 
       AND EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'topics') THEN
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
    END IF;
    
    -- Add sample exams if none exist and required tables exist
    IF EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'subjects') 
       AND EXISTS(SELECT 1 FROM temp_table_check WHERE table_name = 'exams') THEN
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
    END IF;
END $$;

-- Clean up temporary tables
DROP TABLE IF EXISTS temp_table_check, temp_column_check, temp_constraint_check, temp_policy_check;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Database fix script completed successfully';
END $$;
