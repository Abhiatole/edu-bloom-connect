
-- Fix the exams table - add missing columns and fix existing ones
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS max_marks INTEGER DEFAULT 100;

-- Update existing rows to use total_marks as max_marks
UPDATE exams SET max_marks = total_marks WHERE max_marks IS NULL;

-- Add percentage column to exam_results (calculated field)
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2) GENERATED ALWAYS AS (
  CASE 
    WHEN marks_obtained > 0 THEN ROUND((marks_obtained::DECIMAL / 100) * 100, 2)
    ELSE 0 
  END
) STORED;

-- Create subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  code VARCHAR(10),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subjects
INSERT INTO subjects (name, code) VALUES 
  ('Physics', 'PHY'),
  ('Chemistry', 'CHE'), 
  ('Mathematics', 'MAT'),
  ('Biology', 'BIO'),
  ('English', 'ENG'),
  ('Computer Science', 'CS'),
  ('Other', 'OTH')
ON CONFLICT (name) DO NOTHING;

-- Add subject_id to exams table
ALTER TABLE exams 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id);

-- Update existing exams to link to subjects
UPDATE exams SET subject_id = (
  SELECT s.id FROM subjects s WHERE s.name = exams.subject::text
) WHERE subject_id IS NULL;

-- Fix student_insights table to match the expected structure
ALTER TABLE student_insights 
ADD COLUMN IF NOT EXISTS strength_level INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS weak_areas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS strong_areas TEXT[] DEFAULT '{}', 
ADD COLUMN IF NOT EXISTS focus_topics TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS performance_trend VARCHAR(20) DEFAULT 'stable',
ADD COLUMN IF NOT EXISTS ai_recommendations TEXT,
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id);

-- Update existing student_insights
UPDATE student_insights SET 
  weak_areas = weaknesses,
  strong_areas = strengths,
  ai_recommendations = COALESCE(recommendations, ai_comment),
  subject_id = (SELECT s.id FROM subjects s WHERE s.name = student_insights.subject::text)
WHERE weak_areas IS NULL OR strong_areas IS NULL;

-- Create proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_student_insights_student_id ON student_insights(student_id);
CREATE INDEX IF NOT EXISTS idx_student_insights_subject_id ON student_insights(subject_id);
