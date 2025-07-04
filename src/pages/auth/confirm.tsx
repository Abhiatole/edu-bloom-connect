import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle, AlertCircle, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/**
 * Improved email confirmation page that handles auth/confirm route
 */
export default function AuthConfirm() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email...');
  const [userEmail, setUserEmail] = useState<string>('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processConfirmation = async () => {
      try {
        setStatus('loading');
        setMessage('Confirming your email...');

        console.log("🔍 Email confirmation started");
        console.log("📧 Full URL:", window.location.href);
        
        // Get all possible parameters from URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');
        const error = searchParams.get('error');
        const error_description = searchParams.get('error_description');
        const token_hash = searchParams.get('token_hash');
        const email = searchParams.get('email');

        console.log("📋 All URL Parameters:", {
          token, type, access_token, refresh_token, error, error_description, token_hash, email
        });

        // Check for errors first
        if (error) {
          console.error("❌ URL contains error:", error, error_description);
          setStatus('error');
          setMessage(`Confirmation failed: ${error_description || error}`);
          return;
        }

        let result;

        // Method 1: Try verifyOtp with token_hash (most common format)
        if (token_hash && type) {
          console.log("🔑 Attempting verifyOtp with token_hash...");
          result = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any
          });
        }
        // Method 2: Try verifyOtp with regular token
        else if (token && type) {
          console.log("🔑 Attempting verifyOtp with token...");
          result = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any
          });
        }
        // Method 3: Try setSession with access tokens
        else if (access_token) {
          console.log("🔑 Attempting setSession with tokens...");
          result = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || ''
          });
        }
        // Method 4: Manual confirmation for specific cases
        else if (email && token) {
          console.log("🔑 Attempting manual email confirmation...");
          // This is a fallback method for older token formats
          result = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
          });
        }
        // Method 5: Check current session (user might already be logged in)
        else {
          console.log("🔍 Checking current session...");
          result = await supabase.auth.getSession();
        }

        console.log("📊 Confirmation result:", result);

        if (result.error) {
          console.error("❌ Confirmation error:", result.error);
          
          // Handle specific error cases
          if (result.error.message.includes('token') && result.error.message.includes('expired')) {
            setStatus('error');
            setMessage('Email confirmation link has expired. Please request a new confirmation email.');
          } else if (result.error.message.includes('invalid') || result.error.message.includes('token')) {
            setStatus('error');
            setMessage('Invalid confirmation link. Please check your email for the correct link or request a new one.');
          } else {
            setStatus('error');
            setMessage(`Email confirmation failed: ${result.error.message}`);
          }
          return;
        }

        const user = result.data?.user || result.data?.session?.user;
        
        if (user) {
          console.log("✅ User confirmed:", user.email);
          setUserEmail(user.email || '');
          
          // Check if email is now confirmed
          if (user.email_confirmed_at) {
            console.log("📧 Email confirmed at:", user.email_confirmed_at);
            
            // Wait for database triggers to create profiles
            console.log("🔄 Waiting for profile creation...");
            setMessage('Email confirmed! Creating your profile...');
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Verify profile was created
            const { data: profileCheck } = await supabase
              .from('user_profiles')
              .select('role, status')
              .eq('user_id', user.id)
              .single();
            
            console.log("👤 Profile check result:", profileCheck);
            
            setStatus('success');
            if (profileCheck) {
              setMessage(`Welcome! Your ${profileCheck.role?.toLowerCase()} account has been confirmed and your profile is ready.`);
            } else {
              setMessage(`Welcome! Your email has been confirmed. Please log in to complete your profile setup.`);
            }
            
            toast({
              title: 'Email Confirmed!',
              description: 'Your account is ready. Redirecting to login...',
            });
            
            // Show success for a moment, then redirect
            setTimeout(() => {
              navigate('/login?confirmed=true&email=' + encodeURIComponent(user.email));
            }, 4000);
          } else {
            // User exists but email not confirmed - this shouldn't happen but handle it
            setStatus('error');
            setMessage('User authenticated but email confirmation status unclear. Please try logging in.');
            setTimeout(() => navigate('/login'), 3000);
          }
        } else {
          console.log("⚠️ No user data in result");
          setStatus('error');
          setMessage('Email confirmation failed: Invalid or expired confirmation link.');
        }

      } catch (error: any) {
        console.error('💥 Confirmation error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again or request a new confirmation email.');

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
                </p>
                <p className="text-xs text-green-700 mt-2">
                  Your profile has been created. You can now log in to access your dashboard.
                </p>
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
