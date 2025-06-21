-- Create necessary database utility functions

-- Function to check if a table exists in the public schema
CREATE OR REPLACE FUNCTION public.table_exists(table_name text)
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
    AND table_name = $1
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Grant access to the function for all users
GRANT EXECUTE ON FUNCTION public.table_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.table_exists TO anon;

-- Function to get list of all public tables
CREATE OR REPLACE FUNCTION public.get_public_tables()
RETURNS TABLE (table_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT tables.table_name::text
  FROM information_schema.tables tables
  WHERE tables.table_schema = 'public'
  AND tables.table_type = 'BASE TABLE';
END;
$$;

-- Grant access to the function for all users
GRANT EXECUTE ON FUNCTION public.get_public_tables TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_tables TO anon;

-- Test the functions
SELECT * FROM public.table_exists('exam_results');
SELECT * FROM public.get_public_tables();
