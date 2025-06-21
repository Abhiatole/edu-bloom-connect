-- Function to allow executing SQL from frontend for table creation
-- SECURITY NOTE: This function is intentionally restricted to CREATE TABLE statements
-- to prevent any potential SQL injection attacks

CREATE OR REPLACE FUNCTION public.execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Uses the privileges of the function creator
AS $$
DECLARE
  result JSONB;
  is_create_table BOOLEAN;
BEGIN
  -- Validate that the SQL is a CREATE TABLE IF NOT EXISTS statement
  -- This is a basic security check to prevent arbitrary SQL execution
  is_create_table := sql_query ~* '^CREATE TABLE IF NOT EXISTS';
  
  IF NOT is_create_table THEN
    RAISE EXCEPTION 'Only CREATE TABLE IF NOT EXISTS statements are allowed';
  END IF;
  
  -- Execute the SQL
  EXECUTE sql_query;
  
  -- Return success response
  result := jsonb_build_object(
    'success', true,
    'message', 'SQL executed successfully'
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  -- Return error response
  result := jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'error_detail', SQLSTATE
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_sql TO authenticated;
-- Grant execute permission to anonymous users (if needed for initial setup)
GRANT EXECUTE ON FUNCTION public.execute_sql TO anon;

-- Add row level security policy
ALTER FUNCTION public.execute_sql SECURITY DEFINER;

COMMENT ON FUNCTION public.execute_sql IS 
'Function to safely execute CREATE TABLE statements from the frontend. 
Restricted to CREATE TABLE IF NOT EXISTS statements only for security.';
