-- FIX EXAM VIEW WITH TYPE SAFETY
-- This script creates a view that handles type compatibility between subject_type and text

-- First, let's check what values are allowed in the subject_type enum
DO $$
DECLARE
    allowed_values text;
BEGIN
    -- Get a comma-separated list of valid enum values
    SELECT string_agg(quote_literal(enumlabel), ', ') 
    FROM pg_enum 
    WHERE enumtypid = 'subject_type'::regtype
    INTO allowed_values;
    
    RAISE NOTICE 'Allowed subject_type values: %', allowed_values;
END $$;

-- Drop the view if it exists 
DROP VIEW IF EXISTS exam_summary_view;

-- Create a view that safely handles the type conversion
CREATE OR REPLACE VIEW exam_summary_view AS
SELECT 
    e.id,
    e.title,
    e.description,
    -- Type-safe handling of the subject name
    (
        CASE 
            -- Case 1: When we have a valid subject_id and related subject name
            WHEN e.subject_id IS NOT NULL AND s.name IS NOT NULL THEN 
                s.name -- Already a subject_type
                
            -- Case 2: When we have a text subject that needs conversion
            WHEN e.subject IS NOT NULL THEN
                -- Try to convert to enum type with validation
                CASE
                    -- Check if the value matches a valid enum value
                    WHEN e.subject IN ('Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other') THEN
                        e.subject::subject_type 
                    ELSE
                        'Other'::subject_type -- Default to 'Other' if not valid
                END
                
            -- Case 3: Default fallback
            ELSE
                'Other'::subject_type
        END
    ) AS subject_name,
    
    COALESCE(t.name, 'General') AS topic_name,
    e.class_level,
    e.max_marks,
    e.created_by,
    e.created_at
FROM 
    exams e
LEFT JOIN 
    subjects s ON e.subject_id = s.id
LEFT JOIN 
    topics t ON e.topic_id = t.id;
