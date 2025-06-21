-- CREATE TRIGGER FUNCTION FOR EXAM RESULTS
-- This script creates the trigger function to auto-calculate percentage

-- Create the function
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

-- Create the trigger
DROP TRIGGER IF EXISTS exam_result_percentage_trigger ON exam_results;

CREATE TRIGGER exam_result_percentage_trigger
BEFORE INSERT OR UPDATE OF marks_obtained
ON exam_results
FOR EACH ROW
EXECUTE FUNCTION update_exam_result_percentage();
