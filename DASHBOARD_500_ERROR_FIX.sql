-- DASHBOARD_500_ERROR_FIX.sql
-- This script fixes the 500 Internal Server Error in the ModernTeacherDashboard.tsx

-- First, fix any RPC function issues by recreating them with improved error handling
DROP FUNCTION IF EXISTS public.table_exists(text);
CREATE OR REPLACE FUNCTION public.table_exists(p_table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = p_table_name
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in table_exists function: %', SQLERRM;
    RETURN false;
END;
$$;

-- Grant execute permission to allow RPC calls
COMMENT ON FUNCTION public.table_exists IS 'Checks if a table exists in the public schema';
GRANT EXECUTE ON FUNCTION public.table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.table_exists TO anon;
GRANT EXECUTE ON FUNCTION public.table_exists TO service_role;

-- Improved column_exists function with better error handling
DROP FUNCTION IF EXISTS public.column_exists(text, text);
CREATE OR REPLACE FUNCTION public.column_exists(p_table_name text, p_column_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First check if table exists to avoid errors
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = p_table_name
  ) THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND c.relname = p_table_name
    AND a.attname = p_column_name
    AND NOT a.attisdropped
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in column_exists function: %', SQLERRM;
    RETURN false;
END;
$$;

-- Grant execute permission for the column_exists function
COMMENT ON FUNCTION public.column_exists IS 'Checks if a column exists in a specified table';
GRANT EXECUTE ON FUNCTION public.column_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.column_exists TO anon;
GRANT EXECUTE ON FUNCTION public.column_exists TO service_role;

-- Function to get missing tables with better error handling
DROP FUNCTION IF EXISTS public.get_missing_tables(text[]);
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
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = t
    ) THEN
      missing_tables := array_append(missing_tables, t);
    END IF;
  END LOOP;
  
  RETURN missing_tables;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in get_missing_tables function: %', SQLERRM;
    RETURN p_table_names; -- Return all tables as missing in case of error
END;
$$;

-- Grant execute permission for the get_missing_tables function
COMMENT ON FUNCTION public.get_missing_tables IS 'Returns a list of tables that do not exist from the input array';
GRANT EXECUTE ON FUNCTION public.get_missing_tables TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_missing_tables TO anon;
GRANT EXECUTE ON FUNCTION public.get_missing_tables TO service_role;

-- Fix the examiner_id column in exam_results if it doesn't exist
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'exam_results'
  ) AND NOT EXISTS (
    SELECT FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND c.relname = 'exam_results'
    AND a.attname = 'examiner_id'
    AND NOT a.attisdropped
  ) THEN
    ALTER TABLE public.exam_results ADD COLUMN examiner_id UUID;
    RAISE NOTICE 'Added examiner_id column to exam_results table';
  END IF;
END $$;

-- Make sure RLS is properly set up for all dashboard tables
DO $$
DECLARE
  table_name text;
  tables text[] := ARRAY['subjects', 'topics', 'exams', 'exam_results', 'student_profiles', 'teacher_profiles', 'timetables'];
BEGIN
  FOREACH table_name IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);
      
      -- Create SELECT policy
      EXECUTE format('
        DROP POLICY IF EXISTS %I_select_policy ON public.%I;
        CREATE POLICY %I_select_policy ON public.%I
          FOR SELECT USING (auth.role() = ''authenticated'');
      ', table_name, table_name, table_name, table_name);
      
      -- Create INSERT policy
      EXECUTE format('
        DROP POLICY IF EXISTS %I_insert_policy ON public.%I;
        CREATE POLICY %I_insert_policy ON public.%I
          FOR INSERT WITH CHECK (auth.role() = ''authenticated'');
      ', table_name, table_name, table_name, table_name);
      
      -- Create UPDATE policy
      EXECUTE format('
        DROP POLICY IF EXISTS %I_update_policy ON public.%I;
        CREATE POLICY %I_update_policy ON public.%I
          FOR UPDATE USING (auth.role() = ''authenticated'');
      ', table_name, table_name, table_name, table_name);
      
      RAISE NOTICE 'Set up RLS policies for table: %', table_name;
    END IF;
  END LOOP;
END $$;

-- Grant permissions to all tables
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
