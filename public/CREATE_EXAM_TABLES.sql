-- CREATE EXAM TABLES SCRIPT
-- This script creates all necessary tables for the exam feature
-- Run this script in your Supabase SQL editor if you're experiencing 400 errors with exam queries

-- Create subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create topics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.subjects(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create exams table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.subjects(id),
    topic_id UUID REFERENCES public.topics(id),
    class_level TEXT,
    exam_type TEXT,
    max_marks INTEGER DEFAULT 100,
    passing_marks INTEGER DEFAULT 40,
    duration_minutes INTEGER DEFAULT 60,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create exam_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id),
    student_id UUID NOT NULL,
    examiner_id UUID NOT NULL,
    score INTEGER,
    percentage DECIMAL,
    passing_status TEXT CHECK (passing_status IN ('PASS', 'FAIL')),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies to allow access
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Modified INSERT statement that handles name conflicts
INSERT INTO public.subjects (name, description) 
VALUES 
('Mathematics', 'Core mathematics curriculum'),
('Science', 'General science topics'),
('English', 'Language and literature'),
('History', 'World and regional history')
ON CONFLICT (name) DO NOTHING;

-- Add permissive policies for read access
CREATE POLICY "Allow read access to subjects" ON public.subjects
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to topics" ON public.topics
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to exams" ON public.exams
    FOR SELECT USING (auth.uid() = created_by OR 
                     EXISTS (SELECT 1 FROM public.teacher_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Allow teacher create exams" ON public.exams
    FOR INSERT WITH CHECK (auth.uid() = created_by AND 
                          EXISTS (SELECT 1 FROM public.teacher_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Allow read access to exam_results" ON public.exam_results
    FOR SELECT USING (auth.uid() = examiner_id OR 
                     auth.uid() = student_id OR 
                     EXISTS (SELECT 1 FROM public.admin_profiles WHERE user_id = auth.uid()));

-- Add comment to all tables
COMMENT ON TABLE public.subjects IS 'Subject categories for exams';
COMMENT ON TABLE public.topics IS 'Topics within subjects for more detailed exam categorization';
COMMENT ON TABLE public.exams IS 'Exam definitions created by teachers';
COMMENT ON TABLE public.exam_results IS 'Student results for exams';
