-- FIX EXAM RESULTS TABLE SCRIPT
-- This script ensures the exam_results table exists and is properly configured

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

-- Make sure RLS is enabled
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "Allow teacher insert exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "Allow student view own exam_results" ON public.exam_results;

-- Add permissive policies for proper access
CREATE POLICY "Allow read access to exam_results" ON public.exam_results
    FOR SELECT USING (true);

CREATE POLICY "Allow teacher insert exam_results" ON public.exam_results
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.teacher_profiles WHERE user_id = auth.uid())
    );

-- Add a utility function to check if the table exists
CREATE OR REPLACE FUNCTION table_exists(tablename text)
RETURNS boolean AS $$
DECLARE
    exists boolean;
BEGIN
    SELECT count(*) > 0 INTO exists
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = tablename;
    RETURN exists;
END;
$$ LANGUAGE plpgsql;

-- Verify the table exists
DO $$
BEGIN
    IF table_exists('exam_results') THEN
        RAISE NOTICE 'The exam_results table exists';
    ELSE
        RAISE EXCEPTION 'The exam_results table does not exist after creation attempt';
    END IF;
END $$;

-- Add comment to table
COMMENT ON TABLE public.exam_results IS 'Student results for exams';
