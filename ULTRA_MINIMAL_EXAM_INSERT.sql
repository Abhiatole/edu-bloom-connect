-- ULTRA MINIMAL EXAM INSERT
-- This script inserts an exam with just the required NOT NULL fields

-- Insert a basic exam record with minimal fields
INSERT INTO exams (
    title,       -- NOT NULL from schema
    subject,     -- NOT NULL from schema (caused error when missing)
    class_level, -- NOT NULL from schema
    max_marks,   -- NOT NULL from schema
    exam_type    -- NOT NULL from schema (caused error when missing)
) 
VALUES (
    'Ultra Minimal Exam',
    'Physics',   -- Valid subject value
    10,          -- Class level
    100,         -- Max marks
    'Boards'     -- Valid exam_type value
)
RETURNING id, title, subject, exam_type;

-- Verify exam was created
SELECT 
    id, 
    title, 
    subject, 
    exam_type,
    class_level,
    max_marks,
    created_at
FROM exams 
WHERE title = 'Ultra Minimal Exam'
ORDER BY created_at DESC 
LIMIT 5;
