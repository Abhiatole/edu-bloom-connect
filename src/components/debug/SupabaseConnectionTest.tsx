import React from 'react';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
interface SupabaseConnectionTestProps {
  onConnectionStatus?: (isConnected: boolean) => void;
}
export const SupabaseConnectionTest: React.FC<SupabaseConnectionTestProps> = ({ 
  onConnectionStatus 
}) => {
  const [status, setStatus] = React.useState<{
    isConnected: boolean;
    error: string | null;
    loading: boolean;
    supabaseUrl: string;
    hasEnvironmentVars: boolean;
  }>({
    isConnected: false,
    error: null,
    loading: true,
    supabaseUrl: '',
    hasEnvironmentVars: false
  });
  const testConnection = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Check environment variables
      const hasEnvVars = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
      const currentUrl = import.meta.env.VITE_SUPABASE_URL || "https://pgwgtronuluhwuiaqkcc.supabase.co";
      
      // Test basic connection
      const { data, error } = await supabase.from('student_profiles').select('count').limit(1);
      
      if (error) {
        throw error;
      }
      
      setStatus({
        isConnected: true,
        error: null,
        loading: false,
        supabaseUrl: currentUrl,
        hasEnvironmentVars: hasEnvVars
      });
      
      onConnectionStatus?.(true);
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      setStatus({
        isConnected: false,
        error: errorMessage,
        loading: false,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "https://pgwgtronuluhwuiaqkcc.supabase.co",
        hasEnvironmentVars: !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
      });
      
      onConnectionStatus?.(false);
    }
  };
  useEffect(() => {
    testConnection();
  }, []);
  if (status.loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Testing Connection...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status.isConnected ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              Connection OK
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Connection Failed
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div>
            <strong>Supabase URL:</strong> 
            <div className="font-mono text-xs bg-gray-100 p-1 rounded">
              {status.supabaseUrl}
            </div>
          </div>
          <div>
            <strong>Environment Variables:</strong> 
            <span className={status.hasEnvironmentVars ? 'text-green-600' : 'text-orange-600'}>
              {status.hasEnvironmentVars ? ' ✓ Configured' : ' ⚠ Using fallback values'}
            </span>
          </div>
        </div>
        {status.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {status.error}
              {status.error.includes('Invalid API key') && (
                <div className="mt-2">
                  <strong>Solution:</strong> Check your Supabase API keys in environment variables.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        {!status.hasEnvironmentVars && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Environment variables not detected. Make sure to set:
              <ul className="list-disc list-inside mt-1">
                <li>VITE_SUPABASE_URL</li>
                <li>VITE_SUPABASE_ANON_KEY</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
        <Button 
          onClick={testConnection} 
          disabled={status.loading}
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Test Again
        </Button>
      </CardContent>
    </Card>
  );
};
export default SupabaseConnectionTest;
