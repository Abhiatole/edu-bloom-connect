-- COMPREHENSIVE_RLS_FIX.sql
-- This script ensures all tables have proper RLS policies for the dashboard

-- First, ensure the exam_results table exists with the correct structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'exam_results'
  ) THEN
    -- Create the exam_results table with the correct structure
    CREATE TABLE public.exam_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      exam_id UUID,
      student_id UUID,
      examiner_id UUID,
      score INTEGER,
      percentage DECIMAL,
      passing_status TEXT CHECK (passing_status IN ('PASS', 'FAIL')),
      status TEXT DEFAULT 'PENDING',
      feedback TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created exam_results table with correct structure';
  ELSE
    -- Add examiner_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'exam_results'
      AND column_name = 'examiner_id'
    ) THEN
      ALTER TABLE public.exam_results ADD COLUMN examiner_id UUID;
      RAISE NOTICE 'Added examiner_id column to exam_results table';
    END IF;
    
    -- Add student_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'exam_results'
      AND column_name = 'student_id'
    ) THEN
      ALTER TABLE public.exam_results ADD COLUMN student_id UUID;
      RAISE NOTICE 'Added student_id column to exam_results table';
    END IF;
  END IF;
END $$;

-- Then, enable RLS on all tables if not already enabled
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('subjects', 'topics', 'exams', 'exam_results', 'student_profiles', 'teacher_profiles', 'timetables')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', rec.tablename);
    RAISE NOTICE 'Enabled RLS on table: %', rec.tablename;
  END LOOP;
END $$;

-- Create comprehensive RLS policies for each table
-- Subjects table
DROP POLICY IF EXISTS subjects_select_policy ON public.subjects;
CREATE POLICY subjects_select_policy ON public.subjects
  FOR SELECT USING (true); -- Allow anyone to read subjects

DROP POLICY IF EXISTS subjects_insert_policy ON public.subjects;
CREATE POLICY subjects_insert_policy ON public.subjects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); -- Only authenticated users can insert

DROP POLICY IF EXISTS subjects_update_policy ON public.subjects;
CREATE POLICY subjects_update_policy ON public.subjects
  FOR UPDATE USING (auth.uid() IS NOT NULL); -- Only authenticated users can update

-- Topics table
DROP POLICY IF EXISTS topics_select_policy ON public.topics;
CREATE POLICY topics_select_policy ON public.topics
  FOR SELECT USING (true); -- Allow anyone to read topics

DROP POLICY IF EXISTS topics_insert_policy ON public.topics;
CREATE POLICY topics_insert_policy ON public.topics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL); -- Only authenticated users can insert

DROP POLICY IF EXISTS topics_update_policy ON public.topics;
CREATE POLICY topics_update_policy ON public.topics
  FOR UPDATE USING (auth.uid() IS NOT NULL); -- Only authenticated users can update

-- Exams table - with conditional RLS based on column existence
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS exams_select_policy ON public.exams;
  DROP POLICY IF EXISTS exams_insert_policy ON public.exams;
  DROP POLICY IF EXISTS exams_update_policy ON public.exams;
  
  -- Check if created_by column exists
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exams'
    AND column_name = 'created_by'
  ) THEN
    -- Create policy using created_by
    EXECUTE format('
      CREATE POLICY exams_select_policy ON public.exams
      FOR SELECT USING (created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid()
      ));
    ');
    
    EXECUTE format('
      CREATE POLICY exams_insert_policy ON public.exams
      FOR INSERT WITH CHECK (created_by = auth.uid());
    ');
    
    EXECUTE format('
      CREATE POLICY exams_update_policy ON public.exams
      FOR UPDATE USING (created_by = auth.uid());
    ');
  ELSIF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exams'
    AND column_name = 'created_by_teacher_id'
  ) THEN
    -- Create policy using created_by_teacher_id
    EXECUTE format('
      CREATE POLICY exams_select_policy ON public.exams
      FOR SELECT USING (created_by_teacher_id = auth.uid() OR EXISTS (
        SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid()
      ));
    ');
    
    EXECUTE format('
      CREATE POLICY exams_insert_policy ON public.exams
      FOR INSERT WITH CHECK (created_by_teacher_id = auth.uid());
    ');
    
    EXECUTE format('
      CREATE POLICY exams_update_policy ON public.exams
      FOR UPDATE USING (created_by_teacher_id = auth.uid());
    ');
  ELSE
    -- Fallback policy if neither column exists - just allow all teachers to access
    EXECUTE format('
      CREATE POLICY exams_select_policy ON public.exams
      FOR SELECT USING (EXISTS (
        SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid()
      ));
    ');
    
    EXECUTE format('
      CREATE POLICY exams_insert_policy ON public.exams
      FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid()
      ));
    ');
    
    EXECUTE format('
      CREATE POLICY exams_update_policy ON public.exams
      FOR UPDATE USING (EXISTS (
        SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid()
      ));
    ');
  END IF;
END $$;

-- Exam Results table
DO $$
BEGIN
  -- Drop existing policies
  DROP POLICY IF EXISTS exam_results_select_policy ON public.exam_results;
  DROP POLICY IF EXISTS exam_results_insert_policy ON public.exam_results;
  DROP POLICY IF EXISTS exam_results_update_policy ON public.exam_results;
  
  -- Check if examiner_id column exists
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'exam_results'
    AND column_name = 'examiner_id'
  ) THEN    -- Create policies using examiner_id
    EXECUTE format('
      CREATE POLICY exam_results_select_policy ON public.exam_results
      FOR SELECT USING (
        examiner_id = auth.uid() OR
        %s
        EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid())
      );
    ', 
    CASE WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'exam_results'
      AND column_name = 'student_id'
    ) THEN 'student_id = auth.uid() OR ' ELSE '' END);
    
    EXECUTE format('
      CREATE POLICY exam_results_insert_policy ON public.exam_results
      FOR INSERT WITH CHECK (
        examiner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid())
      );
    ');
    
    EXECUTE format('
      CREATE POLICY exam_results_update_policy ON public.exam_results
      FOR UPDATE USING (
        examiner_id = auth.uid() OR
        EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid())
      );
    ');
  ELSE    -- Fallback policies that don't rely on examiner_id
    EXECUTE format('
      CREATE POLICY exam_results_select_policy ON public.exam_results
      FOR SELECT USING (
        %s
        EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid())
      );
    ', 
    CASE WHEN EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'exam_results'
      AND column_name = 'student_id'
    ) THEN 'student_id = auth.uid() OR ' ELSE '' END);
    
    EXECUTE format('
      CREATE POLICY exam_results_insert_policy ON public.exam_results
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid())
      );
    ');
    
    EXECUTE format('
      CREATE POLICY exam_results_update_policy ON public.exam_results
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid())
      );
    ');
  END IF;
END $$;

-- Student Profiles table
DROP POLICY IF EXISTS student_profiles_select_policy ON public.student_profiles;
CREATE POLICY student_profiles_select_policy ON public.student_profiles
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS student_profiles_insert_policy ON public.student_profiles;
CREATE POLICY student_profiles_insert_policy ON public.student_profiles
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS student_profiles_update_policy ON public.student_profiles;
CREATE POLICY student_profiles_update_policy ON public.student_profiles
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid())
  );

-- Teacher Profiles table
DROP POLICY IF EXISTS teacher_profiles_select_policy ON public.teacher_profiles;
CREATE POLICY teacher_profiles_select_policy ON public.teacher_profiles
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS teacher_profiles_insert_policy ON public.teacher_profiles;
CREATE POLICY teacher_profiles_insert_policy ON public.teacher_profiles
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS teacher_profiles_update_policy ON public.teacher_profiles;
CREATE POLICY teacher_profiles_update_policy ON public.teacher_profiles
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Timetables table (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'timetables'
  ) THEN
    DROP POLICY IF EXISTS timetables_select_policy ON public.timetables;
    CREATE POLICY timetables_select_policy ON public.timetables
      FOR SELECT USING (true); -- Everyone can read timetables
    
    DROP POLICY IF EXISTS timetables_insert_policy ON public.timetables;
    CREATE POLICY timetables_insert_policy ON public.timetables
      FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid())
      );
    
    DROP POLICY IF EXISTS timetables_update_policy ON public.timetables;
    CREATE POLICY timetables_update_policy ON public.timetables
      FOR UPDATE USING (
        EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- Output success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully updated RLS policies for all tables';
END $$;
