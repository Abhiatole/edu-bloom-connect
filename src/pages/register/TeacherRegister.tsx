import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User, Mail, BookOpen, Clock, Lock, GraduationCap } from 'lucide-react';
import { EmailConfirmationService } from '@/services/emailConfirmationService';

const TeacherRegister = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    subjectExpertise: '',
    experienceYears: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other'];  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Enhanced validation with better debugging
      console.log('Form data:', {
        fullName: formData.fullName,
        email: formData.email,
        subjectExpertise: formData.subjectExpertise,
        experienceYears: formData.experienceYears,
        password: formData.password ? `[${formData.password.length} chars]` : 'empty',
        confirmPassword: formData.confirmPassword ? `[${formData.confirmPassword.length} chars]` : 'empty',
        passwordsMatch: formData.password === formData.confirmPassword
      });

      if (!formData.password || !formData.confirmPassword) {
        throw new Error('Please enter both password and confirm password');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }      // Validate all required fields
      if (!formData.fullName || !formData.email || !formData.subjectExpertise || !formData.experienceYears) {
        throw new Error('Please fill in all required fields');
      }      console.log('Attempting teacher registration...');

      // Get the current domain for email redirect
      const currentDomain = window.location.origin;      // Step 1: Create auth user first with email redirect
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'TEACHER',
            full_name: formData.fullName,
            subject_expertise: formData.subjectExpertise,
            experience_years: parseInt(formData.experienceYears)
          },
          emailRedirectTo: EmailConfirmationService.getConfirmationUrl()
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      console.log('Auth user created successfully:', authData.user.id);

      // Step 2: Create profile with the returned user ID (not auth.uid())
      if (authData.session || authData.user.email_confirmed_at) {
        console.log('User confirmed, creating profile with user ID:', authData.user.id);
        
        const profileData = {
          user_id: authData.user.id, // Use the actual user ID from signup
          full_name: formData.fullName,
          email: formData.email,
          subject_expertise: formData.subjectExpertise as any,
          experience_years: parseInt(formData.experienceYears),
          status: 'PENDING' as const
        };

        console.log('Creating profile with data:', profileData);

        const { error: profileError } = await supabase
          .from('teacher_profiles')
          .insert(profileData);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          
          // Clean up auth user if profile creation fails
          try {
            console.log('Cleaning up auth user due to profile error');
            await supabase.auth.admin.deleteUser(authData.user.id);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
          
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        console.log('Profile created successfully');
        
        toast({
          title: "Registration Successful!",
          description: "Your teacher account has been created and is pending admin approval. You'll be notified once approved.",
        });
        
        navigate('/login');
      } else {
        console.log('Email confirmation required');
        navigate('/register/success', {
          state: {
            email: formData.email,
            userType: 'teacher'
          }
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
        // Provide more specific error messages
      let errorMessage = error.message || "An error occurred during registration";
      
      if (error.message?.includes('teacher_profiles_user_id_fkey')) {
        errorMessage = "Registration failed due to a timing issue. Please try again in a moment.";
      } else if (error.message?.includes('foreign key constraint')) {
        errorMessage = "Registration temporarily unavailable. Please try again in a few moments.";
      } else if (error.message?.includes('already registered') || error.message?.includes('already been registered')) {
        errorMessage = "This email is already registered. Please use a different email or try logging in.";
      } else if (error.message?.includes('duplicate key')) {
        errorMessage = "An account with this email already exists. Please try logging in instead.";
      } else if (error.message?.includes('Password')) {
        errorMessage = error.message; // Keep password validation messages as-is
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <GraduationCap className="h-6 w-6 text-green-600" />
            Teacher Registration
          </CardTitle>
          <p className="text-gray-600">Join EduGrowHub as a Teacher</p>
        </CardHeader>
        <CardContent>
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
                placeholder="Enter your email"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="subjectExpertise" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Subject Expertise *
              </Label>
              <Select onValueChange={(value) => handleInputChange('subjectExpertise', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your subject expertise" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="experienceYears" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Experience (Years) *
              </Label>
              <Input
                id="experienceYears"
                type="number"
                value={formData.experienceYears}
                onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                placeholder="Enter years of experience"
                min="0"
                max="50"
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

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register as Teacher'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-green-600 hover:underline">
                Sign in here
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherRegister;
