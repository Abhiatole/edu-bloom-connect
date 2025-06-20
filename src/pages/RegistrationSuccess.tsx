import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';

const RegistrationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  
  // Get data passed from registration page
  const { email, userType } = location.state || {};

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email not found. Please register again.",
        variant: "destructive"
      });
      return;
    }    setResending(true);
    try {
      // Get the current domain for email redirect
      const currentDomain = window.location.origin;
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${currentDomain}/auth/confirm`
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent!",
        description: "A new confirmation email has been sent to your inbox.",
      });
    } catch (error: any) {
      console.error('Resend error:', error);
      toast({
        title: "Failed to Resend",
        description: error.message || "Could not resend confirmation email",
        variant: "destructive"
      });
    } finally {
      setResending(false);
    }
  };

  const handleBackToRegistration = () => {
    navigate(`/register/${userType || 'student'}`);
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Registration Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Please complete the registration process first.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>          <CardTitle className="text-2xl font-bold text-gray-900">
            {userType === 'teacher' ? 'Teacher Registration Successful!' : 'Registration Successful!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Mail className="h-6 w-6 text-green-600 mr-2" />
                <span className="font-semibold text-green-800">Check Your Email</span>
              </div>
              <p className="text-sm text-green-700">
                We've sent a confirmation email to:
              </p>
              <p className="font-mono text-sm text-green-800 bg-green-100 px-2 py-1 rounded mt-1">
                {email}
              </p>
            </div>            <div className="text-left space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Next Steps:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the confirmation link in the email</li>
                <li>Wait for admin approval of your {userType} account</li>
                <li>
                  {userType === 'teacher' 
                    ? 'Once approved, you can access the teacher dashboard and manage your classes'
                    : 'Login once approved to access your dashboard'
                  }
                </li>
              </ol>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleResendConfirmation}
              disabled={resending}
              variant="outline"
              className="w-full"
            >
              {resending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Resend Confirmation Email
                </>
              )}
            </Button>

            <Button 
              onClick={() => navigate('/login')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Go to Login
            </Button>

            <Button 
              onClick={handleBackToRegistration}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registration
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or try resending.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationSuccess;
