import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, ArrowLeft, Clock } from 'lucide-react';

const RegistrationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const state = location.state as {
    email?: string;
    userType?: string;
    message?: string;
  } || {};

  const { email, userType, message } = state;

  const handleGoBack = () => {
    navigate('/register');
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            Registration Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <Mail className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800 mb-2">Check Your Email</h3>
              <p className="text-sm text-green-700">
                We've sent a confirmation email to:
              </p>
              <p className="font-medium text-green-800 break-all">
                {email || 'your email address'}
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-800 mb-2">What's Next?</h3>
              <ol className="text-sm text-blue-700 text-left space-y-1">
                <li>1. Check your email inbox (and spam folder)</li>
                <li>2. Click the confirmation link</li>
                <li>3. Your account will be activated</li>
                {userType === 'student' && (
                  <li>4. Wait for teacher approval</li>
                )}
                {userType === 'teacher' && (
                  <li>4. Wait for admin approval</li>
                )}
              </ol>
            </div>

            {message && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-700">{message}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <Button 
              onClick={handleGoToLogin}
              className="w-full"
            >
              Go to Login
            </Button>
            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registration
            </Button>
          </div>

          <div className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationSuccess;
