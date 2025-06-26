import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
/**
 * Email confirmation callback page
 * This handles the redirect from Supabase email verification
 */
export default function EmailConfirmed() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();
  const { toast } = useToast();
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the current URL
        const url = new URL(window.location.href);
        const hashParams = url.hash.substring(1).split('&');
        
        // Check for error parameter
        const errorParam = hashParams.find(param => param.startsWith('error='));
        if (errorParam) {
          const errorMessage = decodeURIComponent(errorParam.split('=')[1]);
          setStatus('error');
          setMessage(`Verification failed: ${errorMessage}`);
          toast({
            title: 'Verification Failed',
            description: errorMessage,
            variant: 'destructive'
          });
          return;
        }
        
        // Get the access token
        const accessTokenParam = hashParams.find(param => param.startsWith('access_token='));
        if (!accessTokenParam) {
          setStatus('error');
          setMessage('No access token found in the URL.');
          return;
        }
        
        // Get the refresh token
        const refreshTokenParam = hashParams.find(param => param.startsWith('refresh_token='));
        if (!refreshTokenParam) {
          setStatus('error');
          setMessage('No refresh token found in the URL.');
          return;
        }
        
        // Extract tokens
        const accessToken = accessTokenParam.split('=')[1];
        const refreshToken = refreshTokenParam.split('=')[1];
        
        // Set the session with the tokens
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (sessionError) {
          setStatus('error');
          setMessage(`Failed to set session: ${sessionError.message}`);
          toast({
            title: 'Verification Error',
            description: sessionError.message,
            variant: 'destructive'
          });
          return;
        }
        
        // Get the current user to verify email confirmation
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setStatus('error');
          setMessage(`Failed to get user: ${userError?.message || 'User not found'}`);
          return;
        }
        
        if (!user.email_confirmed_at) {
          setStatus('error');
          setMessage('Email verification failed. Please try again or contact support.');
          return;
        }
        
        // Successful verification
        setStatus('success');
        setMessage('Your email has been successfully verified!');
        
        // Log the successful verification
        
        toast({
          title: 'Email Verified',
          description: 'Your email has been successfully verified!',
          variant: 'default'
        });
        
        // Redirect after a short delay
        setTimeout(() => {
          // Redirect based on user role if available
          const userRole = user.user_metadata?.role;
          if (userRole === 'teacher') {
            navigate('/teacher/dashboard');
          } else if (userRole === 'student') {
            navigate('/student/dashboard');
          } else if (userRole === 'admin') {
            navigate('/admin/dashboard');
          } else {
            // Default redirect
            navigate('/dashboard');
          }
        }, 2000);
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred during verification. Please try again later.');
      }
    };
    handleEmailConfirmation();
  }, [navigate, toast]);
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {status === 'loading' && 'Verifying Email'}
            {status === 'success' && 'Email Verified'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' && 'Please wait while we verify your email address.'}
            {status === 'success' && 'Your account is now active.'}
            {status === 'error' && 'We encountered an issue while verifying your email.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <p className="text-center">{message}</p>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center">{message}</p>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
              <p className="text-center">{message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {status === 'error' && (
            <Button 
              className="w-full" 
              onClick={() => navigate('/login')}
            >
              Return to Login
            </Button>
          )}
          {status === 'success' && (
            <Button 
              className="w-full" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
