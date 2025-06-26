import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Mail, User, Shield } from 'lucide-react';
interface TestResult {
  step: string;
  status: 'success' | 'error' | 'pending' | 'info';
  message: string;
  data?: any;
}
const TeacherFlowTest = () => {
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('testteacher123');
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };
  const runCompleteTest = async () => {
    if (!testEmail) {
      addResult({
        step: 'Validation',
        status: 'error',
        message: 'Please enter a test email address'
      });
      return;
    }
    setIsRunning(true);
    setResults([]);
    try {
      // Step 1: Check if email confirmation is enabled
      addResult({
        step: 'Step 1: Check Email Settings',
        status: 'info',
        message: 'Checking if email confirmation is enabled...'
      });
      // Step 2: Register a test teacher
      addResult({
        step: 'Step 2: Teacher Registration',
        status: 'info',
        message: 'Attempting to register test teacher...'
      });
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            role: 'teacher',
            full_name: 'Test Teacher',
            subject_expertise: 'Mathematics',
            experience_years: 5
          }
        }
      });
      if (signUpError) {
        addResult({
          step: 'Step 2: Teacher Registration',
          status: 'error',
          message: `Registration failed: ${signUpError.message}`
        });
        return;
      }
      if (!signUpData.user) {
        addResult({
          step: 'Step 2: Teacher Registration',
          status: 'error',
          message: 'No user data returned from registration'
        });
        return;
      }
      const needsConfirmation = !signUpData.user.email_confirmed_at && !signUpData.session;
      addResult({
        step: 'Step 2: Teacher Registration',
        status: 'success',
        message: `Teacher registered successfully. Email confirmation ${needsConfirmation ? 'required' : 'not required'}.`,
        data: {
          userId: signUpData.user.id,
          emailConfirmed: !!signUpData.user.email_confirmed_at,
          hasSession: !!signUpData.session
        }
      });
      // Step 3: Check if profile was created
      addResult({
        step: 'Step 3: Profile Creation',
        status: 'info',
        message: 'Checking if teacher profile was created...'
      });
      // Wait a moment for potential triggers
      await new Promise(resolve => setTimeout(resolve, 2000));
      const { data: profileData, error: profileError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', signUpData.user.id)
        .single();
      if (profileError || !profileData) {
        // Try to create profile manually
        const { error: createError } = await supabase
          .from('teacher_profiles')
          .insert({
            user_id: signUpData.user.id,
            full_name: 'Test Teacher',
            email: testEmail,
            subject_expertise: 'Mathematics',
            experience_years: 5,
            status: 'PENDING'
          });
        if (createError) {
          addResult({
            step: 'Step 3: Profile Creation',
            status: 'error',
            message: `Profile creation failed: ${createError.message}`
          });
        } else {
          addResult({
            step: 'Step 3: Profile Creation',
            status: 'success',
            message: 'Teacher profile created manually (no auto-trigger)'
          });
        }
      } else {
        addResult({
          step: 'Step 3: Profile Creation',
          status: 'success',
          message: 'Teacher profile found/created successfully',
          data: profileData
        });
      }
      // Step 4: Test login flow
      if (!needsConfirmation) {
        addResult({
          step: 'Step 4: Login Test',
          status: 'info',
          message: 'Testing login flow...'
        });
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword
        });
        if (loginError) {
          addResult({
            step: 'Step 4: Login Test',
            status: 'error',
            message: `Login failed: ${loginError.message}`
          });
        } else {
          addResult({
            step: 'Step 4: Login Test',
            status: 'success',
            message: 'Login successful! Teacher can authenticate.'
          });
          // Check profile status
          const { data: profileCheck } = await supabase
            .from('teacher_profiles')
            .select('status, full_name')
            .eq('user_id', loginData.user.id)
            .single();
          if (profileCheck) {
            addResult({
              step: 'Step 5: Profile Status',
              status: profileCheck.status === 'APPROVED' ? 'success' : 'info',
              message: `Profile status: ${profileCheck.status}. ${profileCheck.status === 'PENDING' ? 'Awaiting admin approval.' : 'Ready to use dashboard.'}`
            });
          }
        }
      } else {
        addResult({
          step: 'Step 4: Email Confirmation Required',
          status: 'info',
          message: 'Email confirmation is enabled. Teacher would need to confirm email before login.'
        });
      }
      // Cleanup - remove test user
      addResult({
        step: 'Cleanup',
        status: 'info',
        message: 'Cleaning up test data...'
      });
      // Sign out and try to delete the test user (this might not work due to RLS)
      await supabase.auth.signOut();
    } catch (error: any) {
      addResult({
        step: 'Error',
        status: 'error',
        message: `Test failed: ${error.message}`
      });
    } finally {
      setIsRunning(false);
    }
  };
  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Mail className="h-4 w-4 text-blue-600" />;
    }
  };
  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Teacher Registration & Login Flow Test
            </CardTitle>
            <CardDescription>
              Complete end-to-end test of teacher registration, email confirmation, and login process.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Test Email</label>
                <Input
                  type="email"
                  placeholder="test-teacher@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Test Password</label>
                <Input
                  type="text"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              onClick={runCompleteTest}
              disabled={isRunning || !testEmail}
              className="w-full"
            >
              {isRunning ? 'Running Test...' : 'Run Complete Teacher Flow Test'}
            </Button>
          </CardContent>
        </Card>
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{result.step}</span>
                          <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                            {result.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700">{result.message}</p>
                        {result.data && (
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>What this test checks:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Teacher registration process works without errors</li>
              <li>Email confirmation settings (enabled/disabled)</li>
              <li>Teacher profile creation (automatic or manual)</li>
              <li>Login flow after registration</li>
              <li>Profile approval status handling</li>
              <li>Proper error messages and user feedback</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
export default TeacherFlowTest;
