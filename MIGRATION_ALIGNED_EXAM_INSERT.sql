-- EXAM INSERT - MIGRATION ALIGNED
-- This script aligns perfectly with the migration file structure

-- Insert a basic exam record that matches the migration file schema
INSERT INTO exams (
    title,                    -- Required VARCHAR(200) NOT NULL
    subject_id,               -- UUID REFERENCES subjects(id)
    exam_type,                -- exam_type NOT NULL
    class_level,              -- INTEGER NOT NULL
    max_marks,                -- INTEGER NOT NULL DEFAULT 100
    created_by                -- UUID REFERENCES auth.users(id)
) 
VALUES (
    'Migration Aligned Exam', -- title
    (SELECT id FROM subjects WHERE name = 'Physics' OR subject_name = 'Physics' LIMIT 1), -- subject_id
    'Boards',                 -- exam_type (valid enum value)
    10,                       -- class_level
    100,                      -- max_marks
    (SELECT id FROM auth.users LIMIT 1) -- created_by
)
RETURNING id, title, exam_type, class_level, max_marks;

-- Verify exam was created
SELECT 
    id, 
    title, 
    subject_id,
    exam_type, 
    class_level,
    max_marks,
    created_at
FROM exams 
ORDER BY created_at DESC 
LIMIT 5;
