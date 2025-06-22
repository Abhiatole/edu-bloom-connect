-- SUPER MINIMAL EXAM VIEW
-- This script creates the absolute simplest view without any joins or type issues

-- Drop the view if it exists
DROP VIEW IF EXISTS exam_summary_view;

-- Create a minimal view with only basic columns and no joins
CREATE OR REPLACE VIEW exam_summary_view AS
SELECT 
    id,
    title,
    '' AS description,
    'Other' AS subject_name,
    'General' AS topic_name,
    NULL AS class_level,
    NULL AS max_marks,
    NULL AS created_by,
    NOW() AS created_at
FROM 
    exams;
