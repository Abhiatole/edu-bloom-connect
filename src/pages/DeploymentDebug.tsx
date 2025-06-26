import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SupabaseConnectionTest from '@/components/debug/SupabaseConnectionTest';
import { Settings, Database, Key, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
const DeploymentDebug = () => {
  const [connectionStatus, setConnectionStatus] = React.useState<boolean | null>(null);
  const environmentInfo = {
    nodeEnv: import.meta.env.MODE,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    supabaseKeyPreview: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    buildTime: new Date().toISOString(),
    currentUrl: window.location.origin
  };
  const deploymentChecklist = [
    {
      item: 'Environment Variables Set',
      status: environmentInfo.hasSupabaseKey ? 'success' : 'error',
      description: 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in Netlify'
    },
    {
      item: 'Supabase Connection',
      status: connectionStatus === true ? 'success' : connectionStatus === false ? 'error' : 'pending',
      description: 'Can successfully connect to Supabase database'
    },
    {
      item: 'Correct Domain',
      status: window.location.hostname === 'edugrowhub.netlify.app' ? 'success' : 'warning',
      description: 'Should be accessed via the correct domain'
    },
    {
      item: 'HTTPS Enabled',
      status: window.location.protocol === 'https:' ? 'success' : 'error',
      description: 'Site should be served over HTTPS'
    }
  ];
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Settings className="h-4 w-4 text-gray-400" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Deployment Debug Dashboard
          </h1>
          <p className="text-gray-600">
            Troubleshoot your Netlify deployment issues
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Environment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Environment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Environment:</div>
                <Badge variant="outline">{environmentInfo.nodeEnv}</Badge>
                
                <div className="font-medium">Current URL:</div>
                <div className="font-mono text-xs">{environmentInfo.currentUrl}</div>
                
                <div className="font-medium">Supabase URL:</div>
                <div className="font-mono text-xs break-all">
                  {environmentInfo.supabaseUrl || 'Not set'}
                </div>
                
                <div className="font-medium">API Key:</div>
                <div className={`font-mono text-xs ${environmentInfo.hasSupabaseKey ? 'text-green-600' : 'text-red-600'}`}>
                  {environmentInfo.hasSupabaseKey ? environmentInfo.supabaseKeyPreview : 'Not set'}
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Deployment Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Deployment Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deploymentChecklist.map((check, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg border">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{check.item}</div>
                    <div className="text-xs text-gray-600">{check.description}</div>
                  </div>
                  <Badge className={getStatusColor(check.status)}>
                    {check.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        {/* Connection Test */}
        <SupabaseConnectionTest onConnectionStatus={setConnectionStatus} />
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Fix "Invalid API Key" Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertDescription>
                <strong>To fix the API key error on Netlify:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Go to your Netlify dashboard</li>
                  <li>Navigate to Site settings → Environment variables</li>
                  <li>Add these variables:</li>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code>VITE_SUPABASE_URL</code> = https://pgwgtronuluhwuiaqkcc.supabase.co</li>
                    <li><code>VITE_SUPABASE_ANON_KEY</code> = your_anon_key_here</li>
                  </ul>
                  <li>Redeploy your site</li>
                </ol>
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.open('https://app.netlify.com/', '_blank')}
                variant="outline"
              >
                Open Netlify Dashboard
              </Button>
              <Button 
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                variant="outline"
              >
                Open Supabase Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default DeploymentDebug;
