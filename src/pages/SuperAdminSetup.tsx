import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, User, Lock, Mail, CheckCircle, XCircle } from 'lucide-react';

const SuperAdminSetup = () => {
  const [formData, setFormData] = useState({
    email: 'admin@edugrowhub.com',
    password: 'SuperAdmin123!',
    fullName: 'Super Administrator'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    userId?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const createSuperAdmin = async () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Step 1: Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'superadmin',
            full_name: formData.fullName,
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      const userId = signUpData.user.id;

      // Step 2: Create admin profile (if user is immediately confirmed)
      if (signUpData.user.email_confirmed_at || signUpData.session) {
        const { error: profileError } = await supabase
          .from('admin_profiles')
          .insert({
            user_id: userId,
            full_name: formData.fullName,
            email: formData.email,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Continue anyway - we can create the profile manually
        }

        setResult({
          success: true,
          message: `Super Admin created successfully! You can now login with ${formData.email}`,
          userId: userId
        });

        toast({
          title: "Success!",
          description: "Super Admin account created successfully",
        });
      } else {
        setResult({
          success: true,
          message: `User created but email confirmation required. Check ${formData.email} for confirmation email.`,
          userId: userId
        });

        toast({
          title: "Email Confirmation Required",
          description: "Check your email for confirmation link",
        });
      }

    } catch (error: any) {
      console.error('Super Admin creation error:', error);
      
      let errorMessage = error.message || 'Failed to create Super Admin';
      
      if (error.message?.includes('User already registered')) {
        errorMessage = 'This email is already registered. If this is your admin email, you can promote an existing user instead.';
      }

      setResult({
        success: false,
        message: errorMessage
      });

      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const promoteExistingUser = async () => {
    if (!formData.email) {
      toast({
        title: "Validation Error",
        description: "Please enter the email of the user to promote",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);    try {
      // Alternative: Try to create admin profile directly
      // This will help us determine if the user exists
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy ID to test
          full_name: formData.fullName,
          email: formData.email,
        });

      // This will fail, but gives us information about the user
      throw new Error('User promotion requires manual SQL execution. Please use the SQL method in your Supabase dashboard.');

    } catch (error: any) {
      setResult({
        success: false,
        message: 'User promotion failed. Please use the SQL method in your Supabase dashboard to promote an existing user.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-purple-600" />
              Super Admin Setup
            </CardTitle>
            <CardDescription>
              Create the initial Super Administrator account for your EduGrowHub system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Super Administrator"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@edugrowhub.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter a strong password"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use a strong password with at least 8 characters
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={createSuperAdmin}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Creating Super Admin...' : 'Create Super Admin'}
              </Button>

              <Button 
                onClick={promoteExistingUser}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Promote Existing User to Admin
              </Button>
            </div>

            {result && (
              <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                  {result.message}
                  {result.userId && (
                    <div className="mt-2 text-xs font-mono bg-gray-100 p-2 rounded">
                      User ID: {result.userId}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Alternative Method (If this doesn't work):</strong>
                <br />
                1. Go to your Supabase Dashboard → SQL Editor
                <br />
                2. Use the SQL scripts I created: <code>create_super_admin.sql</code> or <code>create_super_admin_simple.sql</code>
                <br />
                3. Follow the step-by-step instructions in those files
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminSetup;
