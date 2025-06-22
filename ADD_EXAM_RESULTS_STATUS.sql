-- Add 'status' column to exam_results table if it doesn't exist
-- This helps track which exam results are pending grading vs. completed
DO $$
BEGIN
    -- Check if the status column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exam_results' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        -- Add the status column with default value 'GRADED' for existing rows
        ALTER TABLE exam_results ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'GRADED';
        
        -- Add a comment explaining the status values
        COMMENT ON COLUMN exam_results.status IS 'Status of the exam result: PENDING, GRADING, GRADED';
        
        -- Create an index for faster filtering by status
        CREATE INDEX idx_exam_results_status ON exam_results(status);
        
        RAISE NOTICE 'Added status column to exam_results table';
    ELSE
        RAISE NOTICE 'Status column already exists in exam_results table';
    END IF;
      -- Also check if the examiner_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exam_results' 
        AND column_name = 'examiner_id'
        AND table_schema = 'public'
    ) THEN
        -- Add the examiner_id column 
        ALTER TABLE exam_results ADD COLUMN examiner_id UUID REFERENCES auth.users(id);
        
        -- Add an index for faster filtering
        CREATE INDEX idx_exam_results_examiner ON exam_results(examiner_id);
          -- Check if created_by_teacher_id column exists in exams table before trying to use it
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exams' 
            AND column_name = 'created_by_teacher_id'
            AND table_schema = 'public'
        ) THEN
            -- Set the examiner_id for existing records using the creator of the exam
            UPDATE exam_results er
            SET examiner_id = e.created_by_teacher_id
            FROM exams e
            WHERE er.exam_id = e.id AND er.examiner_id IS NULL;
        ELSE
            -- If created_by_teacher_id doesn't exist, log a notice
            RAISE NOTICE 'Cannot update examiner_id because created_by_teacher_id column does not exist in exams table';
        END IF;
        
        RAISE NOTICE 'Added examiner_id column to exam_results table';
    ELSE
        RAISE NOTICE 'Examiner_id column already exists in exam_results table';
    END IF;
END $$;

-- Create a view that includes percentage calculation
DO $$
BEGIN
    -- Drop the view if it exists to recreate it
    DROP VIEW IF EXISTS exam_results_with_percentage;
    
    -- First check if percentage column already exists in exam_results
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exam_results' 
        AND column_name = 'percentage'
        AND table_schema = 'public'
    ) THEN
        -- Create the view using the existing percentage column
        CREATE OR REPLACE VIEW exam_results_with_percentage AS
        SELECT 
            er.*,
            CASE 
                WHEN er.percentage IS NOT NULL THEN er.percentage
                WHEN e.max_marks > 0 AND er.marks_obtained IS NOT NULL THEN 
                    ROUND((er.marks_obtained::numeric / e.max_marks::numeric) * 100)
                ELSE 
                    NULL
            END AS calculated_percentage
        FROM 
            exam_results er
        JOIN 
            exams e ON er.exam_id = e.id;
        
        RAISE NOTICE 'Created view with calculated_percentage to avoid column duplication';
    ELSE
        -- Create the view with a percentage column
        CREATE OR REPLACE VIEW exam_results_with_percentage AS
        SELECT 
            er.*,
            CASE 
                WHEN e.max_marks > 0 AND er.marks_obtained IS NOT NULL THEN 
                    ROUND((er.marks_obtained::numeric / e.max_marks::numeric) * 100)
                ELSE 
                    NULL
            END AS percentage
        FROM 
            exam_results er
        JOIN 
            exams e ON er.exam_id = e.id;
            
        RAISE NOTICE 'Created view with percentage calculation';
    END IF;
        
    RAISE NOTICE 'Created or updated exam_results_with_percentage view';
END $$;

-- Create some sample pending exam results for testing
-- Comment this out in production environment
DO $$
DECLARE
    teacher_id UUID;
    exam_id_var UUID; -- Renamed to avoid ambiguity
    created_by_exists BOOLEAN;
BEGIN    -- Check if created_by_teacher_id column exists in exams table
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exams' 
        AND column_name = 'created_by_teacher_id'
        AND table_schema = 'public'
    ) INTO created_by_exists;
    
    -- Only proceed if the created_by_teacher_id column exists
    IF created_by_exists THEN        -- Get a random teacher
        SELECT user_id INTO teacher_id FROM teacher_profiles LIMIT 1;
        
        -- Only proceed if we have a teacher
        IF teacher_id IS NOT NULL THEN
            -- Get or create an exam for this teacher
            SELECT id INTO exam_id_var FROM exams WHERE created_by_teacher_id = teacher_id LIMIT 1;-- If no exam exists, create one
            IF exam_id_var IS NULL THEN
                -- Insert using the actual columns in the table
                INSERT INTO exams (
                    title, 
                    subject, 
                    class_level, 
                    exam_type, 
                    max_marks,
                    exam_date,
                    created_by_teacher_id
                )
                VALUES (
                    'Sample Exam', 
                    'Mathematics', 
                    10, 
                    'Quiz', 
                    100,
                    CURRENT_DATE,                    teacher_id
                )
                RETURNING id INTO exam_id_var;            END IF;
              -- Insert some pending exam results            
            FOR i IN 1..5 LOOP
                -- Find a student
                WITH student AS (
                    SELECT id as student_id FROM student_profiles ORDER BY RANDOM() LIMIT 1
                )
                INSERT INTO exam_results (exam_id, student_id, marks_obtained, status, examiner_id)
                SELECT 
                    exam_id_var, -- Use the variable name with a suffix to avoid ambiguity
                    student_id, 
                    0, -- Set to 0 initially since marks_obtained is NOT NULL
                    'PENDING',
                    teacher_id
                FROM student
                ON CONFLICT (exam_id, student_id) DO NOTHING;
            END LOOP;
            
            RAISE NOTICE 'Created sample pending exam results for testing';
        END IF;
    ELSE
        RAISE NOTICE 'Skipping sample data creation because created_by column does not exist in exams table';
    END IF;
END $$;
