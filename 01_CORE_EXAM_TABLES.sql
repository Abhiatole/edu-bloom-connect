-- CORE EXAM TABLES
-- This script creates just the essential exam tables without complex operations

-- Create subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique index on subjects name
CREATE UNIQUE INDEX IF NOT EXISTS subjects_name_idx ON subjects (name);

-- Create topics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    subject_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign key later in a separate step
DO $$
BEGIN
    BEGIN
        ALTER TABLE topics 
        ADD CONSTRAINT topics_subject_id_fkey 
        FOREIGN KEY (subject_id) REFERENCES subjects(id);
    EXCEPTION WHEN duplicate_object THEN
        -- Foreign key already exists
    END;
END $$;

-- Create exams table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    subject_id UUID,
    topic_id UUID,
    class_level TEXT,
    exam_type TEXT,
    max_marks INTEGER DEFAULT 100,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign keys separately
DO $$
BEGIN
    BEGIN
        ALTER TABLE exams
        ADD CONSTRAINT exams_subject_id_fkey
        FOREIGN KEY (subject_id) REFERENCES subjects(id);
    EXCEPTION WHEN duplicate_object THEN
        -- Foreign key already exists
    END;
    
    BEGIN
        ALTER TABLE exams
        ADD CONSTRAINT exams_topic_id_fkey
        FOREIGN KEY (topic_id) REFERENCES topics(id);
    EXCEPTION WHEN duplicate_object THEN
        -- Foreign key already exists
    END;
END $$;

-- Create exam_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID,
    student_id UUID NOT NULL,
    examiner_id UUID,
    marks_obtained INTEGER,
    percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'PENDING',
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign key and constraints separately
DO $$
BEGIN
    BEGIN
        ALTER TABLE exam_results
        ADD CONSTRAINT exam_results_exam_id_fkey
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        -- Foreign key already exists
    END;
    
    BEGIN
        ALTER TABLE exam_results
        ADD CONSTRAINT valid_status_check
        CHECK (status IN ('PENDING', 'GRADING', 'GRADED', 'SUBMITTED'));
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists
    END;
    
    BEGIN
        ALTER TABLE exam_results
        ADD CONSTRAINT unique_exam_student
        UNIQUE (exam_id, student_id);
    EXCEPTION WHEN duplicate_object THEN
        -- Constraint already exists
    END;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
