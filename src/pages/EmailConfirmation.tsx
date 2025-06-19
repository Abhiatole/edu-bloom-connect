import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (!token || type !== 'signup') {
        setStatus('error');
        setMessage('Invalid confirmation link');
        return;
      }

      try {
        // Verify the email using the token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });

        if (error) {
          console.error('Confirmation error:', error);
          
          if (error.message?.includes('expired')) {
            setStatus('expired');
            setMessage('This confirmation link has expired. Please register again.');
          } else {
            setStatus('error');
            setMessage(error.message || 'Email confirmation failed');
          }
          return;
        }        if (data.user) {
          console.log('Email confirmed for user:', data.user);
          
          const userRole = data.user.user_metadata?.role;
          
          if (!userRole) {
            console.error('No user role found in metadata');
            setStatus('error');
            setMessage('User role not found. Please contact administrator.');
            return;
          }

          console.log('User role:', userRole);
          
          // Wait a moment for any potential triggers to execute
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if profile exists and create if missing
          let profileExists = false;
          let profileCreated = false;
          
          if (userRole === 'student') {
            // Check for existing student profile
            const { data: studentProfile, error: studentError } = await supabase
              .from('student_profiles')
              .select('*')
              .eq('user_id', data.user.id)
              .single();

            if (studentProfile && !studentError) {
              profileExists = true;
              console.log('Student profile found:', studentProfile);
            } else {
              console.log('Student profile not found, creating...');
              
              const { error: createError } = await supabase
                .from('student_profiles')
                .insert({
                  user_id: data.user.id,
                  full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Student',
                  email: data.user.email,
                  class_level: parseInt(data.user.user_metadata?.class_level) || 11,
                  guardian_name: data.user.user_metadata?.guardian_name || '',
                  guardian_mobile: data.user.user_metadata?.guardian_mobile || '',
                  status: 'PENDING'
                });

              if (createError) {
                console.error('Failed to create student profile:', createError);
                setStatus('error');
                setMessage('Profile creation failed. Please try again or contact administrator.');
                return;
              } else {
                profileCreated = true;
                console.log('Student profile created successfully');
              }
            }
            
          } else if (userRole === 'teacher') {
            // Check for existing teacher profile
            const { data: teacherProfile, error: teacherError } = await supabase
              .from('teacher_profiles')
              .select('*')
              .eq('user_id', data.user.id)
              .single();

            if (teacherProfile && !teacherError) {
              profileExists = true;
              console.log('Teacher profile found:', teacherProfile);
            } else {
              console.log('Teacher profile not found, creating...');
                const { error: createError } = await supabase
                .from('teacher_profiles')
                .insert({
                  user_id: data.user.id,
                  full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Teacher',
                  email: data.user.email,
                  subject_expertise: data.user.user_metadata?.subject_expertise || 'Other',
                  experience_years: parseInt(data.user.user_metadata?.experience_years) || 0,
                  status: 'PENDING'
                });

              if (createError) {
                console.error('Failed to create teacher profile:', createError);
                setStatus('error');
                setMessage('Profile creation failed. Please try again or contact administrator.');
                return;
              } else {
                profileCreated = true;
                console.log('Teacher profile created successfully');
              }
            }
          }          if (profileExists || profileCreated) {
            setStatus('success');
            setMessage(`Email confirmed successfully! Your ${userRole} account is now pending admin approval. You will be notified once approved.`);
            
            toast({
              title: "Email Confirmed!",
              description: `Your ${userRole} account has been ${profileCreated ? 'created and is' : 'is'} pending approval.`,
            });
            
            // Auto-redirect to login after 3 seconds
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          } else {
            setStatus('error');
            setMessage('Email confirmed but profile setup failed. Please contact administrator.');
          }
        }
      } catch (error: any) {
        console.error('Confirmation error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during confirmation');
      }
    };

    confirmEmail();
  }, [searchParams, navigate, toast]);

  const handleResendConfirmation = async () => {
    toast({
      title: "Resend Email",
      description: "Please register again to receive a new confirmation email.",
    });
    navigate('/register/student');
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-600" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-16 w-16 text-red-600" />;
      default:
        return <Mail className="h-16 w-16 text-gray-400" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Confirming Your Email...';
      case 'success':
        return 'Email Confirmed Successfully!';
      case 'expired':
        return 'Confirmation Link Expired';
      case 'error':
        return 'Confirmation Failed';
      default:
        return 'Email Confirmation';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {getStatusTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            {message}
          </p>
          
          {status === 'success' && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Redirecting to login page in 3 seconds...
                </p>
              </div>
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Go to Login Now
              </Button>
            </div>
          )}
          
          {(status === 'error' || status === 'expired') && (
            <div className="space-y-3">
              <Button 
                onClick={handleResendConfirmation}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Register Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          )}
          
          {status === 'loading' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Please wait while we confirm your email address...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;
