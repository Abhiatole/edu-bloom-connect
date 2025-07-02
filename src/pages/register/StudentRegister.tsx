import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, School, Lock, Users, UserCheck, GraduationCap } from 'lucide-react';
import SubjectSelection from '@/components/registration/SubjectSelection';
import BatchSelection from '@/components/registration/BatchSelection';
import { FinalRegistrationService } from '@/services/finalRegistrationService';

const StudentRegister = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentMobile: '',
    parentMobile: '',
    classLevel: '11',
    guardianName: '',
    guardianMobile: ''
  });
  
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [subjectError, setSubjectError] = useState('');
  const [batchError, setBatchError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubjectError('');
    setBatchError('');

    try {
      // Validate form data
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Validate subject selection
      if (selectedSubjects.length === 0) {
        setSubjectError('Please select at least one subject');
        setLoading(false);
        return;
      }

      // Validate batch selection
      if (selectedBatches.length === 0) {
        setBatchError('Please select at least one batch');
        setLoading(false);
        return;
      }

      // Use the clean registration service
      const result = await FinalRegistrationService.registerStudent({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        classLevel: formData.classLevel,
        guardianName: formData.guardianName,
        guardianMobile: formData.guardianMobile,
        parentMobile: formData.parentMobile,
        batches: selectedBatches,
        subjects: selectedSubjects
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
            userType: 'student',
            message: 'Please check your email to confirm your account.'
          }
        });
      } else {
        toast({
          title: "Registration Successful!",
          description: "Your account has been created and is pending approval.",
        });

        navigate('/login', {
          state: {
            message: 'Registration successful! Your account is pending approval.'
          }
        });
      }

    } catch (error: any) {
      console.error('💥 Registration failed:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message || "An error occurred during registration";
      
      if (error.message?.includes('foreign key constraint')) {
        errorMessage = "Registration temporarily unavailable. Please try again in a few moments or contact support.";
      } else if (error.message?.includes('already registered')) {
        errorMessage = "This email is already registered. Please use a different email or try logging in.";
      } else if (error.message?.includes('policy')) {
        errorMessage = "Database permissions error. Please contact support.";
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

  const updateFormField = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            Student Registration
          </CardTitle>
          <p className="text-gray-600">Join EduGrowHub as a Student</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateFormField('fullName')(e.target.value)}
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
                    onChange={(e) => updateFormField('email')(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentMobile" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Student Mobile Number *
                  </Label>
                  <Input
                    id="studentMobile"
                    type="tel"
                    value={formData.studentMobile}
                    onChange={(e) => updateFormField('studentMobile')(e.target.value)}
                    placeholder="Enter your mobile number"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="parentMobile" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Parent Mobile Number *
                  </Label>
                  <Input
                    id="parentMobile"
                    type="tel"
                    value={formData.parentMobile}
                    onChange={(e) => updateFormField('parentMobile')(e.target.value)}
                    placeholder="Enter parent's mobile number"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="classLevel" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Class Level *
                </Label>
                <select
                  id="classLevel"
                  value={formData.classLevel}
                  onChange={(e) => updateFormField('classLevel')(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                >
                  <option value="">Select class level</option>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                </select>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Guardian Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guardianName" className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Guardian Name *
                  </Label>
                  <Input
                    id="guardianName"
                    type="text"
                    value={formData.guardianName}
                    onChange={(e) => updateFormField('guardianName')(e.target.value)}
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
                    onChange={(e) => updateFormField('guardianMobile')(e.target.value)}
                    placeholder="Enter guardian's mobile number"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Academic Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Academic Preferences</h3>
              
              {/* Subject Selection */}
              <SubjectSelection
                selectedSubjects={selectedSubjects}
                onSubjectsChange={setSelectedSubjects}
                error={subjectError}
              />

              {/* Batch Selection */}
              <BatchSelection
                selectedBatches={selectedBatches}
                onBatchesChange={setSelectedBatches}
                error={batchError}
              />
            </div>

            {/* Security */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Account Security</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormField('password')(e.target.value)}
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
                    onChange={(e) => updateFormField('confirmPassword')(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
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

export default StudentRegister;
