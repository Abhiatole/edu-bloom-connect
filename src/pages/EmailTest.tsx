import { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
export default function EmailTest() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const testEmailConfirmation = async () => {
    if (!email) {
      setMessage('Please enter an email address');
      return;
    }
    setIsLoading(true);
    setMessage('');
    try {
      // Try to sign up with a test account
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'testpassword123',
        options: {
          data: {
            test_account: true
          }
        }
      });
      if (error) {
        setMessage(`Error: ${error.message}`);
        return;
      }
      if (data.user) {
        if (data.user.email_confirmed_at) {
          setMessage('✅ Email confirmation is DISABLED - users can sign up immediately');
        } else {
          setMessage('📧 Email confirmation is ENABLED - confirmation email should be sent');
        }
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const checkAuthSettings = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      // Try to get current session to see auth state
      const { data: session } = await supabase.auth.getSession();
      const { data: user } = await supabase.auth.getUser();
      
      setMessage(`
Current auth state:
- Has session: ${!!session.session}
- Current user: ${user.user?.email || 'None'}
- User confirmed: ${user.user?.email_confirmed_at ? 'Yes' : 'No'}
      `);
    } catch (err: any) {
      setMessage(`Error checking auth: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Configuration Test</CardTitle>
          <CardDescription>
            Test your Supabase email confirmation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Enter test email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={testEmailConfirmation}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Email Confirmation'}
            </Button>
            
            <Button 
              onClick={checkAuthSettings}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              Check Current Auth State
            </Button>
          </div>
          {message && (
            <Alert>
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-sm">{message}</pre>
              </AlertDescription>
            </Alert>
          )}
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>If email confirmation is enabled but no emails are sent:</strong></p>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>Go to Supabase Dashboard → Auth → Settings</li>
              <li>Either disable email confirmation for development</li>
              <li>Or set up custom SMTP (Gmail, SendGrid, etc.)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
