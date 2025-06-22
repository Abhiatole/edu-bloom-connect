import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const ExamTablesSetup = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const { toast } = useToast();

  const setupExamTables = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setLog([]);

    try {
      // Fetch the SQL script from the public folder
      const response = await fetch('/CREATE_EXAM_TABLES.sql');
      if (!response.ok) {
        throw new Error(`Failed to fetch SQL script: ${response.status} ${response.statusText}`);
      }
      
      const sqlScript = await response.text();
      
      // Log the process
      addLog('Fetched SQL script successfully');
      addLog('Executing script on database...');
      
      // Execute the SQL script
      const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: sqlScript });
      
      if (rpcError) {
        throw new Error(`Failed to execute SQL script: ${rpcError.message}`);
      }
      
      addLog('SQL script executed successfully');
      addLog('Verifying tables...');
      
      // Verify tables exist
      const tablesToCheck = ['subjects', 'topics', 'exams', 'exam_results'];
      for (const table of tablesToCheck) {
        const { error: tableError } = await supabase.from(table).select('count(*)', { count: 'exact', head: true });
        if (tableError) {
          addLog(`❌ Table '${table}' verification failed: ${tableError.message}`);
        } else {
          addLog(`✅ Table '${table}' exists and is accessible`);
        }
      }
      
      addLog('Setup completed');
      setSuccess(true);
      
      toast({
        title: "Success",
        description: "Exam tables have been set up successfully.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      addLog(`❌ Error: ${errorMessage}`);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Exam Tables Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          If you're experiencing issues with the exam management system, this utility will set up
          all required database tables and relationships.
        </p>
        
        {log.length > 0 && (
          <Textarea
            value={log.join('\n')}
            readOnly
            className="font-mono text-xs h-32 mb-4"
          />
        )}
        
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <Button 
            onClick={setupExamTables} 
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Setting Up Tables..." : "Setup Exam Tables"}
          </Button>
          
          {success && (
            <div className="flex items-center text-sm text-green-600 gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>Setup completed successfully</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center text-sm text-red-600 gap-1">
              <XCircle className="h-4 w-4" />
              <span>Error: {error}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamTablesSetup;
