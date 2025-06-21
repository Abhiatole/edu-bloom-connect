-- Fix for database API access issues (400 errors)
-- This script creates the necessary RPC functions and permissions to allow
-- proper API access through the Supabase REST API

-- 1. Create the table_exists function with parameter name that doesn't conflict
DROP FUNCTION IF EXISTS public.table_exists(text);
CREATE OR REPLACE FUNCTION public.table_exists(p_table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission to allow RPC calls
COMMENT ON FUNCTION public.table_exists IS 'Checks if a table exists in the public schema';
GRANT EXECUTE ON FUNCTION public.table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.table_exists TO anon;
GRANT EXECUTE ON FUNCTION public.table_exists TO service_role;

-- 2. Create a helper function to check if a column exists in a table
DROP FUNCTION IF EXISTS public.column_exists(text, text);
CREATE OR REPLACE FUNCTION public.column_exists(p_table_name text, p_column_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = p_table_name
    AND column_name = p_column_name
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission for the column_exists function
COMMENT ON FUNCTION public.column_exists IS 'Checks if a column exists in a specified table';
GRANT EXECUTE ON FUNCTION public.column_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.column_exists TO anon;
GRANT EXECUTE ON FUNCTION public.column_exists TO service_role;

-- 3. Enable RLS and add select policies for all dashboard tables
-- SUBJECTS TABLE
ALTER TABLE IF EXISTS public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subjects_select_policy ON public.subjects;
CREATE POLICY subjects_select_policy ON public.subjects
  FOR SELECT USING (auth.role() = 'authenticated');

-- TOPICS TABLE
ALTER TABLE IF EXISTS public.topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS topics_select_policy ON public.topics;
CREATE POLICY topics_select_policy ON public.topics
  FOR SELECT USING (auth.role() = 'authenticated');

-- EXAMS TABLE
ALTER TABLE IF EXISTS public.exams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exams_select_policy ON public.exams;
CREATE POLICY exams_select_policy ON public.exams
  FOR SELECT USING (auth.role() = 'authenticated');

-- EXAM_RESULTS TABLE
ALTER TABLE IF EXISTS public.exam_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exam_results_select_policy ON public.exam_results;
CREATE POLICY exam_results_select_policy ON public.exam_results
  FOR SELECT USING (auth.role() = 'authenticated');

-- TIMETABLES TABLE
ALTER TABLE IF EXISTS public.timetables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS timetables_select_policy ON public.timetables;
CREATE POLICY timetables_select_policy ON public.timetables
  FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Grant permissions to all existing tables and functions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 5. Create or replace exams-specific policies if needed
-- Teacher can manage their own exams
DROP POLICY IF EXISTS exams_insert_policy ON public.exams;
CREATE POLICY exams_insert_policy ON public.exams
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

DROP POLICY IF EXISTS exams_update_policy ON public.exams;
CREATE POLICY exams_update_policy ON public.exams
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS exams_delete_policy ON public.exams;
CREATE POLICY exams_delete_policy ON public.exams
  FOR DELETE USING (created_by = auth.uid());

-- 6. Create or replace exam_results-specific policies
-- Teachers can manage results for exams they created
DROP POLICY IF EXISTS exam_results_insert_policy ON public.exam_results;
CREATE POLICY exam_results_insert_policy ON public.exam_results
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.exams e 
      WHERE e.id = exam_id AND e.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS exam_results_update_policy ON public.exam_results;
CREATE POLICY exam_results_update_policy ON public.exam_results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.exams e 
      WHERE e.id = exam_id AND e.created_by = auth.uid()
    )
  );

-- 7. Create a helper function to get missing tables
CREATE OR REPLACE FUNCTION public.get_missing_tables(p_table_names text[])
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  missing_tables text[] := '{}';
  t text;
BEGIN
  FOREACH t IN ARRAY p_table_names
  LOOP
    IF NOT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = t
    ) THEN
      missing_tables := array_append(missing_tables, t);
    END IF;
  END LOOP;
  
  RETURN missing_tables;
END;
$$;

-- Grant execute permission for the get_missing_tables function
COMMENT ON FUNCTION public.get_missing_tables IS 'Returns a list of missing tables from an input array';
GRANT EXECUTE ON FUNCTION public.get_missing_tables TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_missing_tables TO anon;
GRANT EXECUTE ON FUNCTION public.get_missing_tables TO service_role;
