import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorDetector from '@/components/debug/ErrorDetector';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Code, Database, Bug, Loader2, RefreshCcw, AlertCircle } from 'lucide-react';

const WebDiagnosticsPage = () => {
  const { toast } = useToast();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM student_profiles LIMIT 5');

  const runDatabaseQuery = async () => {
    setLoading(true);
    setApiResponse(null);
    setApiError(null);

    try {
      const { data, error } = await supabase.rpc('run_diagnostic_query', {
        query_text: sqlQuery
      });

      if (error) {
        throw error;
      }

      setApiResponse(data);
      toast({
        title: 'Query Executed',
        description: 'Database query executed successfully',
      });
    } catch (error: any) {
      console.error('Database query error:', error);
      setApiError(error?.message || 'Failed to execute query');
      toast({
        variant: 'destructive',
        title: 'Query Error',
        description: error?.message || 'Failed to execute query',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStudentTable = async () => {
    setLoading(true);
    setApiResponse(null);
    setApiError(null);

    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('id, enrollment_no, full_name, display_name, first_name, last_name')
        .limit(10);

      if (error) {
        throw error;
      }

      setApiResponse(data);
      toast({
        title: 'Student Data',
        description: `Retrieved ${data?.length || 0} student records`,
      });
    } catch (error: any) {
      console.error('Student data error:', error);
      setApiError(error?.message || 'Failed to fetch student data');
      toast({
        variant: 'destructive',
        title: 'Data Error',
        description: error?.message || 'Failed to fetch student data',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Web App Diagnostics</h1>
      <p className="text-muted-foreground">Use this page to diagnose issues with the web application</p>

      <Tabs defaultValue="errors">
        <TabsList>
          <TabsTrigger value="errors">
            <Bug className="mr-2 h-4 w-4" />
            Error Detector
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="mr-2 h-4 w-4" />
            Data Explorer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bug className="mr-2 h-5 w-5" />
                JavaScript Error Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                This tool captures runtime JavaScript errors in the browser. 
                Navigate through your application with this page open to detect errors.
              </p>
              <ErrorDetector />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Database Data Explorer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={checkStudentTable} disabled={loading} className="md:col-span-1">
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 h-4 w-4" />
                  )}
                  Check Student Table
                </Button>
                <div className="md:col-span-1">
                  <Button 
                    onClick={runDatabaseQuery} 
                    disabled={loading}
                    variant="secondary"
                    className="w-full"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Code className="mr-2 h-4 w-4" />
                    )}
                    Execute Query
                  </Button>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="sql-query">SQL Query</Label>
                  <Input
                    id="sql-query"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Note: For security reasons, only SELECT queries are allowed</p>
                </div>
              </div>

              {apiError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Database Error</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}

              {apiResponse && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Response</h3>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="overflow-auto text-sm">
                      {JSON.stringify(apiResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebDiagnosticsPage;
