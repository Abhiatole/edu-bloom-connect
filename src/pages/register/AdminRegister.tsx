import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminCode: '' // Optional admin verification code
  });
  const [loading, setLoading] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Optional: Check admin code if provided
      if (showAdminCode && formData.adminCode && formData.adminCode !== 'ADMIN2025') {
        throw new Error('Invalid admin verification code');
      }

      // Create auth user with admin role in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'admin',
            full_name: formData.fullName,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        console.log('Admin signup data:', authData);
        console.log('Has session:', !!authData.session);
        console.log('User confirmed:', authData.user.email_confirmed_at);
        
        // Check if email confirmation is required
        if (authData.session || authData.user.email_confirmed_at) {
          // User is immediately confirmed or email confirmation is disabled - create profile directly
          console.log('Admin is confirmed or email confirmation disabled, creating profile directly');
            const profileData = {
            user_id: authData.user.id,
            full_name: formData.fullName,
            email: formData.email,
            role: 'ADMIN' as const
          };
          
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert(profileData);

          if (profileError) {
            console.error('Admin profile creation error:', profileError);
            // Continue anyway - the trigger should handle this
          }

          toast({
            title: "Admin Registration Successful!",
            description: "Your admin account has been created successfully. You can now login.",
          });
          
          navigate('/login');
        } else {
          // Email confirmation is required - redirect to success page
          console.log('Email confirmation required for admin, redirecting to success page');
          
          navigate('/register/success', {
            state: {
              email: formData.email,
              userType: 'admin'
            }
          });
        }
      } else {
        throw new Error('Admin creation failed - no user data returned');
      }
    } catch (error: any) {
      console.error('Admin registration error:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message || "An error occurred during admin registration";
      
      if (error.message?.includes('already registered')) {
        errorMessage = "This email is already registered. Please use a different email or try logging in.";
      } else if (error.message?.includes('Invalid admin verification code')) {
        errorMessage = "Invalid admin verification code. Please check the code and try again.";
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" />
            Admin Registration
          </CardTitle>
          <p className="text-gray-600">Join EduGrowHub as an Administrator</p>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Admin accounts require verification and approval. Please ensure you have authorization to create an admin account.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your admin email"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password *
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password (min 6 characters)"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Confirm Password *
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                required
                className="mt-1"
              />
            </div>

            {/* Optional Admin Code Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useAdminCode"
                  checked={showAdminCode}
                  onChange={(e) => setShowAdminCode(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="useAdminCode" className="text-sm">
                  I have an admin verification code
                </Label>
              </div>

              {showAdminCode && (
                <div>
                  <Label htmlFor="adminCode" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin Verification Code
                  </Label>
                  <Input
                    id="adminCode"
                    type="text"
                    value={formData.adminCode}
                    onChange={(e) => handleInputChange('adminCode', e.target.value)}
                    placeholder="Enter admin code (optional)"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Contact your system administrator for the verification code
                  </p>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700" 
              disabled={loading}
            >
              {loading ? 'Creating Admin Account...' : 'Register as Administrator'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-purple-600 hover:underline">
                Sign in here
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRegister;
