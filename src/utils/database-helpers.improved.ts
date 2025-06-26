import { supabase } from '@/integrations/supabase/client';
// Debug flag - set to true to log details about database operations
const DEBUG = false;
/**
 * Safely checks if a table exists without querying information_schema directly
 * Uses a multi-layered fallback approach that's compatible with Supabase RLS
 * @param tableName The name of the table to check
 * @returns Promise<boolean> indicating if the table exists
 */
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    if (DEBUG) console.log(`Checking if table exists: ${tableName}`);
    
    // Layer 1: Try the RPC function approach first (most reliable if set up)
    try {
      // @ts-ignore - RPC function is defined in SQL but TypeScript doesn't know about it
      const { data, error } = await supabase.rpc('table_exists', { 
        p_table_name: tableName 
      });
      
      if (!error && data !== null) {
        if (DEBUG) console.log(`RPC method confirmed table ${tableName} exists:`, data);
        return !!data;
      }
      
      if (error) {
        if (DEBUG) console.log(`RPC method error for ${tableName}:`, error);
      }
    } catch (rpcError) {
      if (DEBUG) console.log('RPC method not available, falling back to query approach', rpcError);
    }
    
    // Layer 2: Try to select a single row from the table with count
    try {
      const { error } = await (supabase as any)
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(1);
        
      // If there's no error, the table definitely exists
      if (!error) {
        if (DEBUG) console.log(`Query method confirmed table ${tableName} exists`);
        return true;
      }
      
      // If error contains "relation does not exist", table doesn't exist
      if (error && (
        error.message.includes('relation') && 
        error.message.includes('does not exist')
      )) {
        if (DEBUG) console.log(`Query method confirmed table ${tableName} does NOT exist`);
        return false;
      }
      
      // For other error types, we likely have RLS issues but table exists
      if (error && (
        error.message.includes('permission denied') || 
        error.message.includes('not found')
      )) {
        if (DEBUG) console.log(`Table ${tableName} likely exists but has RLS restrictions`);
        return true;
      }
    } catch (queryError) {
      if (DEBUG) console.log(`Query approach failed for ${tableName}:`, queryError);
    }
    
    // Layer 3: Last resort - try with a filter method instead of select
    // This sometimes bypasses RLS issues
    try {
      const { error } = await (supabase as any)
        .from(tableName)
        .select('id')
        .filter('id', 'not.is', null)
        .limit(1);
      
      // Similar logic as above - no error means table exists  
      if (!error) {
        if (DEBUG) console.log(`Filter method confirmed table ${tableName} exists`);
        return true;
      }
      
      // Check for relation-not-exists error
      if (error && (
        error.message.includes('relation') && 
        error.message.includes('does not exist')
      )) {
        if (DEBUG) console.log(`Filter method confirmed table ${tableName} does NOT exist`);
        return false;
      }
    } catch (filterError) {
      if (DEBUG) console.log(`Filter approach failed for ${tableName}:`, filterError);
    }
    
    // Final fallback: If all checks failed with errors (not definitive "does not exist"),
    // assume table exists but we have permission issues
    if (DEBUG) console.log(`Unable to definitively check table ${tableName}, assuming it exists with access issues`);
    return true;
  } catch (e) {
    // In production, fail safe by assuming the table doesn't exist
    return false;
  }
};
/**
 * Gets a list of tables that don't exist from a given list
 * Uses the improved checkTableExists function with multi-layered fallbacks
 * @param tableNames Array of table names to check
 * @returns Promise<string[]> List of missing tables
 */
export const getMissingTables = async (tableNames: string[]): Promise<string[]> => {
  try {
    if (DEBUG) console.log(`Checking for missing tables among: ${tableNames.join(', ')}`);
    
    // Layer 1: Try using the RPC function first (most efficient)
    try {
      // @ts-ignore - RPC function is defined in SQL
      const { data, error } = await supabase.rpc('get_missing_tables', { 
        p_table_names: tableNames 
      });
      
      if (!error && data !== null) {
        if (DEBUG) console.log(`Found missing tables via RPC: ${Array.isArray(data) ? data.join(', ') : 'none'}`);
        return Array.isArray(data) ? data : [];
      }
      
      if (error) {
        if (DEBUG) console.log('RPC get_missing_tables error:', error);
      }
    } catch (rpcError) {
      if (DEBUG) console.log('RPC get_missing_tables not available, falling back to individual checks', rpcError);
    }
    
    // Layer 2: Check each table individually
    const missingTables: string[] = [];
    
    for (const tableName of tableNames) {
      const exists = await checkTableExists(tableName);
      if (!exists) {
        missingTables.push(tableName);
      }
    }
    
    if (DEBUG) console.log(`Found missing tables via individual checks: ${missingTables.join(', ')}`);
    return missingTables;
  } catch (e) {
    // In case of error, return all tables as missing to be safe
    return tableNames;
  }
};
/**
 * Checks if a column exists in a table
 * Uses a multi-layered fallback approach that's compatible with Supabase RLS
 * @param tableName The name of the table to check
 * @param columnName The name of the column to check
 * @returns Promise<boolean> indicating if the column exists
 */
export const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  try {
    if (DEBUG) console.log(`Checking if column ${columnName} exists in table ${tableName}`);
    
    // Layer 1: Try the RPC function approach first
    try {
      // @ts-ignore - RPC function is defined in SQL
      const { data, error } = await supabase.rpc('column_exists', { 
        p_table_name: tableName,
        p_column_name: columnName 
      });
      
      if (!error && data !== null) {
        if (DEBUG) console.log(`RPC method confirmed column ${columnName} exists in ${tableName}:`, data);
        return !!data;
      }
      
      if (error) {
        if (DEBUG) console.log(`Column check RPC error for ${tableName}.${columnName}:`, error);
      }
    } catch (rpcError) {
      if (DEBUG) console.log('Column check RPC not available, falling back to query approach', rpcError);
    }
    
    // Layer 2: Try to select the specific column
    try {
      // Build a query that selects just the column we're checking
      const { error } = await (supabase as any)
        .from(tableName)
        .select(columnName)
        .limit(1);
      
      // If there's no error, the column definitely exists
      if (!error) {
        if (DEBUG) console.log(`Query confirmed column ${columnName} exists in ${tableName}`);
        return true;
      }
      
      // If we get a column-specific error, the column doesn't exist
      // but the table does
      if (error && error.message.includes(`column "${columnName}" does not exist`)) {
        if (DEBUG) console.log(`Query confirmed column ${columnName} does NOT exist in ${tableName}`);
        return false;
      }
      
      // If we get a table-does-not-exist error, we treat the column as
      // not existing because the whole table is missing
      if (error && error.message.includes('relation') && error.message.includes('does not exist')) {
        if (DEBUG) console.log(`Table ${tableName} does not exist, so column ${columnName} cannot exist`);
        return false;
      }
      
      // For other error types (like permission denied), we assume the column
      // might exist but we can't access it
      if (DEBUG) console.log(`Unable to determine if column ${columnName} exists in ${tableName} due to access restrictions`);
      return true;
    } catch (queryError) {
      if (DEBUG) console.log(`Query approach failed for ${tableName}.${columnName}:`, queryError);
    }
    
    // Layer 3: Last resort - assume column exists if we reach here
    // This is safer than breaking the UI by reporting missing columns
    if (DEBUG) console.log(`Assuming column ${columnName} exists in ${tableName} due to inconclusive checks`);
    return true;
  } catch (e) {
    // In case of error, assume column exists to prevent UI breakage
    return true;
  }
};
/**
 * Creates all necessary dashboard tables if they don't exist
 * This is a utility function that can be called from components
 * @returns Promise<boolean> indicating if tables were created or already existed
 */
export const createDashboardTables = async (): Promise<{success: boolean; message: string}> => {
  try {
    // First check if tables already exist
    const missingTables = await getMissingTables([
      'subjects', 'topics', 'exams', 'exam_results', 'timetables'
    ]);
    
    if (missingTables.length === 0) {
      return { success: true, message: 'All required tables already exist.' };
    }
    
    // Attempt to create missing tables using the execute_sql RPC function
    try {
      // Basic SQL to create the missing tables
      const createTablesSQL = `
        -- Create missing tables automatically
        DO $$
        BEGIN
          ${missingTables.includes('subjects') ? `
          IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'subjects'
          ) THEN
            CREATE TABLE public.subjects (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL UNIQUE,
              description TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
          END IF;
          ` : ''}
          
          ${missingTables.includes('topics') ? `
          IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'topics'
          ) THEN
            CREATE TABLE public.topics (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT NOT NULL,
              description TEXT,
              subject_id UUID REFERENCES public.subjects(id),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
          END IF;
          ` : ''}
          
          ${missingTables.includes('exams') ? `
          IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'exams'
          ) THEN
            CREATE TABLE public.exams (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              title TEXT NOT NULL,
              description TEXT,
              subject_id UUID REFERENCES public.subjects(id),
              topic_id UUID REFERENCES public.topics(id),
              class_level TEXT,
              exam_type TEXT,
              max_marks INTEGER DEFAULT 100,
              passing_marks INTEGER DEFAULT 40,
              duration_minutes INTEGER DEFAULT 60,
              created_by UUID NOT NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
          END IF;
          ` : ''}
          
          ${missingTables.includes('exam_results') ? `
          IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results'
          ) THEN
            CREATE TABLE public.exam_results (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              exam_id UUID REFERENCES public.exams(id),
              student_id UUID NOT NULL,
              examiner_id UUID NOT NULL,
              score INTEGER,
              percentage DECIMAL,
              passing_status TEXT CHECK (passing_status IN ('PASS', 'FAIL')),
              status TEXT DEFAULT 'PENDING',
              feedback TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
          END IF;
          ` : ''}
          
          ${missingTables.includes('timetables') ? `
          IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'timetables'
          ) THEN
            CREATE TABLE public.timetables (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              day_of_week TEXT NOT NULL,
              start_time TIME NOT NULL,
              end_time TIME NOT NULL,
              subject_id UUID REFERENCES public.subjects(id),
              teacher_id UUID NOT NULL,
              class_id TEXT,
              room_number TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            );
          END IF;
          ` : ''}
        END
        $$;
      `;
      
      // @ts-ignore - RPC function is defined in SQL
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_query: createTablesSQL 
      });
      
      if (!error) {
        return { 
          success: true, 
          message: `Successfully created missing tables: ${missingTables.join(', ')}` 
        };
      }
      
      throw new Error(`SQL execution error: ${error.message}`);
    } catch (rpcError: any) {
      return { 
        success: false, 
        message: `Could not create tables automatically. Please run the SQL script manually in the Supabase dashboard. Error: ${rpcError.message}` 
      };
    }
  } catch (e: any) {
    return { 
      success: false, 
      message: `Unexpected error: ${e.message}. Please contact the administrator.` 
    };
  }
};
