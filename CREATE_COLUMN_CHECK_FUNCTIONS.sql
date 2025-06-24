-- CREATE_COLUMN_CHECK_FUNCTIONS.sql
-- This script creates utility functions for checking and adding columns

-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION column_exists(
  p_table TEXT,
  p_column TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table
      AND column_name = p_column
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a column if it doesn't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  p_table TEXT,
  p_column TEXT,
  p_type TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT column_exists(p_table, p_column) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table, p_column, p_type);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant privileges to authenticated users
GRANT EXECUTE ON FUNCTION column_exists TO authenticated;
GRANT EXECUTE ON FUNCTION add_column_if_not_exists TO authenticated;

-- Output success message
SELECT 'Column check and add functions have been created successfully!' AS result;
