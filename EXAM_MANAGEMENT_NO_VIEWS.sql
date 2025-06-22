-- EXAM MANAGEMENT WITHOUT VIEWS
-- This script provides exam management functionality without using views

-- 1. Get all exams with basic info
SELECT 
    e.id,
    e.title,
    e.class_level,
    e.max_marks
FROM 
    exams e
ORDER BY 
    e.created_at DESC
LIMIT 10;

-- 2. Insert a new exam
INSERT INTO exams (
    title,
    class_level,
    max_marks
) 
VALUES (
    'Sample Exam Title',
    10,
    100
)
RETURNING id, title;

-- 3. Get exam details by ID
-- Replace the UUID below with an actual exam ID
SELECT * FROM exams WHERE id = '00000000-0000-0000-0000-000000000000';

-- 4. Update an exam
-- Replace the UUID below with an actual exam ID
UPDATE exams 
SET 
    title = 'Updated Exam Title',
    max_marks = 150
WHERE 
    id = '00000000-0000-0000-0000-000000000000'
RETURNING id, title, max_marks;

-- 5. Delete an exam
-- Replace the UUID below with an actual exam ID
-- DELETE FROM exams WHERE id = '00000000-0000-0000-0000-000000000000';
-- COMMENTED OUT FOR SAFETY - UNCOMMENT TO USE
