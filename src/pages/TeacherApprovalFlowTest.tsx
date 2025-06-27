import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Database, 
  User, 
  Users, 
  Eye,
  UserCheck,
  Shield,
  Loader2
} from 'lucide-react';

interface Teacher {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  subject_expertise: string;
  experience_years: number;
  status: string;
  approval_date: string | null;
  created_at: string;
}

interface DiagnosticResult {
  step: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: any;
}

const TeacherApprovalFlowTest: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [testResults, setTestResults] = useState<DiagnosticResult[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addResult = (result: DiagnosticResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Step 1: Check if user is admin
      addResult({
        step: 'Step 1: Admin Check',
        status: 'info',
        message: 'Checking admin permissions...'
      });

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        addResult({
          step: 'Step 1: Admin Check',
          status: 'error',
          message: 'Not authenticated. Please log in first.'
        });
        return;
      }

      // Step 2: Test admin function
      try {
        const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin');
        if (adminError) {
          addResult({
            step: 'Step 2: Admin Function Test',
            status: 'warning',
            message: `Admin function error: ${adminError.message}`
          });
        } else {
          addResult({
            step: 'Step 2: Admin Function Test',
            status: isAdminResult ? 'success' : 'warning',
            message: isAdminResult ? 'User has admin privileges' : 'User does not have admin privileges'
          });
        }
      } catch (e) {
        addResult({
          step: 'Step 2: Admin Function Test',
          status: 'warning',
          message: 'Admin function not found or not accessible'
        });
      }

      // Step 3: Check teacher_profiles table access
      addResult({
        step: 'Step 3: Database Access Test',
        status: 'info',
        message: 'Testing teacher_profiles table access...'
      });

      const { data: teacherProfiles, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .limit(5);

      if (teacherError) {
        addResult({
          step: 'Step 3: Database Access Test',
          status: 'error',
          message: `Cannot access teacher_profiles: ${teacherError.message}`,
          details: teacherError
        });
      } else {
        addResult({
          step: 'Step 3: Database Access Test',
          status: 'success',
          message: `Successfully accessed teacher_profiles table. Found ${teacherProfiles?.length || 0} records.`
        });
      }

      // Step 4: Check pending teachers
      addResult({
        step: 'Step 4: Pending Teachers Check',
        status: 'info',
        message: 'Checking for pending teacher approvals...'
      });

      const { data: pendingTeachersData, error: pendingError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (pendingError) {
        addResult({
          step: 'Step 4: Pending Teachers Check',
          status: 'error',
          message: `Cannot fetch pending teachers: ${pendingError.message}`
        });
      } else {
        setPendingTeachers(pendingTeachersData || []);
        addResult({
          step: 'Step 4: Pending Teachers Check',
          status: pendingTeachersData?.length ? 'success' : 'warning',
          message: `Found ${pendingTeachersData?.length || 0} pending teacher(s) for approval`
        });
      }

      // Step 5: Check auth.users for unlinked teachers
      addResult({
        step: 'Step 5: Unlinked Teachers Check',
        status: 'info',
        message: 'Checking for teachers without profiles...'
      });

      // This requires a custom query or RPC function
      try {
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (!authError && authUsers.users) {
          const teacherAuthUsers = authUsers.users.filter(user => 
            user.user_metadata?.role === 'teacher' || 
            user.user_metadata?.role === 'TEACHER'
          );
          
          addResult({
            step: 'Step 5: Unlinked Teachers Check',
            status: 'info',
            message: `Found ${teacherAuthUsers.length} teacher(s) in auth.users`
          });
        }
      } catch (e) {
        addResult({
          step: 'Step 5: Unlinked Teachers Check',
          status: 'warning',
          message: 'Cannot access auth.users (admin required)'
        });
      }

      // Step 6: Test approval functionality
      if (pendingTeachersData?.length) {
        addResult({
          step: 'Step 6: Approval Test Ready',
          status: 'success',
          message: `Ready to test approval on ${pendingTeachersData.length} pending teacher(s)`
        });
      } else {
        addResult({
          step: 'Step 6: Approval Test',
          status: 'warning',
          message: 'No pending teachers to test approval functionality'
        });
      }

    } catch (error: any) {
      addResult({
        step: 'Diagnostic Error',
        status: 'error',
        message: `Unexpected error: ${error.message}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testTeacherRegistration = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    addResult({
      step: 'Teacher Registration Test',
      status: 'info',
      message: `Testing teacher registration with email: ${testEmail}`
    });

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!',
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
          step: 'Teacher Registration Test',
          status: 'error',
          message: `Registration failed: ${signUpError.message}`
        });
      } else {
        addResult({
          step: 'Teacher Registration Test',
          status: 'success',
          message: `Registration successful. User created with ID: ${signUpData.user?.id}`
        });

        // Check if profile was created
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from('teacher_profiles')
            .select('*')
            .eq('user_id', signUpData.user?.id);

          if (profile?.length) {
            addResult({
              step: 'Profile Creation Check',
              status: 'success',
              message: 'Teacher profile created successfully'
            });
          } else {
            addResult({
              step: 'Profile Creation Check',
              status: 'warning',
              message: 'Teacher profile not created automatically. May need email confirmation.'
            });
          }
        }, 2000);
      }
    } catch (error: any) {
      addResult({
        step: 'Teacher Registration Test',
        status: 'error',
        message: `Registration error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const approveTeacher = async (teacherId: string, teacherName: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('teacher_profiles')
        .update({
          status: 'APPROVED',
          approval_date: new Date().toISOString(),
          approved_by: currentUser.user?.id
        })
        .eq('id', teacherId);

      if (error) {
        toast({
          title: "Approval Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Teacher Approved",
          description: `${teacherName} has been approved successfully`,
        });
        // Refresh pending teachers
        runDiagnostic();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Teacher Registration & Approval Flow Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={runDiagnostic} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Diagnostic...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Run Diagnostic
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Input
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={testTeacherRegistration}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Diagnostic Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <Alert key={index} className={`
                  ${result.status === 'success' ? 'border-green-200 bg-green-50' : ''}
                  ${result.status === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}
                  ${result.status === 'error' ? 'border-red-200 bg-red-50' : ''}
                  ${result.status === 'info' ? 'border-blue-200 bg-blue-50' : ''}
                `}>
                  <div className="flex items-start gap-2">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium">{result.step}</div>
                      <AlertDescription className="mt-1">
                        {result.message}
                      </AlertDescription>
                      {result.details && (
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Teachers */}
      {pendingTeachers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pending Teacher Approvals ({pendingTeachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTeachers.map((teacher) => (
                <div 
                  key={teacher.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{teacher.full_name}</span>
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                        {teacher.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Email: {teacher.email}
                    </div>
                    <div className="text-sm text-gray-600">
                      Subject: {teacher.subject_expertise} • Experience: {teacher.experience_years} years
                    </div>
                    <div className="text-xs text-gray-500">
                      Registered: {new Date(teacher.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveTeacher(teacher.id, teacher.full_name)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <strong>Step 1:</strong> Click "Run Diagnostic" to check your system setup
          </div>
          <div className="text-sm">
            <strong>Step 2:</strong> If issues are found, run the SQL diagnosis script: <code>TEACHER_APPROVAL_DIAGNOSIS.sql</code>
          </div>
          <div className="text-sm">
            <strong>Step 3:</strong> Test teacher registration with a new email
          </div>
          <div className="text-sm">
            <strong>Step 4:</strong> Approve pending teachers from the list above
          </div>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Common Issues:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Teachers not appearing: Check RLS policies and triggers</li>
                <li>Approval buttons not working: Verify admin permissions</li>
                <li>Profile not created: Check email confirmation and triggers</li>
                <li>Database errors: Run the diagnosis SQL script</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherApprovalFlowTest;
