-- UPDATE_STUDENT_NAMES_ENROLLMENTS.sql
-- This script updates the student profiles with real names and enrollment numbers

-- First, check if the enrollment_no column exists, add it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'student_profiles' 
    AND column_name = 'enrollment_no'
  ) THEN
    -- Add enrollment_no column if it doesn't exist
    ALTER TABLE student_profiles ADD COLUMN enrollment_no VARCHAR(20);
    RAISE NOTICE 'Added enrollment_no column to student_profiles table';
  ELSE
    RAISE NOTICE 'enrollment_no column already exists in student_profiles table';
  END IF;
END $$;

-- Create a temporary table with our desired student data
CREATE TEMPORARY TABLE temp_student_data (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100),
  enrollment_no VARCHAR(20)
);

-- Insert the desired student names and enrollment numbers
INSERT INTO temp_student_data (full_name, enrollment_no) VALUES
('Ananya Sharma', 'S1000'),
('Raj Patel', 'S1001'),
('Priya Singh', 'S1002'),
('Vikram Mehta', 'S1003'),
('Neha Gupta', 'S1004'),
('Aditya Verma', 'S1005');

-- Update existing student profiles with the new data
-- This will match students in order by id (so first student gets first name, etc.)
DO $$
DECLARE
  student_record RECORD;
  temp_record RECORD;
  i INT := 1;
BEGIN
  FOR student_record IN
    SELECT id FROM student_profiles ORDER BY created_at
  LOOP
    -- Get the corresponding temp data
    SELECT * INTO temp_record FROM temp_student_data WHERE id = i;
    
    -- If we have a matching temp record, update the student profile
    IF FOUND THEN
      UPDATE student_profiles
      SET 
        full_name = temp_record.full_name,
        enrollment_no = temp_record.enrollment_no
      WHERE id = student_record.id;
      
      RAISE NOTICE 'Updated student % with name % and enrollment %', 
        student_record.id, temp_record.full_name, temp_record.enrollment_no;
    ELSE
      -- We've run out of sample data
      EXIT;
    END IF;
    
    i := i + 1;
  END LOOP;
END $$;

-- Clean up
DROP TABLE temp_student_data;

-- Output success message
SELECT 'Student names and enrollment numbers have been updated successfully!' AS result;
