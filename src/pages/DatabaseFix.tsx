import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileCode, Database, Play, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Import SQL scripts as strings
const CREATE_EXAM_TABLES_SQL = `
-- Create subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create topics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.subjects(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create exams table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exams (
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

-- Create exam_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id),
    student_id UUID NOT NULL,
    examiner_id UUID NOT NULL,
    score INTEGER,
    percentage DECIMAL,
    passing_status TEXT CHECK (passing_status IN ('PASS', 'FAIL')),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);`;

const DatabaseFix = () => {
  const [activeTab, setActiveTab] = useState('exam-tables');
  const [sql, setSql] = useState(CREATE_EXAM_TABLES_SQL);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const executeSql = async () => {
    setExecuting(true);
    setResult(null);
    
    try {
      // Try to execute the SQL using our custom function
      // @ts-ignore - Types may not include our custom function
      const { data, error } = await supabase.rpc('execute_sql', { 
        sql_query: sql 
      });
      
      if (error) {
        console.error("Error executing SQL:", error);
        setResult({
          success: false,
          message: `Error: ${error.message}. You may need to run this SQL directly in the Supabase dashboard.`
        });
      } else {
        setResult({
          success: true,
          message: 'SQL executed successfully! Tables have been created.'
        });
      }
    } catch (error) {
      console.error("Exception executing SQL:", error);
      setResult({
        success: false,
        message: `Error: ${error.message}. You may need to run this SQL directly in the Supabase dashboard.`
      });
    } finally {
      setExecuting(false);
    }
  };

  const downloadSql = () => {
    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Fix Utility</h1>
      
      <p className="text-muted-foreground mb-6">
        This utility helps you create missing database tables that are required for the application to function properly.
        Select the tables you want to create, review the SQL, and click "Execute SQL" to create them directly in your database.
      </p>
      
      <Tabs defaultValue="exam-tables" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="exam-tables">Exam Tables</TabsTrigger>
          <TabsTrigger value="user-tables" disabled>User Profile Tables</TabsTrigger>
          <TabsTrigger value="custom-sql">Custom SQL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="exam-tables">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Create Exam Tables
              </CardTitle>
              <CardDescription>
                This will create the following tables if they don't exist: subjects, topics, exams, and exam_results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={sql} 
                onChange={(e) => setSql(e.target.value)} 
                className="font-mono text-sm h-64" 
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={downloadSql}>
                <Download className="h-4 w-4 mr-2" />
                Download SQL
              </Button>
              <Button onClick={executeSql} disabled={executing}>
                {executing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute SQL
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="custom-sql">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCode className="h-5 w-5" />
                Execute Custom SQL
              </CardTitle>
              <CardDescription>
                Enter custom SQL to execute. Only CREATE TABLE IF NOT EXISTS statements are allowed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>
                  For security reasons, only CREATE TABLE IF NOT EXISTS statements are allowed.
                  For other SQL operations, please use the Supabase dashboard.
                </AlertDescription>
              </Alert>
              
              <Textarea 
                value={sql} 
                onChange={(e) => setSql(e.target.value)} 
                placeholder="Enter CREATE TABLE IF NOT EXISTS statements here..."
                className="font-mono text-sm h-64" 
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={downloadSql}>
                <Download className="h-4 w-4 mr-2" />
                Download SQL
              </Button>
              <Button onClick={executeSql} disabled={executing}>
                {executing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Execute SQL
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {result && (
        <Alert className={`mt-6 ${result.success ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800'}`}>
          {result.success ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <AlertTitle className={result.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}>
            {result.success ? 'Success' : 'Error'}
          </AlertTitle>
          <AlertDescription className={result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
            {result.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DatabaseFix;
