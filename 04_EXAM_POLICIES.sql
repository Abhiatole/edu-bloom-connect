-- EXAM POLICIES
-- This script creates the RLS policies for exam tables

-- Create policies for subjects
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow read access to subjects" ON public.subjects
            FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists
        RAISE NOTICE 'Policy for subjects already exists';
    END;
END $$;

-- Create policies for topics
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow read access to topics" ON public.topics
            FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists
        RAISE NOTICE 'Policy for topics already exists';
    END;
END $$;

-- Create policies for exams
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow read access to exams" ON public.exams
            FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists
        RAISE NOTICE 'Policy for exams already exists';
    END;
END $$;

-- Create policies for exam_results
DO $$
BEGIN
    BEGIN
        CREATE POLICY "Allow read access to exam_results" ON public.exam_results
            FOR SELECT USING (true);
    EXCEPTION WHEN duplicate_object THEN
        -- Policy already exists
        RAISE NOTICE 'Policy for exam_results already exists';
    END;
END $$;
