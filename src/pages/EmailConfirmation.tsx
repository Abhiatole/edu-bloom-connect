
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import EmailConfirmationService from '@/services/emailConfirmationService';

const EmailConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const result = await EmailConfirmationService.handleEmailConfirmationCallback(searchParams);
        
        if (result.success) {
          setStatus('success');
          setMessage(result.message);
          
          toast({
            title: "Email Confirmed!",
            description: "Your account is now verified and pending approval.",
          });

          // Redirect to success page after a short delay
          setTimeout(() => {
            navigate('/auth/success');
          }, 2000);
        } else {
          throw new Error(result.message);
        }
      } catch (error: any) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to confirm email');
        
        toast({
          title: "Confirmation Failed",
          description: error.message || "Failed to confirm your email",
          variant: "destructive"
        });
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-16 w-16 text-green-600" />}
            {status === 'error' && <XCircle className="h-16 w-16 text-red-600" />}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {status === 'loading' && 'Confirming Email...'}
            {status === 'success' && '✅ Email Confirmed!'}
            {status === 'error' && '❌ Confirmation Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              {status === 'loading' && 'Please wait while we verify your email address...'}
              {message}
            </p>
          </div>

          {status === 'success' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-semibold">Great! Your email has been verified.</p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                  Your account is now pending approval from an administrator. You'll be notified once approved.
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/login')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Go to Login
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/login')}
                className="w-full"
                variant="outline"
              >
                Back to Login
              </Button>
              
              <Button 
                onClick={() => navigate('/register/student')}
                className="w-full"
              >
                Try Registration Again
              </Button>
            </div>
          )}

          {status === 'loading' && (
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              Back to Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmation;
