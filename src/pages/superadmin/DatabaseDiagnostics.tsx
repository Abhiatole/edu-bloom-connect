import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle, DatabaseIcon, ShieldAlert, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const DatabaseDiagnostics = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [executing, setExecuting] = useState(false);
  const [sqlResult, setSqlResult] = useState<any>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      // Test student_profiles access
      const studentTest = await testTableAccess('student_profiles');
      
      // Test teacher_profiles access
      const teacherTest = await testTableAccess('teacher_profiles');
      
      // Test user_profiles access
      const userTest = await testTableAccess('user_profiles');
      
      // Get RLS status
      const rlsStatus = await getRLSStatus();
      
      setResults({
        student_profiles: studentTest,
        teacher_profiles: teacherTest,
        user_profiles: userTest,
        rls_status: rlsStatus
      });

      toast({
        title: "Diagnostics Complete",
        description: "Database access diagnostics completed"
      });
    } catch (error: any) {
      console.error('Diagnostics error:', error);
      toast({
        title: "Diagnostics Failed",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const testTableAccess = async (tableName: string) => {
    try {
      // Try to count rows
      let countResult;
      let dataResult;
      
      if (tableName === 'student_profiles') {
        countResult = await supabase
          .from('student_profiles')
          .select('*', { count: 'exact', head: true });
        
        dataResult = await supabase
          .from('student_profiles')
          .select('*')
          .limit(1);
      } else if (tableName === 'teacher_profiles') {
        countResult = await supabase
          .from('teacher_profiles')
          .select('*', { count: 'exact', head: true });
        
        dataResult = await supabase
          .from('teacher_profiles')
          .select('*')
          .limit(1);
      } else if (tableName === 'user_profiles') {
        countResult = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });
        
        dataResult = await supabase
          .from('user_profiles')
          .select('*')
          .limit(1);
      } else {
        throw new Error(`Unknown table: ${tableName}`);
      }
      
      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;
      
      return {
        success: true,
        count: countResult.count || 0,
        sample: dataResult.data && dataResult.data.length > 0 ? dataResult.data[0] : null,
        error: null
      };
    } catch (error: any) {
      return {
        success: false,
        count: null,
        sample: null,
        error: error.message || 'Unknown error'
      };
    }
  };

  const getRLSStatus = async () => {
    try {
      // Unfortunately we can't directly query RLS status through the Supabase JS client
      // But we can infer it from our access attempts
      return {
        message: "RLS status inferred from table access tests"
      };
    } catch (error: any) {
      return {
        error: error.message || 'Could not determine RLS status'
      };
    }
  };  const executeRLSFix = async () => {
    setExecuting(true);
    try {
      // We can't directly execute the SQL script through the client
      // Instead, display instructions for the admin to run the script manually
      setSqlResult({
        message: "Please run the EMERGENCY_RLS_FIX.sql script in the Supabase SQL Editor to disable RLS temporarily."
      });
      
      toast({
        title: "RLS Fix Instructions",
        description: "Please follow the displayed instructions to fix RLS issues.",
      });
      
      // Re-run diagnostics after a short delay to see if the admin has fixed the issue
      setTimeout(() => {
        runDiagnostics();
      }, 5000);
    } catch (error: any) {
      console.error('RLS fix error:', error);
      setSqlResult({ error: error.message || 'Failed to generate RLS fix instructions' });
      
      toast({
        title: "Error",
        description: error.message || "Could not generate RLS fix instructions",
        variant: "destructive"
      });
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="container p-4 mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            Database Access Diagnostics
          </CardTitle>
          <CardDescription>
            Diagnose and fix issues with database access and Row Level Security
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={runDiagnostics} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Run Diagnostics
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={executeRLSFix} 
              disabled={executing || loading}
            >
              {executing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldAlert className="h-4 w-4 mr-2" />}              Emergency RLS Fix
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.open('/RLS_REACTIVATION.sql', '_blank')}
            >
              <Shield className="h-4 w-4 mr-2" />
              RLS Reactivation Script
            </Button>
          </div>

          {results && (
            <Tabs defaultValue="student">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="student">Student Profiles</TabsTrigger>
                <TabsTrigger value="teacher">Teacher Profiles</TabsTrigger>
                <TabsTrigger value="user">User Profiles</TabsTrigger>
              </TabsList>
              
              <TabsContent value="student" className="p-4 border rounded-md">
                <TableDiagnostics 
                  title="Student Profiles"
                  result={results.student_profiles}
                />
              </TabsContent>
              
              <TabsContent value="teacher" className="p-4 border rounded-md">
                <TableDiagnostics 
                  title="Teacher Profiles"
                  result={results.teacher_profiles}
                />
              </TabsContent>
              
              <TabsContent value="user" className="p-4 border rounded-md">
                <TableDiagnostics 
                  title="User Profiles"
                  result={results.user_profiles}
                />
              </TabsContent>          </Tabs>
          )}

          {sqlResult && (
            <Card className="mt-4 border-red-300 bg-red-50 dark:bg-red-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency RLS Fix Required
                </CardTitle>
              </CardHeader>
              <CardContent>                <p className="text-sm mb-4">
                  Please run the following script in your Supabase SQL Editor to disable RLS temporarily:
                </p>
                <div className="bg-zinc-950 text-zinc-50 p-4 rounded-md overflow-auto text-xs font-mono">
                  <pre>
{`-- EMERGENCY RLS FIX - EXECUTE THIS IN SUPABASE SQL EDITOR
-- This script temporarily disables RLS to fix the issues with profile queries

-- STEP 1: TEMPORARILY DISABLE RLS ON ALL PROFILE TABLES
ALTER TABLE IF EXISTS student_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: DROP ALL EXISTING POLICIES
-- Drop all student profiles policies, teacher profiles policies, and user profiles policies

-- STEP 3: VERIFY RLS IS DISABLED
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('student_profiles', 'teacher_profiles', 'user_profiles')
  AND schemaname = 'public';
`}
                  </pre>
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => window.open('/EMERGENCY_RLS_FIX.sql', '_blank')}>
                    Download Complete SQL Script
                  </Button>
                </div>
                <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/20 rounded-md">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    If you're seeing "Action Failed: Database policies prevent this action" messages, it means RLS policies are still active.
                    Follow these steps:
                  </p>
                  <ol className="mt-2 text-sm text-amber-700 dark:text-amber-400 pl-5 list-decimal">
                    <li>Copy the script above</li>
                    <li>Go to the Supabase dashboard</li>
                    <li>Open the SQL Editor</li>
                    <li>Paste and run the script</li>
                    <li>Return to the application and try again</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              RLS Status & Fix Results
            </h3>
            
            {sqlResult && (
              <div className="p-4 bg-slate-50 rounded-md overflow-auto max-h-48">
                <pre className="text-xs">
                  {JSON.stringify(sqlResult, null, 2)}
                </pre>
              </div>
            )}
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-amber-800 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Important Note
              </p>
              <p className="text-sm mt-1 text-amber-700">
                The Emergency RLS Fix temporarily disables Row Level Security for diagnostic purposes. 
                This should only be used during development or when troubleshooting access issues. 
                Always re-enable proper RLS policies before deploying to production.
              </p>
              <p className="text-sm mt-2 text-amber-700">
                To fully fix RLS issues, please run the EMERGENCY_RLS_FIX.sql script in the Supabase SQL Editor.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TableDiagnostics = ({ title, result }: { title: string; result: any }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {result.success ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-red-500" />
        )}
        {title}
      </h3>
      
      {result.success ? (
        <div className="space-y-2">
          <p className="text-green-600 font-medium">✓ Table is accessible</p>
          <p>Row count: {result.count}</p>
          
          {result.sample && (
            <div>
              <p className="font-medium">Sample data:</p>
              <pre className="p-2 bg-gray-50 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(result.sample, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-red-600 font-medium">✗ Table access error</p>
          <p className="text-red-500">{result.error}</p>
        </div>
      )}
    </div>
  );
};

export default DatabaseDiagnostics;
