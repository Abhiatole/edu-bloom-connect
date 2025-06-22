-- COMPREHENSIVE EXAM INSERT
-- This script inserts an exam record with all required fields based on the Supabase schema

-- Check if subject_type and exam_type are enums and get valid values
DO $$
DECLARE
    subject_enum_exists BOOLEAN;
    exam_type_enum_exists BOOLEAN;
    valid_teacher_id UUID;
BEGIN
    -- Check if subject_type is an enum type
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'subject_type'
    ) INTO subject_enum_exists;

    -- Check if exam_type is an enum type
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'exam_type'
    ) INTO exam_type_enum_exists;

    -- Try to get a valid teacher ID
    BEGIN
        SELECT id INTO valid_teacher_id FROM teacher_profiles LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'No teacher profiles found, using NULL for teacher ID';
    END;

    -- Print notices about enum types and valid values
    IF subject_enum_exists THEN
        RAISE NOTICE 'subject_type is an enum type';
    ELSE
        RAISE NOTICE 'subject_type is not an enum type, using text value';
    END IF;

    IF exam_type_enum_exists THEN
        RAISE NOTICE 'exam_type is an enum type';
    ELSE
        RAISE NOTICE 'exam_type is not an enum type, using text value';
    END IF;

    -- Print notice about teacher ID
    IF valid_teacher_id IS NOT NULL THEN
        RAISE NOTICE 'Using teacher ID: %', valid_teacher_id;
    END IF;
END $$;

-- Insert a basic exam record
INSERT INTO exams (
    title,                    -- Required field (NOT NULL)
    subject,                  -- Required field (NOT NULL)
    class_level,              -- Required field (NOT NULL)
    max_marks,                -- Required field (NOT NULL)
    exam_type,                -- Required field (NOT NULL)
    exam_date,                -- Required field (from types)
    created_by_teacher_id     -- Required field (from types)
) 
VALUES (
    'Comprehensive Test Exam',
    'Physics',                -- A valid subject_type value
    10,                       -- Class level
    100,                      -- Max marks
    'Boards',                 -- A valid exam_type value
    current_timestamp,        -- Current date
    (SELECT id FROM teacher_profiles LIMIT 1)  -- Get a valid teacher ID
)
RETURNING id, title, subject, exam_type, class_level, created_by_teacher_id;

-- Alternative insert if previous fails (using different fields)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM exams WHERE title = 'Comprehensive Test Exam') THEN
        RAISE NOTICE 'First insert failed, trying alternative...';
        
        -- Try with different field combination
        INSERT INTO exams (
            title,
            subject,
            class_level,
            exam_type,
            max_marks,             -- Using max_marks instead of total_marks if needed
            exam_date,
            created_by_teacher_id  -- Using NULL if no teacher_profiles found
        ) 
        VALUES (
            'Alternative Test Exam',
            'Physics',
            10,
            'Boards',
            100,
            current_timestamp,
            NULL
        );
        
        RAISE NOTICE 'Alternative insert completed';
    ELSE
        RAISE NOTICE 'First insert succeeded';
    END IF;
END $$;

-- Verify exams were created
SELECT 
    id, 
    title, 
    subject, 
    exam_type, 
    class_level, 
    max_marks,
    exam_date,
    created_by_teacher_id,
    created_at
FROM 
    exams 
ORDER BY 
    created_at DESC 
LIMIT 5;
