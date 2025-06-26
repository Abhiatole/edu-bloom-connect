import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseRaw, checkTableExists, getTablesList } from '@/utils/database-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Database, Download, RefreshCw, Table } from 'lucide-react';
import MissingTablesAlert from './MissingTablesAlert';
/**
 * Table Status - displays status of specific tables we care about
 */
const TableStatus = ({ tables }: { tables: Record<string, boolean> }) => {
  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(tables).map(([tableName, exists]) => (
        <div key={tableName} className="flex items-center gap-2 p-2 border rounded-md">
          {exists ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
          <span className="font-mono text-sm">{tableName}</span>
          <Badge variant={exists ? "outline" : "secondary"} className="ml-auto">
            {exists ? "EXISTS" : "MISSING"}
          </Badge>
        </div>
      ))}
    </div>
  );
};
const SchemaChecker = () => {
  const [loading, setLoading] = useState(true);
  const [tableStatus, setTableStatus] = useState<Record<string, boolean>>({});
  const [allTables, setAllTables] = useState<string[]>([]);
  const [missingTables, setMissingTables] = useState<string[]>([]);
  
  // Required tables for core app functionality
  const requiredTables = [
    'teacher_profiles',
    'student_profiles',
    'admin_profiles',
    'exams',
    'subjects',
    'topics',
    'exam_results'
  ];
  
  const checkSchema = async () => {
    setLoading(true);
    
    try {
      // Check specific tables we care about
      const tableChecks = {};
      const missing = [];
      
      for (const table of requiredTables) {
        const exists = await checkTableExists(table);
        tableChecks[table] = exists;
        
        if (!exists) {
          missing.push(table);
        }
      }
      
      setTableStatus(tableChecks);
      setMissingTables(missing);
      
      // Get all tables
      const tables = await getTablesList();
      setAllTables(tables);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    checkSchema();
  }, []);
  
  const handleTablesCreated = () => {
    // Refresh the schema check after tables are created
    setTimeout(() => {
      checkSchema();
    }, 1000); // Small delay to allow database to update
  };
  
  return (
    <div className="space-y-6">
      {missingTables.length > 0 && (
        <MissingTablesAlert 
          missingTables={missingTables} 
          onTablesCreated={handleTablesCreated} 
        />
      )}
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Schema Status
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkSchema} 
              disabled={loading}
              className="h-8"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>
            Check the status of required database tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <TableStatus tables={tableStatus} />
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <Table className="h-5 w-5" />
            Missing Tables Fix
          </CardTitle>
          <CardDescription>
            Download SQL scripts to create missing tables
          </CardDescription>
        </CardHeader>        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you're missing tables, you can use our database fix utility to create them, or download the SQL scripts to run in your Supabase dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="default"
              onClick={() => window.location.href = '/database-fix'}
              className="text-sm"
            >
              <Database className="h-4 w-4 mr-2" />
              Database Fix Utility
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open('/CREATE_EXAM_TABLES.sql', '_blank')}
              className="text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Exam Tables Script
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open('/EMERGENCY_RLS_FIX.sql', '_blank')}
              className="text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              RLS Fix Script
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2">
            <Database className="h-5 w-5" />
            All Database Tables
          </CardTitle>
          <CardDescription>
            List of all tables in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {allTables.length > 0 ? (
              allTables.map(table => (
                <div key={table} className="p-2 bg-muted/50 rounded font-mono text-xs">
                  {table}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground col-span-full text-center py-4">
                {loading ? 'Loading tables...' : 'No tables found in database'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default SchemaChecker;
