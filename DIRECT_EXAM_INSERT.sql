-- DIRECT EXAM INSERT
-- This script directly inserts an exam record without using views

-- Insert a basic exam record
INSERT INTO exams (
    title,
    subject,       -- Required field (NOT NULL)
    class_level,
    max_marks,
    exam_type      -- Required field (NOT NULL)
) 
VALUES (
    'Basic Test Exam',
    'Physics',     -- Using one of the subjects from your data
    10,            -- Assuming class_level is numeric
    100,           -- Assuming max_marks is numeric
    'Boards'       -- Assuming exam_type is an enum with 'Boards' as a valid value
)
RETURNING id, title, subject, exam_type;  -- Return the exam details

-- Verify exam was created
SELECT id, title, subject, exam_type FROM exams ORDER BY created_at DESC LIMIT 5;
