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
import { FinalRegistrationService } from '@/services/finalRegistrationService';
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
      // Enhanced validation
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
      }
      
      // Use clean registration service
      const result = await FinalRegistrationService.registerTeacher({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        subjectExpertise: formData.subjectExpertise,
        experienceYears: parseInt(formData.experienceYears)
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      if (result.requiresEmailConfirmation) {
        toast({
          title: "Registration Successful!",
          description: "Please check your email to confirm your account.",
        });

        navigate('/register/success', {
          state: {
            email: formData.email,
            userType: 'teacher',
            message: 'Please check your email to confirm your account.'
          }
        });
      } else {
        toast({
          title: "Registration Successful!",
          description: "Your teacher account has been created and is pending admin approval.",
        });

        navigate('/login', {
          state: {
            message: 'Registration successful! Your account is pending admin approval.'
          }
        });
      }

    } catch (error: any) {
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
