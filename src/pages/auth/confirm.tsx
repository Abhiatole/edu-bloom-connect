import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmailConfirmationService } from '@/services/emailConfirmationService';

/**
 * Improved email confirmation page that handles auth/confirm route
 */
export default function AuthConfirm() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email...');
  const [userRole, setUserRole] = useState<string>('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processConfirmation = async () => {
      try {
        setStatus('loading');
        setMessage('Confirming your email...');

        // Log all URL parameters for debugging
        const allParams = Object.fromEntries(searchParams.entries());
        console.log('Email confirmation URL parameters:', allParams);

        // Use the URL search params to handle confirmation
        const result = await EmailConfirmationService.handleEmailConfirmationCallback(searchParams);

        if (result.success) {
          setStatus('success');
          setMessage(result.message || 'Email confirmed successfully!');
          
          // Extract role for display
          if (result.user?.user_metadata?.role) {
            setUserRole(result.user.user_metadata.role.toLowerCase());
          }

          toast({
            title: 'Email Confirmed!',
            description: result.message || 'Your email has been successfully confirmed.',
          });

          // Redirect to login after delay
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Email confirmed! You can now log in.',
                type: 'success'
              }
            });
          }, 3000);

        } else {
          setStatus('error');
          setMessage(result.message || 'Email confirmation failed.');

          toast({
            title: 'Confirmation Failed',
            description: result.message || 'Please check the confirmation link or try again.',
            variant: 'destructive',
          });
        }

      } catch (error: any) {
        console.error('Confirmation error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again or contact support.');

        toast({
          title: 'Error',
          description: 'An unexpected error occurred during confirmation.',
          variant: 'destructive',
        });
      }
    };

    processConfirmation();
  }, [navigate, toast, searchParams]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === 'error' && <AlertCircle className="h-6 w-6 text-red-600" />}
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {status === 'loading' && 'Confirming Email'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Confirmation Failed'}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  Your email has been successfully verified!
                  {userRole && ` You're now registered as a ${userRole}.`}
                </p>
                {userRole === 'student' && (
                  <p className="text-xs text-green-700 mt-2">
                    Your account is pending teacher approval.
                  </p>
                )}
                {userRole === 'teacher' && (
                  <p className="text-xs text-green-700 mt-2">
                    Your account is pending admin approval.
                  </p>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                You will be redirected automatically in a few seconds...
              </p>
              
              <Button 
                onClick={handleGoToLogin}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  There was an issue confirming your email. This could be due to:
                </p>
                <ul className="text-xs text-red-700 mt-2 text-left list-disc list-inside">
                  <li>Expired confirmation link</li>
                  <li>Already confirmed email</li>
                  <li>Invalid confirmation token</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
                
                <Button 
                  onClick={handleGoToLogin}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Please wait while we confirm your email address...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
