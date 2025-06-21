-- FINAL_APPLICATION_TEST.sql
-- Run this script to verify that all database components are working correctly

-- First, check if helper functions exist and are accessible
DO $$
DECLARE
  helper_exists boolean;
  missing_tables text[];
BEGIN
  -- Check if our helper functions exist
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'table_exists'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO helper_exists;
  
  IF helper_exists THEN
    RAISE NOTICE 'table_exists function exists ✓';
  ELSE
    RAISE NOTICE 'table_exists function is missing! Please run FINAL_DATABASE_API_FIX.sql first.';
    RETURN;
  END IF;
  
  -- Check if column_exists function exists
  SELECT EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'column_exists'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) INTO helper_exists;
  
  IF helper_exists THEN
    RAISE NOTICE 'column_exists function exists ✓';
  ELSE
    RAISE NOTICE 'column_exists function is missing! Please run FINAL_DATABASE_API_FIX.sql first.';
    RETURN;
  END IF;
  
  -- Use our function to check for missing tables
  EXECUTE 'SELECT array_agg(t) FROM unnest(ARRAY[''subjects'', ''topics'', ''exams'', ''exam_results'', ''student_profiles'', ''teacher_profiles'', ''timetables'']) t WHERE NOT public.table_exists(t)' 
  INTO missing_tables;
  
  IF missing_tables IS NULL OR array_length(missing_tables, 1) IS NULL THEN
    RAISE NOTICE 'All required tables exist ✓';
  ELSE
    RAISE NOTICE 'Missing tables detected: %', missing_tables;
    RAISE NOTICE 'Please run FINAL_DATABASE_API_FIX.sql to create missing tables.';
  END IF;
  
  -- Check for the examiner_id and student_id columns in exam_results
  IF public.table_exists('exam_results') THEN
    IF public.column_exists('exam_results', 'examiner_id') THEN
      RAISE NOTICE 'exam_results.examiner_id column exists ✓';
    ELSE
      RAISE NOTICE 'exam_results.examiner_id column is missing! Please run COMPREHENSIVE_RLS_FIX.sql to add it.';
    END IF;
    
    IF public.column_exists('exam_results', 'student_id') THEN
      RAISE NOTICE 'exam_results.student_id column exists ✓';
    ELSE
      RAISE NOTICE 'exam_results.student_id column is missing! Please run COMPREHENSIVE_RLS_FIX.sql to add it.';
    END IF;
  END IF;
    -- Check if RLS is enabled on key tables
  DECLARE
    rls_enabled boolean;
    table_rec record;
  BEGIN
    FOR table_rec IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND 
             tablename IN ('subjects', 'topics', 'exams', 'exam_results', 'student_profiles', 'teacher_profiles')
    LOOP
      EXECUTE format('SELECT relrowsecurity FROM pg_class WHERE relname = %L AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = ''public'')', table_rec.tablename) INTO rls_enabled;
      
      IF rls_enabled THEN
        RAISE NOTICE 'RLS is enabled on table % ✓', table_rec.tablename;
      ELSE
        RAISE NOTICE 'RLS is NOT enabled on table %! Please run COMPREHENSIVE_RLS_FIX.sql.', table_rec.tablename;
      END IF;
    END LOOP;
  END;
  
  -- Try to insert test data to verify permissions
  DECLARE
    insert_result text;
    select_result text;
  BEGIN
    BEGIN
      -- Try insert into subjects
      INSERT INTO subjects (name, description) 
      VALUES ('Test Subject', 'This is a test subject - will be removed')
      RETURNING 'Insert succeeded' INTO insert_result;
      
      RAISE NOTICE 'Subject insert test: %', COALESCE(insert_result, 'Failed - Check RLS policies');
      
      -- Clean up
      DELETE FROM subjects WHERE name = 'Test Subject';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Subject insert test failed: %', SQLERRM;
    END;
    
    BEGIN
      -- Try select from student_profiles
      EXECUTE 'SELECT ''Select succeeded'' FROM student_profiles LIMIT 1' INTO select_result;
      
      RAISE NOTICE 'Student profiles select test: %', COALESCE(select_result, 'Failed - Check RLS policies');
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Student profiles select test failed: %', SQLERRM;
    END;
  END;
END $$;
