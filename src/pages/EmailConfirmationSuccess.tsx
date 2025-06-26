import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { RegistrationService } from '@/services/registrationService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
const EmailConfirmationSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user came from login with pending confirmation
  const confirmationPending = location.state?.confirmationPending;
  const userRole = location.state?.userRole;
  // Handle profile creation for users who just confirmed their email
  useEffect(() => {
    const createUserProfile = async () => {
      if (!confirmationPending || !userRole) return;
      
      try {
        setIsCreatingProfile(true);
        
        // Since the user was logged out and redirected here,
        // we don't have an active session to get user data.
        // Instead, we'll guide them to login again.
        setError(null);
        toast({
          title: 'Email Confirmed',
          description: 'Your email has been confirmed. Please login to continue.',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to create profile');
        toast({
          title: 'Error',
          description: err.message || 'Failed to create profile',
          variant: 'destructive',
        });
      } finally {
        setIsCreatingProfile(false);
      }
    };
    
    createUserProfile();
  }, [confirmationPending, userRole, toast]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isCreatingProfile ? (
              <Loader2 className="h-16 w-16 text-blue-600 animate-spin" />
            ) : (
              <CheckCircle className="h-16 w-16 text-green-600" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {isCreatingProfile 
              ? 'Creating Your Profile...' 
              : '✅ Email Confirmed Successfully!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-sm text-red-700 mt-2">{error}</p>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-semibold">Great! Your email has been verified.</p>
                <p className="text-sm text-green-700 mt-2">
                  Your account is now pending approval from an administrator. You'll be notified once approved.
                </p>
              </div>
              
              <div className="text-left space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800">What's Next:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Wait for admin approval (usually within 24 hours)</li>
                  <li>Check your email for approval notification</li>
                  <li>Login to access your dashboard</li>
                </ol>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/login')}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isCreatingProfile}
            >
              Go to Login
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
              disabled={isCreatingProfile}
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>  );
};
export default EmailConfirmationSuccess;
