import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, GraduationCap } from 'lucide-react';
import { RegistrationService } from '@/services/registrationService';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Debug logging
      console.log('🔍 Login Debug:');
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Using email:', email);
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {        // Check user role and approval status
        const userId = authData.user.id;
        console.log('🔍 Checking profiles for user:', userId);
        let userProfile = null;
        let userRole = null;

        // Check in student_profiles
        console.log('Checking student_profiles...');
        const { data: studentProfile, error: studentError } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        console.log('Student profile result:', { studentProfile, studentError });        if (studentProfile && !studentError) {
          userProfile = studentProfile;
          userRole = 'student';
        } else {
          // Check in teacher_profiles
          console.log('Checking teacher_profiles...');
          const { data: teacherProfile, error: teacherError } = await supabase
            .from('teacher_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          console.log('Teacher profile result:', { teacherProfile, teacherError });          if (teacherProfile && !teacherError) {
            userProfile = teacherProfile;
            userRole = 'teacher';          } else {
            // Check in user_profiles for admin role
            console.log('Checking user_profiles for admin...');
            const { data: adminProfile, error: adminError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', userId)
              .eq('role', 'ADMIN')
              .single();

            console.log('Admin profile result:', { adminProfile, adminError });

            if (adminProfile && !adminError) {
              userProfile = adminProfile;
              userRole = 'superadmin';
            }
          }
        }        if (!userProfile || !userRole) {
          // Check if this is a new user who just confirmed their email
          const userMetadata = authData.user.user_metadata;
          const role = userMetadata?.role?.toUpperCase();
            if (role === 'STUDENT' || role === 'TEACHER' || role === 'ADMIN') {
            // This user has confirmed their email but profile isn't created yet
            console.log('User has confirmed email but no profile exists. Creating profile...');
            
            try {
              // Create the profile based on role
              await RegistrationService.handleEmailConfirmation(userMetadata);
              
              // Special handling for ADMIN role
              if (role === 'ADMIN') {
                toast({
                  title: 'Admin Profile Created!',
                  description: 'Your admin account has been created and approved automatically.',
                });
                
                // For admin users, redirect them directly to the admin dashboard
                localStorage.setItem('userRole', 'superadmin');
                navigate('/superadmin/dashboard');
                return;
              } else {
                toast({
                  title: 'Profile Created!',
                  description: 'Your profile has been created and is pending approval.',
                });
              }
              
              // Refresh page to try login again for non-admin users
              window.location.reload();
              return;
            } catch (profileError) {
              console.error('Failed to create profile:', profileError);
              
              // Special handling for ADMIN users with errors
              if (role === 'ADMIN') {
                // For admin users, we'll direct them to the dashboard even if there's an error
                toast({
                  title: 'Admin Login',
                  description: 'Logging you in as administrator.',
                });
                localStorage.setItem('userRole', 'superadmin');
                navigate('/superadmin/dashboard');
                return;
              }
              // Continue to throw error below for other roles
            }
          }
          
          throw new Error('User profile not found. Please contact administrator.');
        }

        // Check approval status for students and teachers
        if ((userRole === 'student' || userRole === 'teacher') && userProfile.status !== 'APPROVED') {
          await supabase.auth.signOut();
          
          const statusMessage = userProfile.status === 'PENDING' 
            ? 'Your account is pending approval. Please wait for admin confirmation.'
            : 'Your account has been rejected. Please contact administrator.';
          
          throw new Error(statusMessage);
        }

        // Store user role in localStorage
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userProfile', JSON.stringify(userProfile));

        toast({
          title: "Login Successful!",
          description: `Welcome back, ${userProfile.full_name}!`,
        });

        // Navigate based on role
        switch (userRole) {
          case 'superadmin':
            navigate('/superadmin/dashboard');
            break;
          case 'teacher':
            navigate('/teacher/dashboard');
            break;
          case 'student':
            navigate('/student/dashboard');
            break;
          default:
            navigate('/');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            Login to EduGrowHub
          </CardTitle>
          <CardDescription>
            Access your personalized learning dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="mt-1"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={loading}
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>              <div className="text-center space-y-2">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-blue-600 hover:underline block"
                >
                  Forgot your password?
                </Link>
                
                <Link 
                  to="/profile-diagnostics" 
                  className="text-sm text-blue-600 hover:underline block"
                >
                  Troubleshoot Login Issues
                </Link>
                
                <div className="text-sm text-gray-600">
                  Don't have an account?
                </div><div className="flex flex-col space-y-2">
                <Link to="/register/student">
                  <Button variant="outline" size="sm" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                    Register as Student
                  </Button>
                </Link>
                <Link to="/register/teacher">
                  <Button variant="outline" size="sm" className="w-full border-green-600 text-green-600 hover:bg-green-50">
                    Register as Teacher
                  </Button>
                </Link>
                <Link to="/register/admin">
                  <Button variant="outline" size="sm" className="w-full border-purple-600 text-purple-600 hover:bg-purple-50">
                    Register as Administrator
                  </Button>
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
