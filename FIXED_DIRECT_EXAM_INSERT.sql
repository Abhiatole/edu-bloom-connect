-- FIXED DIRECT EXAM INSERT
-- This script directly inserts an exam record with all required fields

-- Step 1: First get a valid subject_id from the subjects table
DO $$
DECLARE
    valid_subject_id UUID;
BEGIN
    -- Get a valid subject_id from the subjects table
    SELECT id INTO valid_subject_id FROM subjects LIMIT 1;

    IF valid_subject_id IS NULL THEN
        RAISE EXCEPTION 'No valid subject_id found in the subjects table. Please add subjects first.';
    END IF;

    -- Insert exam with all required fields
    INSERT INTO exams (
        title,                -- Required: NOT NULL
        subject_id,           -- Required: References subjects(id)
        exam_type,            -- Required: NOT NULL and must be a valid enum value
        class_level,          -- Required: NOT NULL
        max_marks             -- Required: NOT NULL with DEFAULT 100
    ) 
    VALUES (
        'Fixed Test Exam',
        valid_subject_id,     -- Using a valid subject_id from the database
        'Boards',             -- Using a valid exam_type enum value ('JEE', 'NEET', 'CET', 'Boards')
        10,                   -- Class level
        100                   -- Max marks
    );

    RAISE NOTICE 'Successfully inserted exam with subject_id: %', valid_subject_id;
END $$;

-- Verify exam was created
SELECT id, title, subject_id, exam_type, class_level, max_marks 
FROM exams 
ORDER BY created_at DESC 
LIMIT 5;
