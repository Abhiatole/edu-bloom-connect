-- FALLBACK EXAM INSERT
-- This script provides multiple options for inserting an exam with required fields

-- Option 1: Full insert with all fields from the type definition
DO $$
DECLARE
    teacher_id UUID;
BEGIN
    -- Try to get a teacher ID
    SELECT id INTO teacher_id FROM teacher_profiles LIMIT 1;
    
    -- If no teacher found, try a fallback approach
    IF teacher_id IS NULL THEN
        RAISE NOTICE 'No teacher profiles found, trying alternative insert';
        
        -- Insert with minimal fields
        INSERT INTO exams (
            title,
            subject,
            class_level,
            max_marks,
            exam_type,
            exam_date,
            created_by_teacher_id  -- Using NULL since no teacher found
        ) 
        VALUES (
            'Fallback Test Exam',
            'Physics',
            10,
            100,
            'Boards',
            current_timestamp,
            NULL
        )
        RETURNING id, title, subject, exam_type;
    ELSE
        -- Insert with teacher ID
        INSERT INTO exams (
            title,
            subject,
            class_level,
            max_marks,
            exam_type,
            exam_date,
            created_by_teacher_id
        ) 
        VALUES (
            'Standard Test Exam',
            'Physics',
            10,
            100,
            'Boards',
            current_timestamp,
            teacher_id
        )
        RETURNING id, title, subject, exam_type;
    END IF;
END $$;

-- Option 2: Extra minimal insert trying only required fields
INSERT INTO exams (
    title,
    subject,
    class_level,
    exam_type
) 
VALUES (
    'Minimal Test Exam',
    'Physics',
    10,
    'Boards'
);

-- Verify exams were created
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
WHERE title LIKE '%Test Exam'
ORDER BY created_at DESC 
LIMIT 10;
