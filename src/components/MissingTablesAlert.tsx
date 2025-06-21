import { useState } from 'react';
import { AlertTriangle, Loader2, Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Import our SQL script content - this will be executed when creating tables
// This is simplified and avoids using functions to prevent naming conflicts
const CREATE_EXAM_TABLES_SQL = `
-- Simplified approach that avoids creating helper functions
DO $$
BEGIN
  -- Create basic exam tables if they don't exist
  
  -- Check if subjects table exists
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

  -- Check if topics table exists
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

  -- Check if exams table exists
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

  -- Check if exam_results table exists
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
END
$$;

  IF NOT public.table_exists('topics') THEN
    CREATE TABLE public.topics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      subject_id UUID REFERENCES public.subjects(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;

  IF NOT public.table_exists('exams') THEN
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

  IF NOT public.table_exists('exam_results') THEN
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

  -- Grant access to the function
  GRANT EXECUTE ON FUNCTION public.table_exists TO authenticated;
  GRANT EXECUTE ON FUNCTION public.table_exists TO anon;
END
$$;
`;

interface MissingTablesAlertProps {
  missingTables: string[];
  onTablesCreated?: () => void;
}

const MissingTablesAlert = ({ missingTables, onTablesCreated }: MissingTablesAlertProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);
  
  if (missingTables.length === 0) return null;  const handleCreateTables = async () => {
    setIsCreating(true);
    setResult(null);
    
    try {
      // Try using the 'table_exists' RPC function first to see if it's available
      try {
        // @ts-ignore - Direct RPC call to check if our function is available
        const { data, error } = await supabase.rpc('table_exists', { table_name: 'exams' });
        if (!error) {
          console.log("RPC function table_exists is available:", data);
        }
      } catch (rpcError) {
        console.warn("RPC function not available, will create it:", rpcError);
      }
      
      // First try direct execution using supabase.rpc method
      try {
        // @ts-ignore - Ignoring type check as we're directly accessing supabase internals
        const { error: sqlError } = await supabase.rpc('execute_sql', { 
          sql_query: CREATE_EXAM_TABLES_SQL 
        });
        
        if (sqlError) {
          throw sqlError;
        } else {
          setResult({ 
            success: true, 
            message: 'Tables created successfully! Please refresh the page.' 
          });
          
          // Notify parent component
          if (onTablesCreated) onTablesCreated();
          return;
        }
      } catch (execError) {
        console.warn("SQL execution via RPC failed, trying alternative approach:", execError);
      }        // Fallback: If direct execution fails, use the REST API to run raw SQL
      try {
        // Use the Supabase URL from environment
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://pgwgtronuluhwuiaqkcc.supabase.co";
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
        
        // This approach may still fail due to permissions
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({
            sql_query: CREATE_EXAM_TABLES_SQL
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`REST API error: ${JSON.stringify(errorData)}`);
        }
        
        setResult({ 
          success: true, 
          message: 'Tables created successfully! Please refresh the page.' 
        });
        
        // Notify parent component
        if (onTablesCreated) onTablesCreated();
      } catch (restError) {
        console.error("REST API approach failed:", restError);
        setResult({ 
          success: false, 
          message: `Could not create tables automatically. Please run the SQL script manually in the Supabase dashboard.
          Error: ${restError.message}` 
        });
      }
    } catch (error) {
      console.error("Exception creating tables:", error);
      setResult({ 
        success: false, 
        message: `Error executing SQL: ${error.message}. Please run the SQL script manually in the Supabase dashboard.` 
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-medium text-lg">Missing Database Tables Detected</h3>
            <p className="text-sm text-muted-foreground">
              Some required database tables are missing from the system. The following features may not work properly:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-amber-700 dark:text-amber-400">
              {missingTables.includes('exams') && (
                <li>Exam creation and management (missing <code>exams</code> table)</li>
              )}
              {missingTables.includes('topics') && (
                <li>Topic organization for exams (missing <code>topics</code> table)</li>
              )}
              {missingTables.includes('subjects') && (
                <li>Subject classification (missing <code>subjects</code> table)</li>
              )}              {missingTables.includes('exam_results') && (
                <li>Exam results and analytics (missing <code>exam_results</code> table) - <a href="/fix-exam-results" className="text-blue-600 dark:text-blue-400 underline">Fix this issue</a></li>
              )}
            </ul>
            
            {result && (
              <Alert className={result.success ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" : "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"}>
                <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
              <div className="pt-2 flex gap-2">
              {missingTables.includes('exam_results') ? (
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => window.location.href = '/fix-exam-results'}
                  className="flex items-center gap-2"
                >
                  <Database className="h-4 w-4" />
                  Fix Exam Results Table
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={handleCreateTables}
                  disabled={isCreating || result?.success}
                  className="flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Tables...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Create Missing Tables
                    </>
                  )}
                </Button>
              )}
              
              <Button size="sm" variant="outline" className="bg-white dark:bg-amber-900/40">
                Contact Administrator
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MissingTablesAlert;
