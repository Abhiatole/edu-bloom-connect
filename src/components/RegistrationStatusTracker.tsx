import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Mail, 
  User, 
  GraduationCap,
  BookOpen,
  Shield
} from 'lucide-react';

interface WorkflowStep {
  name: string;
  completed: boolean;
  description: string;
  current?: boolean;
}

interface UserStatus {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
  userType?: 'student' | 'teacher' | 'admin';
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'not_found';
  profileData?: any;
  approvalDate?: string;
  approvedBy?: string;
}

const RegistrationStatusTracker = () => {
  const [userStatus, setUserStatus] = useState<UserStatus>({
    isAuthenticated: false,
    registrationStatus: 'not_found'
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        setUserStatus({
          isAuthenticated: false,
          registrationStatus: 'not_found'
        });
        return;
      }

      const userId = userData.user.id;
      const userEmail = userData.user.email;

      // Check in student_profiles
      const { data: studentData } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (studentData) {
        setUserStatus({
          isAuthenticated: true,
          userId,
          email: userEmail,
          userType: 'student',
          registrationStatus: studentData.approval_date ? 'approved' : 'pending',
          profileData: studentData,
          approvalDate: studentData.approval_date,
          approvedBy: studentData.approved_by_teacher_id
        });
        return;
      }

      // Check in teacher_profiles
      const { data: teacherData } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (teacherData) {
        setUserStatus({
          isAuthenticated: true,
          userId,
          email: userEmail,
          userType: 'teacher',
          registrationStatus: teacherData.approval_date ? 'approved' : 'pending',
          profileData: teacherData,
          approvalDate: teacherData.approval_date,
          approvedBy: teacherData.approved_by_admin_id
        });
        return;
      }

      // Check in user_profiles (for admins)
      const { data: adminData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (adminData) {
        setUserStatus({
          isAuthenticated: true,
          userId,
          email: userEmail,
          userType: 'admin',
          registrationStatus: adminData.status === 'APPROVED' ? 'approved' : 'pending',
          profileData: adminData
        });
        return;
      }

      // User authenticated but no profile found
      setUserStatus({
        isAuthenticated: true,
        userId,
        email: userEmail,
        registrationStatus: 'not_found'
      });

    } catch (error: any) {
      console.error('Error checking user status:', error);
      toast({
        title: "Error",
        description: "Failed to check registration status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (userStatus.registrationStatus) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (userStatus.registrationStatus) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Status Unknown</Badge>;
    }
  };

  const getProgressValue = () => {
    switch (userStatus.registrationStatus) {
      case 'pending':
        return 50;
      case 'approved':
        return 100;
      case 'rejected':
        return 25;
      default:
        return 10;
    }
  };

  const getUserTypeIcon = () => {
    switch (userStatus.userType) {
      case 'student':
        return <GraduationCap className="h-5 w-5 text-blue-500" />;
      case 'teacher':
        return <BookOpen className="h-5 w-5 text-purple-500" />;
      case 'admin':
        return <Shield className="h-5 w-5 text-red-500" />;
      default:
        return <User className="h-5 w-5 text-gray-500" />;
    }
  };
  const getWorkflowSteps = (): WorkflowStep[] => {
    const baseSteps: WorkflowStep[] = [
      { 
        name: 'Registration Submitted', 
        completed: true, 
        description: 'Your registration form has been submitted successfully' 
      }
    ];

    if (userStatus.userType === 'student') {
      return [
        ...baseSteps,
        { 
          name: 'Teacher Review', 
          completed: userStatus.registrationStatus === 'approved', 
          description: 'Waiting for teacher approval of your registration',
          current: userStatus.registrationStatus === 'pending'
        },
        { 
          name: 'Account Activated', 
          completed: userStatus.registrationStatus === 'approved', 
          description: 'Full access to all platform features'
        }
      ];
    } else if (userStatus.userType === 'teacher') {
      return [
        ...baseSteps,
        { 
          name: 'Admin Review', 
          completed: userStatus.registrationStatus === 'approved', 
          description: 'Waiting for admin approval of your teacher account',
          current: userStatus.registrationStatus === 'pending'
        },
        { 
          name: 'Account Activated', 
          completed: userStatus.registrationStatus === 'approved', 
          description: 'Full access to teacher dashboard and features'
        }
      ];
    } else {
      return [
        ...baseSteps,
        { 
          name: 'System Review', 
          completed: userStatus.registrationStatus === 'approved', 
          description: 'Your registration is being processed',
          current: userStatus.registrationStatus === 'pending'
        },
        { 
          name: 'Account Activated', 
          completed: userStatus.registrationStatus === 'approved', 
          description: 'Full admin access granted'
        }
      ];
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Checking registration status...</span>
        </CardContent>
      </Card>
    );
  }

  if (!userStatus.isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            Please log in to check your registration status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Status Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Registration Status
          </CardTitle>
          <CardDescription>
            Track your registration progress through our approval process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getUserTypeIcon()}
              <span className="font-medium capitalize">{userStatus.userType} Registration</span>
            </div>
            {getStatusBadge()}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{getProgressValue()}%</span>
            </div>
            <Progress value={getProgressValue()} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{userStatus.email}</span>
              </div>
              {userStatus.profileData && (
                <div className="text-sm text-gray-600">
                  <strong>ID:</strong> {
                    userStatus.userType === 'student' 
                      ? userStatus.profileData.enrollment_no
                      : userStatus.userType === 'teacher'
                      ? userStatus.profileData.employee_id
                      : userStatus.profileData.id
                  }
                </div>
              )}
            </div>
            
            {userStatus.approvalDate && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600">
                  <strong>Approved on:</strong><br />
                  {new Date(userStatus.approvalDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps Card */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Workflow</CardTitle>
          <CardDescription>
            Follow your progress through each step of the approval process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getWorkflowSteps().map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : step.current
                    ? 'bg-yellow-500 border-yellow-500 text-white'
                    : 'border-gray-300 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : step.current ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    step.completed ? 'text-green-700' : step.current ? 'text-yellow-700' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Card */}
      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          {userStatus.registrationStatus === 'pending' && (
            <div className="space-y-3">
              <p className="text-gray-600">
                Your registration is currently being reviewed. Here's what you can expect:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>
                  {userStatus.userType === 'student' ? 'Teachers' : 'Administrators'} will review your application
                </li>
                <li>You'll receive an email notification once approved</li>
                <li>The review process typically takes 24-48 hours</li>
                <li>Make sure to check your email regularly</li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={checkUserStatus}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/support'}>
                  Contact Support
                </Button>
              </div>
            </div>
          )}

          {userStatus.registrationStatus === 'approved' && (
            <div className="space-y-3">
              <p className="text-green-700 font-medium">
                🎉 Congratulations! Your account has been approved.
              </p>
              <p className="text-gray-600">
                You now have full access to all platform features.
              </p>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </div>
          )}

          {userStatus.registrationStatus === 'rejected' && (
            <div className="space-y-3">
              <p className="text-red-700 font-medium">
                Your registration was not approved at this time.
              </p>
              <p className="text-gray-600">
                Please contact support for more information or to reapply.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.location.href = '/support'}>
                  Contact Support
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/register'}>
                  Register Again
                </Button>
              </div>
            </div>
          )}

          {userStatus.registrationStatus === 'not_found' && (
            <div className="space-y-3">
              <p className="text-gray-600">
                We couldn't find a registration record for your account.
              </p>
              <p className="text-gray-600">
                Please complete the registration process or contact support if you believe this is an error.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => window.location.href = '/register'}>
                  Complete Registration
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/support'}>
                  Contact Support
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationStatusTracker;
