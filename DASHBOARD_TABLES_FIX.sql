-- DASHBOARD TABLES CHECKER AND FIXER
-- This script safely checks for and creates any missing tables needed for the dashboard
-- It will create exam_results, exams, subjects, topics, and timetables if they don't exist

-- First, drop the existing function if it exists, then create helper function to check for table existence
DROP FUNCTION IF EXISTS public.table_exists(text);

CREATE OR REPLACE FUNCTION public.table_exists(p_table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION public.table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.table_exists TO anon;

-- Create subjects table if it doesn't exist
DO $$
BEGIN
  IF NOT public.table_exists('subjects') THEN
    CREATE TABLE public.subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add RLS policies for subjects
    ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
    
    -- Allow all authenticated users to view subjects
    CREATE POLICY subjects_select_policy ON public.subjects
      FOR SELECT USING (auth.role() = 'authenticated');
      
    -- Allow administrators to modify subjects
    CREATE POLICY subjects_all_policy ON public.subjects
      USING (
        EXISTS (
          SELECT 1 FROM public.teacher_profiles
          WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
      );
      
    -- Insert some sample subjects
    INSERT INTO public.subjects (name, description)
    VALUES 
      ('Mathematics', 'Study of numbers, quantities, and shapes'),
      ('Science', 'Study of the natural world'),
      ('English', 'Study of language and literature'),
      ('History', 'Study of past events'),
      ('Geography', 'Study of places and environments');
  END IF;
END
$$;

-- Create topics table if it doesn't exist
DO $$
BEGIN
  IF NOT public.table_exists('topics') THEN
    CREATE TABLE public.topics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        subject_id UUID REFERENCES public.subjects(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add RLS policies for topics
    ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
    
    -- Allow all authenticated users to view topics
    CREATE POLICY topics_select_policy ON public.topics
      FOR SELECT USING (auth.role() = 'authenticated');
      
    -- Allow administrators to modify topics
    CREATE POLICY topics_all_policy ON public.topics
      USING (
        EXISTS (
          SELECT 1 FROM public.teacher_profiles
          WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
      );
      
    -- Insert some sample topics if subjects exist
    IF public.table_exists('subjects') THEN
      INSERT INTO public.topics (name, description, subject_id)
      SELECT 'Algebra', 'Study of mathematical symbols and rules', id
      FROM public.subjects WHERE name = 'Mathematics';
      
      INSERT INTO public.topics (name, description, subject_id)
      SELECT 'Biology', 'Study of living organisms', id
      FROM public.subjects WHERE name = 'Science';
      
      INSERT INTO public.topics (name, description, subject_id)
      SELECT 'Grammar', 'Study of language structure', id
      FROM public.subjects WHERE name = 'English';
    END IF;
  END IF;
END
$$;

-- Create exams table if it doesn't exist
DO $$
BEGIN
  IF NOT public.table_exists('exams') THEN
    CREATE TABLE public.exams (
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
    
    -- Add RLS policies for exams
    ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
    
    -- Allow teachers to view their own exams
    CREATE POLICY exams_select_policy ON public.exams
      FOR SELECT USING (
        auth.role() = 'authenticated' AND (
          created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.teacher_profiles
            WHERE user_id = auth.uid() AND role = 'ADMIN'
          )
        )
      );
      
    -- Allow teachers to modify their own exams
    CREATE POLICY exams_modify_policy ON public.exams
      USING (created_by = auth.uid());
  END IF;
END
$$;

-- Create exam_results table if it doesn't exist
DO $$
BEGIN
  IF NOT public.table_exists('exam_results') THEN
    CREATE TABLE public.exam_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id UUID REFERENCES public.exams(id),
        student_id UUID NOT NULL,
        examiner_id UUID NOT NULL,
        score INTEGER,
        percentage DECIMAL,
        passing_status TEXT CHECK (passing_status IN ('PASS', 'FAIL')),
        status TEXT DEFAULT 'PENDING',
        feedback TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add RLS policies for exam_results
    ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
    
    -- Allow teachers to view results where they are the examiner
    CREATE POLICY exam_results_teacher_policy ON public.exam_results
      FOR ALL USING (examiner_id = auth.uid());
      
    -- Allow students to view their own results
    CREATE POLICY exam_results_student_policy ON public.exam_results
      FOR SELECT USING (student_id = auth.uid());
      
    -- Allow admins to view all results
    CREATE POLICY exam_results_admin_policy ON public.exam_results
      USING (
        EXISTS (
          SELECT 1 FROM public.teacher_profiles
          WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
      );
  END IF;
END
$$;

-- Create timetables table if it doesn't exist
DO $$
BEGIN
  IF NOT public.table_exists('timetables') THEN
    CREATE TABLE public.timetables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        class_id TEXT NOT NULL,
        teacher_id UUID NOT NULL,
        subject_id UUID REFERENCES public.subjects(id),
        day_of_week TEXT,
        start_time TIME,
        end_time TIME,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Add RLS policies for timetables
    ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
    
    -- Allow teachers to view their own timetables
    CREATE POLICY timetables_teacher_policy ON public.timetables
      FOR ALL USING (teacher_id = (
        SELECT id FROM public.teacher_profiles
        WHERE user_id = auth.uid()
      ));
      
    -- Allow admins to view all timetables
    CREATE POLICY timetables_admin_policy ON public.timetables
      USING (
        EXISTS (
          SELECT 1 FROM public.teacher_profiles
          WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
      );
  END IF;
END
$$;

-- Create a helper view for exam results with percentage calculation
DO $$
BEGIN
  DROP VIEW IF EXISTS exam_results_with_percentage;
  
  CREATE VIEW exam_results_with_percentage AS
  SELECT 
    r.id,
    r.exam_id,
    r.student_id,
    r.examiner_id,
    r.score,
    CASE
      WHEN r.percentage IS NOT NULL THEN r.percentage
      WHEN e.max_marks > 0 AND r.score IS NOT NULL THEN (r.score * 100.0 / e.max_marks)
      ELSE NULL
    END AS percentage,
    r.passing_status,
    r.status,
    r.feedback,
    r.created_at,
    r.updated_at,
    e.title AS exam_title,
    s.name AS subject_name,
    t.name AS topic_name,
    sp.full_name AS student_name,
    tp.full_name AS examiner_name
  FROM 
    public.exam_results r
  LEFT JOIN 
    public.exams e ON r.exam_id = e.id
  LEFT JOIN 
    public.subjects s ON e.subject_id = s.id
  LEFT JOIN 
    public.topics t ON e.topic_id = t.id
  LEFT JOIN 
    public.student_profiles sp ON r.student_id = sp.user_id
  LEFT JOIN 
    public.teacher_profiles tp ON r.examiner_id = tp.user_id;
    
  -- Grant access to the view
  GRANT SELECT ON exam_results_with_percentage TO authenticated;
END
$$;

-- Add comment explaining what was done
COMMENT ON FUNCTION public.table_exists IS 'Helper function to check if a table exists in the public schema';
