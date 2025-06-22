-- COMPLETE EXAM INSERT
-- This script inserts an exam record with subject_id reference

-- Insert a basic exam record
INSERT INTO exams (
    title,
    subject,        -- Required field
    subject_id,     -- Reference to the subjects table
    class_level,
    max_marks,
    exam_type       -- Required field (NOT NULL)
) 
VALUES (
    'Physics Midterm Exam',
    'Physics',      -- Text value
    'f649186d-93b0-4b00-a3ca-2a05a26c093d',  -- UUID for Physics from your subject data
    10,             -- Class level 
    100,            -- Max marks
    'JEE'           -- One of the exam_type enum values (JEE, NEET, CET, Boards)
)
RETURNING id, title, subject, subject_id, exam_type;

-- Create with a different subject and exam type
INSERT INTO exams (
    title,
    subject,
    subject_id,
    class_level,
    max_marks,
    exam_type
) 
VALUES (
    'Mathematics Final Exam',
    'Mathematics',
    'ef86e3a0-52ff-411f-a6b4-42baaa6717c1',  -- UUID for Mathematics
    11,
    150,
    'Boards'        -- Different exam type
)
RETURNING id, title, subject, subject_id, exam_type;

-- Verify exams were created
SELECT id, title, subject, subject_id, exam_type, class_level, max_marks 
FROM exams 
ORDER BY created_at DESC 
LIMIT 5;
