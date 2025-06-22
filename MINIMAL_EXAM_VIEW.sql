-- MINIMAL EXAM VIEW
-- This script creates the simplest possible view that should work in any situation

-- Drop the view if it exists
DROP VIEW IF EXISTS exam_summary_view;

-- Create a minimal view with only guaranteed columns
CREATE OR REPLACE VIEW exam_summary_view AS
SELECT 
    e.id,
    e.title,
    '' AS description,
    'Other' AS subject_name,
    'General' AS topic_name,
    NULL AS class_level,
    NULL AS max_marks,
    NULL AS created_by,
    NOW() AS created_at
FROM 
    exams e;
