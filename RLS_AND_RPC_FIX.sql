-- RLS_AND_RPC_FIX.sql
-- This script fixes REST API access issues by:
--   1. Creating a proper table_exists RPC function 
--   2. Setting up correct RLS policies
--   3. Granting appropriate permissions

-- First, make sure we have the required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the table_exists function that can be called via RPC
-- Note: The parameter name is "p_table_name" to avoid conflict with the column name
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

-- Important: Grant execute permission to allow RPC calls
COMMENT ON FUNCTION public.table_exists IS 'Checks if a table exists in the public schema';
GRANT EXECUTE ON FUNCTION public.table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.table_exists TO anon;
GRANT EXECUTE ON FUNCTION public.table_exists TO service_role;

-- Setup RLS for all relevant tables
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

-- Ensure all authenticated users can use the tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create a helper function to check if a column exists in a table
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
