import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, UserCheck, GraduationCap, Lock } from 'lucide-react';
const StudentRegisterTrigger = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    classLevel: '11',
    guardianName: '',
    guardianMobile: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      // Create auth user with all profile data in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'student',
            full_name: formData.fullName,
            class_level: parseInt(formData.classLevel),
            guardian_name: formData.guardianName,
            guardian_mobile: formData.guardianMobile
          }
        }
      });
      if (authError) throw authError;
      if (authData.user) {
        // The trigger will automatically create the student profile
        // We just need to update it with the additional details
        setTimeout(async () => {
          try {
            const { error: updateError } = await supabase
              .from('student_profiles')
              .update({
                class_level: parseInt(formData.classLevel),
                guardian_name: formData.guardianName,
                guardian_mobile: formData.guardianMobile
              })
              .eq('user_id', authData.user.id);
            if (updateError) {
            }
          } catch (error) {
          }
        }, 2000);
        toast({
          title: "Registration Successful!",
          description: "Your account has been created and is pending approval from the admin.",
        });
        navigate('/login');
      } else {
        throw new Error('User creation failed - no user data returned');
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            Student Registration
          </CardTitle>
          <p className="text-gray-600">Join EduGrowHub as a Student</p>
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
              <Label htmlFor="classLevel" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Class Level *
              </Label>
              <Select onValueChange={(value) => handleInputChange('classLevel', value)} defaultValue="11">
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select class level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="guardianName" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Guardian Name *
              </Label>
              <Input
                id="guardianName"
                type="text"
                value={formData.guardianName}
                onChange={(e) => handleInputChange('guardianName', e.target.value)}
                placeholder="Enter guardian's name"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="guardianMobile" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Guardian Mobile *
              </Label>
              <Input
                id="guardianMobile"
                type="tel"
                value={formData.guardianMobile}
                onChange={(e) => handleInputChange('guardianMobile', e.target.value)}
                placeholder="Enter guardian's mobile number"
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
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register as Student'}
            </Button>
            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:underline">
                Sign in here
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
export default StudentRegisterTrigger;
