-- SQL script to add utility functions for checking database schema
-- This helps prevent 400/406 errors by allowing the frontend to check if tables exist

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

-- Allow anonymous access to table_exists function
CREATE POLICY "Allow anonymous access to table_exists function" ON public.table_exists FOR ALL TO anon USING (true);

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

-- Allow anonymous access to get_public_tables function
CREATE POLICY "Allow anonymous access to get_public_tables function" ON public.get_public_tables FOR ALL TO anon USING (true);

-- Function to get column names for a specific table
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS TABLE (column_name text, data_type text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT columns.column_name::text, columns.data_type::text
  FROM information_schema.columns columns
  WHERE columns.table_schema = 'public'
  AND columns.table_name = $1;
END;
$$;

-- Allow anonymous access to get_table_columns function
CREATE POLICY "Allow anonymous access to get_table_columns function" ON public.get_table_columns FOR ALL TO anon USING (true);

-- COMMENT ON FUNCTION public.table_exists IS 'Checks if a table exists in the public schema';
-- COMMENT ON FUNCTION public.get_public_tables IS 'Returns a list of all tables in the public schema';
-- COMMENT ON FUNCTION public.get_table_columns IS 'Returns a list of columns and their data types for a specific table';
