import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// This component helps diagnose 500 Internal Server Errors
// by checking each API endpoint that might be failing
const DashboardErrorDiagnostic = () => {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  const runDiagnostics = async () => {
    setLoading(true);
    setResults({});
    const diagnosticResults: Record<string, any> = {};
    try {
      // Test 1: Authentication check
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        diagnosticResults.auth = {
          success: !userError,
          data: userData?.user ? { id: userData.user.id, email: userData.user.email } : null,
          error: userError ? userError.message : null
        };
      } catch (e: any) {
        diagnosticResults.auth = {
          success: false,
          error: e.message || 'Unknown error checking authentication'
        };
      }
      // Test 2: RPC function tests
      try {
        // @ts-ignore - RPC function defined in SQL
        const { data: tableExistsData, error: tableExistsError } = await supabase.rpc('table_exists', { 
          p_table_name: 'teacher_profiles' 
        });
        
        diagnosticResults.tableExistsRPC = {
          success: !tableExistsError,
          data: tableExistsData,
          error: tableExistsError ? tableExistsError.message : null
        };
      } catch (e: any) {
        diagnosticResults.tableExistsRPC = {
          success: false,
          error: e.message || 'Unknown error checking table_exists RPC'
        };
      }
      try {
        // @ts-ignore - RPC function defined in SQL
        const { data: columnExistsData, error: columnExistsError } = await supabase.rpc('column_exists', { 
          p_table_name: 'teacher_profiles',
          p_column_name: 'user_id'
        });
        
        diagnosticResults.columnExistsRPC = {
          success: !columnExistsError,
          data: columnExistsData,
          error: columnExistsError ? columnExistsError.message : null
        };
      } catch (e: any) {
        diagnosticResults.columnExistsRPC = {
          success: false,
          error: e.message || 'Unknown error checking column_exists RPC'
        };
      }
      // Test 3: Table query tests
      try {
        const { data: teacherData, error: teacherError } = await supabase
          .from('teacher_profiles')
          .select('*', { count: 'exact', head: true });
          
        diagnosticResults.teacherProfilesTable = {
          success: !teacherError,
          count: teacherData,
          error: teacherError ? teacherError.message : null
        };
      } catch (e: any) {
        diagnosticResults.teacherProfilesTable = {
          success: false,
          error: e.message || 'Unknown error querying teacher_profiles'
        };
      }
      // Test 4: Student profiles access
      try {
        const { data: studentData, error: studentError } = await supabase
          .from('student_profiles')
          .select('*', { count: 'exact', head: true });
          
        diagnosticResults.studentProfilesTable = {
          success: !studentError,
          count: studentData,
          error: studentError ? studentError.message : null
        };
      } catch (e: any) {
        diagnosticResults.studentProfilesTable = {
          success: false,
          error: e.message || 'Unknown error querying student_profiles'
        };
      }
      // Test 5: Exam results access
      try {
        const { data: examResultsData, error: examResultsError } = await supabase
          .from('exam_results')
          .select('*', { count: 'exact', head: true });
          
        diagnosticResults.examResultsTable = {
          success: !examResultsError,
          count: examResultsData,
          error: examResultsError ? examResultsError.message : null
        };
      } catch (e: any) {
        diagnosticResults.examResultsTable = {
          success: false,
          error: e.message || 'Unknown error querying exam_results'
        };
      }
      // Update state with all results
      setResults(diagnosticResults);
      
      // Check for critical errors
      const criticalErrors = Object.values(diagnosticResults).filter(
        (result: any) => !result.success
      );
      
      if (criticalErrors.length > 0) {
        toast({
          title: "Diagnostic Complete - Issues Found",
          description: `Found ${criticalErrors.length} issues that may be causing the 500 error`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Diagnostic Complete",
          description: "All API endpoints are working correctly",
          variant: "default"
        });
      }
    } catch (error: any) {
      toast({
        title: "Diagnostic Failed",
        description: error.message || "An unknown error occurred during diagnostics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/10 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-lg">
          <AlertTriangle className="h-5 w-5" />
          Dashboard Error Diagnostic Tool
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
          This tool can help diagnose 500 Internal Server Errors in the dashboard by testing each API endpoint that might be failing.
        </p>
        
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={runDiagnostics}
            disabled={loading}
            variant="outline"
            className="text-xs"
          >
            {loading ? 'Running Tests...' : 'Run Diagnostic Tests'}
          </Button>
          
          {Object.keys(results).length > 0 && (
            <Button 
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              className="text-xs"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          )}
        </div>
        
        {showDetails && Object.keys(results).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-md p-3 overflow-auto max-h-80 text-xs">
            <pre>{JSON.stringify(results, null, 2)}</pre>
          </div>
        )}
        
        {Object.keys(results).length > 0 && !showDetails && (
          <div className="space-y-2">
            {Object.entries(results).map(([test, result]: [string, any]) => (
              <div key={test} className={`p-2 rounded-md ${result.success ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                <span className="font-medium">{test}:</span> {result.success ? 'Passed' : `Failed - ${result.error}`}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default DashboardErrorDiagnostic;
