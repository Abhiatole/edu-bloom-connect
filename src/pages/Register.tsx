
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, UserCheck } from 'lucide-react';

const Register = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Join EduGrowHub
          </CardTitle>
          <p className="text-gray-600">Choose your registration type</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link to="/register/student" className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-16 text-left">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">Student</div>
                    <div className="text-sm opacity-90">Join as a student</div>
                  </div>
                </div>
              </div>
            </Button>
          </Link>

          <Link to="/register/teacher" className="block">
            <Button className="w-full bg-green-600 hover:bg-green-700 h-16 text-left">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">Teacher</div>
                    <div className="text-sm opacity-90">Join as a teacher</div>
                  </div>
                </div>
              </div>
            </Button>
          </Link>

          <Link to="/register/admin" className="block">
            <Button className="w-full bg-purple-600 hover:bg-purple-700 h-16 text-left">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">Administrator</div>
                    <div className="text-sm opacity-90">Join as an admin</div>
                  </div>
                </div>
              </div>
            </Button>
          </Link>

          <div className="text-center text-sm text-gray-600 pt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
