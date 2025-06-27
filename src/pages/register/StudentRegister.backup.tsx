import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, School, Lock, Users, UserCheck, GraduationCap } from 'lucide-react';
import SubjectSelection from '@/components/registration/SubjectSelection';
import BatchSelection from '@/components/registration/BatchSelection';
import { StudentRegistrationService, RegistrationData } from '@/services/studentRegistrationService';
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
  const navigate = useNavigate();  const handleSubmit = async (e: React.FormEvent) => {
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

      // Validate mobile numbers
      if (formData.studentMobile.length < 10) {
        throw new Error('Please enter a valid student mobile number');
      }
      if (formData.parentMobile.length < 10) {
        throw new Error('Please enter a valid parent mobile number');
      }

      // Prepare registration data
      const registrationData: RegistrationData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        studentMobile: formData.studentMobile,
        parentMobile: formData.parentMobile,
        classLevel: formData.classLevel,
        guardianName: formData.guardianName,
        guardianMobile: formData.guardianMobile,
        selectedSubjects,
        selectedBatches
      };

      // Register student
      const result = await StudentRegistrationService.registerStudent(registrationData);

      if (result.success) {
        toast({
          title: "Registration Successful!",
          description: result.message,
        });

        if (result.requiresEmailConfirmation) {
          navigate('/register/success', {
            state: {
              email: formData.email,
              userType: 'student',
              message: result.message
            }
          });
        } else {
          navigate('/login', {
            state: {
              message: result.message,
              enrollmentNumber: result.enrollmentNumber
            }
          });
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      // Provide more specific error messages
      let errorMessage = error.message || "An error occurred during registration";
      
      if (error.message?.includes('foreign key constraint')) {
        errorMessage = "Registration temporarily unavailable. Please try again in a few moments or contact support.";
      } else if (error.message?.includes('already registered')) {
        errorMessage = "This email is already registered. Please use a different email or try logging in.";
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
              <Label htmlFor="studentMobile" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Student Mobile Number *
              </Label>
              <Input
                id="studentMobile"
                type="tel"
                value={formData.studentMobile}
                onChange={(e) => handleInputChange('studentMobile', e.target.value)}
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
                onChange={(e) => handleInputChange('parentMobile', e.target.value)}
                placeholder="Enter parent's mobile number"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="classLevel" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Class Level *
              </Label>
              <Select onValueChange={(value) => handleInputChange('classLevel', value)} value={formData.classLevel}>
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
export default StudentRegister;
