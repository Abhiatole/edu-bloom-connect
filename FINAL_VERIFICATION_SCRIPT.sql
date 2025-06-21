-- FINAL_VERIFICATION_SCRIPT.sql
-- This script will verify that all necessary functions, tables, and permissions are properly set up

-- First, let's check if our helper functions exist and are accessible
DO $$
DECLARE
  function_exists boolean;
  tables_missing text[];
  missing_count integer;
  can_access_tables boolean;
BEGIN
  -- Check if the table_exists function exists
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'table_exists'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO function_exists;
  
  RAISE NOTICE 'table_exists function exists: %', function_exists;
  
  -- Check if the column_exists function exists
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'column_exists'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO function_exists;
  
  RAISE NOTICE 'column_exists function exists: %', function_exists;
  
  -- Check if the get_missing_tables function exists
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'get_missing_tables'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO function_exists;
  
  RAISE NOTICE 'get_missing_tables function exists: %', function_exists;
  
  -- Check which essential tables are missing
  SELECT array_agg(t) 
  FROM unnest(ARRAY['subjects', 'topics', 'exams', 'exam_results', 'student_profiles', 'teacher_profiles', 'timetables']) t
  WHERE NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = t
  ) INTO tables_missing;
  
  SELECT coalesce(array_length(tables_missing, 1), 0) INTO missing_count;
  RAISE NOTICE 'Missing tables count: %', missing_count;
  
  IF missing_count > 0 THEN
    RAISE NOTICE 'Missing tables: %', tables_missing;
  ELSE
    RAISE NOTICE 'All required tables exist';
  END IF;
  
  -- Verify if the RLS policies are correct
  RAISE NOTICE '--- RLS Policy Verification ---';
  
  -- Check if we can select from key tables with RLS enabled
  BEGIN
    -- This will run in the security definer context, so it will work regardless of RLS
    -- But it helps us check which tables have RLS enabled
    FOR i IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND 
             tablename IN ('subjects', 'topics', 'exams', 'exam_results', 'student_profiles', 'teacher_profiles')
    LOOP
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = %L)', i) INTO can_access_tables;
      RAISE NOTICE 'Table % has RLS policies: %', i, can_access_tables;
    END LOOP;
  END;
  
  -- Check if the created_by column exists in the exams table
  IF EXISTS (
    SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exams'
  ) THEN
    RAISE NOTICE 'Checking exams table columns...';
    
    DECLARE 
      col_exists boolean;
    BEGIN
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'exams'
        AND column_name = 'created_by'
      ) INTO col_exists;
      
      RAISE NOTICE 'exams.created_by column exists: %', col_exists;
      
      -- Check alternative fields that might be used
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'exams'
        AND column_name = 'created_by_teacher_id'
      ) INTO col_exists;
      
      RAISE NOTICE 'exams.created_by_teacher_id column exists: %', col_exists;
    END;
  END IF;
END $$;
