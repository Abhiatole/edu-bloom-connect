-- UPDATED DIRECT EXAM INSERT
-- This script directly inserts an exam record with all required fields

-- Insert a basic exam record
INSERT INTO exams (
    title,
    subject,  -- Required field (NOT NULL)
    class_level,
    max_marks,
    exam_type,  -- Required field (NOT NULL)
    exam_date,  -- Required field based on type definition
    created_by_teacher_id  -- Required field based on type definition
) 
VALUES (
    'Updated Test Exam',
    'Physics',  -- Using a valid subject_type enum value
    10,  -- Class level as numeric
    100,  -- Max marks as numeric
    'Boards',  -- Using a valid exam_type enum value
    current_timestamp,  -- Using current timestamp for exam_date
    (SELECT id FROM teacher_profiles LIMIT 1)  -- Getting a valid teacher ID
)
RETURNING id, title, subject, exam_type, exam_date;  -- Return the exam details

-- Verify exam was created
SELECT 
    id, 
    title, 
    subject, 
    exam_type,
    class_level,
    max_marks,
    exam_date,
    created_by_teacher_id
FROM exams 
ORDER BY created_at DESC 
LIMIT 5;
