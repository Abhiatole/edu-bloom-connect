-- FIX EXAM RESULTS CONSTRAINTS
-- This script modifies the marks_obtained column to allow NULL values for pending exam results

DO $$
BEGIN
    -- Check if the exam_results table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'exam_results'
        AND table_schema = 'public'
    ) THEN
        -- Check if marks_obtained column has NOT NULL constraint
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'exam_results' 
            AND column_name = 'marks_obtained'
            AND table_schema = 'public'
            AND is_nullable = 'NO'  -- This checks for NOT NULL constraint
        ) THEN
            -- Alter the column to allow NULL values
            ALTER TABLE exam_results ALTER COLUMN marks_obtained DROP NOT NULL;
            
            RAISE NOTICE 'Modified marks_obtained column to allow NULL values for pending exam results';
        ELSE
            RAISE NOTICE 'marks_obtained column already allows NULL values';
        END IF;
        
        -- Add a status check constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.constraint_column_usage 
            WHERE table_name = 'exam_results'
            AND column_name = 'status'
            AND table_schema = 'public'
        ) THEN
            -- Add a check constraint to validate status values
            ALTER TABLE exam_results ADD CONSTRAINT valid_status_check 
                CHECK (status IN ('PENDING', 'GRADING', 'GRADED', 'SUBMITTED'));
                
            RAISE NOTICE 'Added status check constraint to exam_results table';
        END IF;
    ELSE
        RAISE NOTICE 'The exam_results table does not exist';
    END IF;
END $$;

-- Add documentation comment to the table
COMMENT ON TABLE exam_results IS 'Stores exam results with support for pending status (no marks yet) and completed results';

-- Update business rules
DO $$
BEGIN
    -- Create a function to auto-calculate percentage when marks are updated
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

    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS exam_result_percentage_trigger ON exam_results;
    
    -- Create the trigger
    CREATE TRIGGER exam_result_percentage_trigger
    BEFORE INSERT OR UPDATE OF marks_obtained
    ON exam_results
    FOR EACH ROW
    EXECUTE FUNCTION update_exam_result_percentage();
    
    RAISE NOTICE 'Created trigger to auto-calculate percentage and update status';
END $$;
