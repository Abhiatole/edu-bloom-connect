import { supabase } from '@/integrations/supabase/client';

/**
 * Safely checks if a table exists without querying information_schema
 * Uses a fallback approach that's compatible with Supabase RLS
 * @param tableName The name of the table to check
 * @returns Promise<boolean> indicating if the table exists
 */
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    // First try the RPC approach (if the function exists)
    try {
      // @ts-ignore - The function is defined in SQL but TypeScript doesn't know about it
      const { data, error } = await supabase.rpc('table_exists', { table_name: tableName });
      if (!error && data !== null) {
        return !!data;
      }
    } catch (rpcError) {
      console.log('RPC method not available, falling back to query approach');
    }    // Fallback: Try to select from the table and see if it errors
    // We use count(*) since it works even if we don't know the columns
    // Use any type to bypass TypeScript's static type checking
    // This is necessary since we're working with dynamic table names
    const { error } = await (supabase as any)
      .from(tableName)
      .select('*', { count: 'exact', head: true });
      
    // If error contains "relation does not exist", table doesn't exist
    if (error && (
      error.message.includes('relation') && 
      error.message.includes('does not exist')
    )) {
      return false;
    }
    
    // For other types of errors (like column doesn't exist, or RLS errors)
    // the table likely exists but we just can't access it fully
    return !error || (
      error.message.includes('permission denied') || 
      error.message.includes('column') ||
      error.message.includes('not found')
    );
  } catch (e) {
    console.error(`Error checking if table ${tableName} exists:`, e);
    return false;
  }
};

/**
 * Gets a list of tables that don't exist from a given list
 * @param tableNames Array of table names to check
 * @returns Promise<string[]> List of missing tables
 */
export const getMissingTables = async (tableNames: string[]): Promise<string[]> => {
  const missingTables: string[] = [];
  
  for (const tableName of tableNames) {
    const exists = await checkTableExists(tableName);
    if (!exists) {
      missingTables.push(tableName);
    }
  }
  
  return missingTables;
};

/**
 * Checks if a column exists in a table
 * Uses a safe approach that's compatible with Supabase RLS
 * @param tableName The name of the table to check
 * @param columnName The name of the column to check
 * @returns Promise<boolean> indicating if the column exists
 */
export const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  try {
    // Try to select specifically the column we're checking
    const { error } = await (supabase as any)
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    // If we get a column-specific error, the column doesn't exist
    if (error && error.message.includes(`column "${columnName}" does not exist`)) {
      return false;
    }
    
    // For other errors, the column likely exists but we can't access it
    // or there's another issue (like the table not existing)
    return !error || !error.message.includes(`column "${columnName}" does not exist`);
  } catch (e) {
    console.error(`Error checking if column ${columnName} exists in table ${tableName}:`, e);
    return false;
  }
};
