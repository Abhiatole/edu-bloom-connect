import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CleanRegistrationService } from '@/services/cleanRegistrationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the current user after email confirmation
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('User not found after email confirmation');
        }

        // Check if user has metadata
        const userMetadata = user.user_metadata || {};
        
        if (userMetadata.role) {
          // Handle profile creation based on role
          const result = await CleanRegistrationService.handleEmailConfirmation(userMetadata);
          
          if (result.success) {
            setStatus('success');
            setMessage(result.message);
            
            // Redirect to appropriate page after 3 seconds
            setTimeout(() => {
              if (userMetadata.role === 'admin') {
                navigate('/admin/dashboard');
              } else {
                navigate('/login', {
                  state: { 
                    message: 'Email confirmed successfully! You can now log in.' 
                  }
                });
              }
            }, 3000);
          } else {
            throw new Error(result.message);
          }
        } else {
          setStatus('success');
          setMessage('Email confirmed successfully! You can now log in.');
          
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }

      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Email confirmation failed. Please try again.');
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  const handleReturnToLogin = () => {
    navigate('/login');
  };

  const handleReturnToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-600" />}
            Email Confirmation
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>
          
          {status === 'success' && (
            <div className="text-sm text-green-600">
              Redirecting you automatically in a few seconds...
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-2">
              <Button 
                onClick={handleReturnToLogin}
                className="w-full"
                variant="default"
              >
                Go to Login
              </Button>
              <Button 
                onClick={handleReturnToRegister}
                className="w-full"
                variant="outline"
              >
                Register Again
              </Button>
            </div>
          )}
          
          {status === 'loading' && (
            <div className="text-sm text-gray-500">
              Processing your email confirmation...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;
