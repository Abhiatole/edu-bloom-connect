import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RegistrationStatusTracker from '@/components/RegistrationStatusTracker';
import WorkflowManagementDashboard from '@/components/WorkflowManagementDashboard';
import { 
  UserPlus, 
  Clock, 
  CheckCircle, 
  Mail, 
  Shield, 
  Users,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Settings
} from 'lucide-react';
const UserRegistrationWorkflowPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">
            User Registration & Approval Workflow
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive system for managing user registrations, approvals, and notifications 
            across all user roles in EduBloom Connect.
          </p>
        </div>
        {/* Workflow Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Workflow Overview
            </CardTitle>
            <CardDescription>
              How the registration and approval process works for different user types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Student Workflow */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-semibold">Student Registration</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium">Student Submits Form</p>
                      <p className="text-sm text-gray-600">Personal details, class level, guardian info</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium">Teacher Review</p>
                      <p className="text-sm text-gray-600">Teachers approve/reject student applications</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium">Account Activated</p>
                      <p className="text-sm text-gray-600">Full access to student dashboard</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Teacher Workflow */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-semibold">Teacher Registration</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium">Teacher Submits Form</p>
                      <p className="text-sm text-gray-600">Professional details, experience, subject expertise</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium">Admin Review</p>
                      <p className="text-sm text-gray-600">Administrators verify qualifications</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium">Account Activated</p>
                      <p className="text-sm text-gray-600">Full access to teacher tools</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Admin Workflow */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-semibold">Admin Registration</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                    <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <p className="font-medium">Admin Submits Form</p>
                      <p className="text-sm text-gray-600">Administrative credentials and department</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <p className="font-medium">Super Admin Review</p>
                      <p className="text-sm text-gray-600">System administrators verify credentials</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <p className="font-medium">Account Activated</p>
                      <p className="text-sm text-gray-600">Full administrative access</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <UserPlus className="h-8 w-8 text-blue-500" />
                <h3 className="font-semibold">Smart Registration</h3>
              </div>
              <p className="text-sm text-gray-600">
                Role-based registration forms with real-time validation and user-friendly experience.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-8 w-8 text-yellow-500" />
                <h3 className="font-semibold">Approval Tracking</h3>
              </div>
              <p className="text-sm text-gray-600">
                Real-time status tracking with progress indicators and estimated completion times.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Mail className="h-8 w-8 text-green-500" />
                <h3 className="font-semibold">Email Notifications</h3>
              </div>
              <p className="text-sm text-gray-600">
                Automated email notifications for registration confirmations, approvals, and rejections.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Settings className="h-8 w-8 text-purple-500" />
                <h3 className="font-semibold">Admin Dashboard</h3>
              </div>
              <p className="text-sm text-gray-600">
                Comprehensive management dashboard with bulk actions and detailed user information.
              </p>
            </CardContent>
          </Card>
        </div>
        {/* Main Interface */}
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Registration Status</TabsTrigger>
            <TabsTrigger value="management">Approval Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Check Your Registration Status</CardTitle>
                <CardDescription>
                  Track your registration progress and see what steps remain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RegistrationStatusTracker />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="management" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Approval Management Dashboard</CardTitle>
                <CardDescription>
                  Review and approve pending user registrations (Admin/Teacher access required)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowManagementDashboard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* Security & Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Row Level Security (RLS) policies</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Role-based access control</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Secure password requirements</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Email verification process</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Audit trail for all approvals</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>System Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <span>Real-time status updates</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <span>Bulk approval actions</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <span>Search and filter capabilities</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <span>Mobile-responsive design</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <span>Comprehensive error handling</span>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and helpful links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => window.location.href = '/register'}>
                <UserPlus className="h-4 w-4 mr-2" />
                New Registration
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/login'}>
                Login to Account
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/admin/users'}>
                <Shield className="h-4 w-4 mr-2" />
                Admin Dashboard
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/support'}>
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default UserRegistrationWorkflowPage;
