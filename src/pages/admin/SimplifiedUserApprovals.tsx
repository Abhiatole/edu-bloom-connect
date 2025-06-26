import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, UserX, Clock, GraduationCap, RefreshCw, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import StudentManagementPanel from '@/components/admin/StudentManagementPanel';
import TeacherManagementPanel from '@/components/admin/TeacherManagementPanel';
import WhatsAppMessaging from '@/components/messaging/WhatsAppMessaging';
import WhatsAppTestPanel from '@/components/messaging/WhatsAppTestPanel';
import WhatsAppDirectTest from '@/components/messaging/WhatsAppDirectTest';
type StudentProfile = Database['public']['Tables']['student_profiles']['Row'];
type TeacherProfile = Database['public']['Tables']['teacher_profiles']['Row'];
interface UserWithProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER';
  is_approved: boolean;
  approval_date: string | null;
  created_at: string | null;
  profile_data: StudentProfile | TeacherProfile;
}
const SimplifiedUserApprovals = () => {
  const [allUsers, setAllUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    userId: string;
    userName: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    fetchAllData();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser({ id: user.id, role: 'ADMIN' });
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await fetchUsers();
    } catch (error: any) {
      
      // More detailed error message for the user
      let errorMessage = 'Failed to fetch user data.';
      
      if (error.message && (error.message.includes('permission denied') || error.message.includes('policy'))) {
        errorMessage = 'Permission denied. Database policies need to be updated. Please run the FIX_USER_FETCH.sql script.';
      } else if (error.code === 'PGRST301') {
        errorMessage = 'Database connection error. Please check if Supabase is running.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchUsers = async () => {
    try {
      // Fetch students and teachers with explicit status handling
      
      const [studentsResponse, teachersResponse] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('teacher_profiles')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (studentsResponse.error) {
        throw studentsResponse.error;
      }
      if (teachersResponse.error) {
        throw teachersResponse.error;
      }
      // Combine and normalize the data
      const allUsersData: UserWithProfile[] = [
        ...(studentsResponse.data || []).map(student => ({
          id: student.id,
          user_id: student.user_id,
          display_name: `Student ${student.enrollment_no} (Class ${student.class_level})`,
          email: student.parent_email || 'Email not available',
          role: 'STUDENT' as const,
          is_approved: !!student.approval_date,
          approval_date: student.approval_date,
          created_at: student.created_at,
          profile_data: student
        })),
        ...(teachersResponse.data || []).map(teacher => ({
          id: teacher.id,
          user_id: teacher.user_id,
          display_name: `Teacher ${teacher.full_name} (${teacher.subject_expertise})`,
          email: teacher.email,
          role: 'TEACHER' as const,
          is_approved: !!teacher.approval_date,
          approval_date: teacher.approval_date,
          created_at: teacher.created_at,
          profile_data: teacher
        }))
      ];
      setAllUsers(allUsersData);
    } catch (error) {
      throw error;
    }
  };
  const handleApproval = async (userId: string, action: 'approve' | 'reject') => {
    setActionLoading(userId);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }
      const userToUpdate = allUsers.find(u => u.user_id === userId);
      if (!userToUpdate) {
        throw new Error('User not found');
      }
      const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const approvalDate = action === 'approve' ? new Date().toISOString() : null;
      // Update the appropriate table based on user role
      let updateError: any = null;
      let updateCount = 0;
      if (userToUpdate.role === 'STUDENT') {
        const { error, count } = await supabase
          .from('student_profiles')
          .update({ 
            status,
            approval_date: approvalDate,
            approved_by: currentUser.user.id,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        updateError = error;
        updateCount = count || 0;
      } else if (userToUpdate.role === 'TEACHER') {
        const { error, count } = await supabase
          .from('teacher_profiles')
          .update({ 
            status,
            approval_date: approvalDate,
            approved_by: currentUser.user.id,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        updateError = error;
        updateCount = count || 0;
      }
      if (updateError) {
        throw updateError;
      }
      if (updateCount === 0) {
        throw new Error('No rows were updated. This might be due to RLS policies preventing admin updates.');
      }
      // Update local state for immediate UI feedback
      setAllUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => 
          user.user_id === userId 
            ? { 
                ...user, 
                is_approved: action === 'approve',
                approval_date: approvalDate 
              }
            : user
        );
        return updatedUsers;
      });
      toast({
        title: action === 'approve' ? 'User Approved!' : 'User Rejected!',
        description: `${userToUpdate.display_name} has been ${action}d successfully.`,
      });
      // Refresh data from server to ensure consistency
      setTimeout(() => {
        fetchAllData();
      }, 1000);
    } catch (error: any) {
      let errorMessage = error.message || `Failed to ${action} user`;
      
      if (error.message && error.message.includes('No rows were updated')) {
        errorMessage = 'Database policies prevent this action. Please run the RLS fix script in Supabase.';
      } else if (error.message && error.message.includes('policy')) {
        errorMessage = 'Permission denied. Please check your admin permissions.';
      }
      
      toast({
        title: "Action Failed", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };
  const openConfirmDialog = (type: 'approve' | 'reject', userId: string, userName: string) => {
    setConfirmDialog({ isOpen: true, type, userId, userName });
  };
  const getStatusBadge = (user: UserWithProfile) => {
    if (user.is_approved) {
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'TEACHER':
        return <GraduationCap className="h-4 w-4 text-green-600" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };
  const renderUserCard = (user: UserWithProfile, showActions: boolean = true) => (
    <div key={user.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            {getRoleIcon(user.role)}
            <h3 className="font-semibold text-lg">{user.display_name}</h3>
            {getStatusBadge(user)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role:</strong> {user.role}</div>
            {user.role === 'STUDENT' && (
              <>
                <div><strong>Class:</strong> {(user.profile_data as StudentProfile).class_level}</div>
                <div><strong>Enrollment:</strong> {(user.profile_data as StudentProfile).enrollment_no}</div>
              </>
            )}
            {user.role === 'TEACHER' && (
              <>
                <div><strong>Subject:</strong> {(user.profile_data as TeacherProfile).subject_expertise}</div>
                <div><strong>Experience:</strong> {(user.profile_data as TeacherProfile).experience_years} years</div>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            <div>Registered: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</div>
            {user.approval_date && (
              <div>Approved: {new Date(user.approval_date).toLocaleDateString()}</div>
            )}
          </div>
        </div>
        {showActions && !user.is_approved && (
          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => openConfirmDialog('approve', user.user_id, user.display_name)}
              disabled={actionLoading === user.user_id}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              {actionLoading === user.user_id ? 'Processing...' : 'Approve'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => openConfirmDialog('reject', user.user_id, user.display_name)}
              disabled={actionLoading === user.user_id}
            >
              <UserX className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </div>
  );
  // Filter users by status
  const pendingUsers = allUsers.filter(u => !u.is_approved);
  const approvedUsers = allUsers.filter(u => u.is_approved);
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading dashboard...
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <p className="text-gray-600">Manage user approvals and access control</p>
        </div>
        <Button onClick={fetchAllData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      {/* Setup Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-medium">Setup Required</p>
              <p className="text-sm">
                If the approve button doesn't work, run <code>FIX_ADMIN_APPROVAL_RLS.sql</code> in your Supabase SQL editor.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingUsers.length}</div>
            <div className="text-sm text-gray-500">Pending Approval</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{approvedUsers.length}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{allUsers.length}</div>
            <div className="text-sm text-gray-500">Total Users</div>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedUsers.length})
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Teachers
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Debug WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Users ({pendingUsers.length})
              </CardTitle>
              <CardDescription>
                Users waiting for approval to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending user registrations
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => renderUserCard(user, true))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Approved Users ({approvedUsers.length})
              </CardTitle>
              <CardDescription>
                Users who have been approved and can access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No approved users yet
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedUsers.map((user) => renderUserCard(user, false))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <StudentManagementPanel />
        </TabsContent>

        <TabsContent value="teachers">
          <TeacherManagementPanel />
        </TabsContent>

        <TabsContent value="whatsapp">
          <div className="space-y-6">
            {currentUser ? (
              <WhatsAppMessaging 
                userRole="ADMIN" 
                userId={currentUser.id} 
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Loading user information...</p>
                </CardContent>
              </Card>
            )}
            
            {/* Test Panel for Development */}
            <WhatsAppTestPanel />
          </div>
        </TabsContent>
      </Tabs>
      <AlertDialog open={confirmDialog?.isOpen} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {confirmDialog?.type === 'approve' ? 'Approval' : 'Rejection'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmDialog?.type} <strong>{confirmDialog?.userName}</strong>'s registration?
              {confirmDialog?.type === 'approve' 
                ? ' This will grant them access to the system.' 
                : ' This will deny them access to the system.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog) {
                  handleApproval(confirmDialog.userId, confirmDialog.type);
                }
              }}
              className={confirmDialog?.type === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {confirmDialog?.type === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default SimplifiedUserApprovals;
