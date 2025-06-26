import { createClient } from '@supabase/supabase-js';
// Initialize the Supabase client with more permissive types for raw queries
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseRaw = createClient(supabaseUrl, supabaseKey);
/**
 * Utility function to check if a table exists in the database
 */
export async function checkTableExists(tableName: string) {
  try {
    const { data, error } = await supabaseRaw.rpc('table_exists', { table_name: tableName });
    
    if (error) {
      return false;
    }
    
    return data;
  } catch (error) {
    return false;
  }
}
/**
 * Utility function to get the list of tables in the database
 */
export async function getTablesList() {
  try {
    // Direct SQL query to get tables
    const { data, error } = await supabaseRaw.rpc('get_public_tables');
    
    if (error) {
      return [];
    }
    
    return data || [];
  } catch (error) {
    return [];
  }
}
