
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const EmailConfirmationSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            ✅ Email Confirmed Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/login')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Go to Login
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmationSuccess;
