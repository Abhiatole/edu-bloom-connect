import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Mail, CheckCircle, XCircle } from 'lucide-react';

const AuthTest = () => {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testAuthSettings = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Test user creation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123456',
        options: {
          data: {
            role: 'test',
            full_name: 'Test User'
          }
        }
      });

      const testResult = {
        success: !authError,
        error: authError?.message,
        hasSession: !!authData.session,
        hasUser: !!authData.user,
        userConfirmed: authData.user?.email_confirmed_at,
        needsConfirmation: !authData.session && !authData.user?.email_confirmed_at,
        userData: authData.user ? {
          id: authData.user.id,
          email: authData.user.email,
          confirmed_at: authData.user.email_confirmed_at,
          created_at: authData.user.created_at
        } : null
      };

      setResult(testResult);

      if (authError) {
        toast({
          title: "Test Failed",
          description: authError.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Test Completed",
          description: authData.session ? "Email confirmation is disabled" : "Email confirmation is enabled",
        });
      }

    } catch (error: any) {
      console.error('Test error:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Settings className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Auth Configuration Test
          </CardTitle>
          <p className="text-gray-600">
            Test your Supabase email confirmation settings
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="testEmail">Test Email</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter a test email address"
                className="mt-1"
              />
            </div>

            <Button 
              onClick={testAuthSettings}
              disabled={loading || !testEmail}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Auth Settings'}
            </Button>
          </div>

          {result && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center mb-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <span className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                
                {result.error && (
                  <p className="text-sm text-red-700 mb-2">
                    <strong>Error:</strong> {result.error}
                  </p>
                )}

                {result.success && (
                  <div className="space-y-2 text-sm">
                    <div className={`p-2 rounded ${result.hasSession ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      <strong>Email Confirmation:</strong> {result.hasSession ? 'Disabled' : 'Enabled'}
                    </div>
                    
                    <div>
                      <strong>Has User:</strong> {result.hasUser ? 'Yes' : 'No'}
                    </div>
                    
                    <div>
                      <strong>Has Session:</strong> {result.hasSession ? 'Yes' : 'No'}
                    </div>
                    
                    <div>
                      <strong>Needs Email Confirmation:</strong> {result.needsConfirmation ? 'Yes' : 'No'}
                    </div>

                    {result.needsConfirmation && (
                      <div className="p-2 bg-blue-100 rounded">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-blue-600 mr-1" />
                          <span className="text-blue-800 text-xs">Check your email for confirmation link</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {result.userData && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">User Data:</h4>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result.userData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-gray-500">
              This test will create a temporary user account to check your auth settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthTest;
