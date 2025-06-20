import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, UserX, Clock, GraduationCap, BookOpen, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface StudentProfile {
  id: string;
  user_id: string;
  enrollment_no: string;
  class_level: number;
  section: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  approval_date: string | null;
  approved_by_teacher_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface TeacherProfile {
  id: string;
  user_id: string;
  employee_id: string;
  department: string;
  designation: string | null;
  qualification: string | null;
  experience_years: number | null;
  subject_expertise: string;
  approval_date: string | null;
  approved_by_admin_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

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
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    userId: string;
    userName: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await fetchUsers();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchUsers = async () => {
    try {
      // Fetch students and teachers
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

      if (studentsResponse.error) throw studentsResponse.error;
      if (teachersResponse.error) throw teachersResponse.error;      // Combine and normalize the data
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
          display_name: `Teacher ${teacher.employee_id} (${teacher.department})`,
          email: 'Email not available',
          role: 'TEACHER' as const,
          is_approved: !!teacher.approval_date,
          approval_date: teacher.approval_date,
          created_at: teacher.created_at,
          profile_data: teacher
        }))
      ];      setAllUsers(allUsersData);
      console.log(`📊 Fetched ${allUsersData.length} users total`);
      console.log(`📊 Pending: ${allUsersData.filter(u => !u.is_approved).length}, Approved: ${allUsersData.filter(u => u.is_approved).length}`);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const handleApproval = async (userId: string, action: 'approve' | 'reject') => {
    console.log(`🔄 Starting approval process: ${action} for user ${userId}`);
    setActionLoading(userId);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const userToUpdate = allUsers.find(u => u.user_id === userId);
      if (!userToUpdate) throw new Error('User not found');

      console.log(`📝 Updating ${userToUpdate.role} profile for user:`, userToUpdate.display_name);

      const approvalDate = action === 'approve' ? new Date().toISOString() : null;

      // Update the appropriate table based on user role
      let updateError;
      let updateResult;
        if (userToUpdate.role === 'STUDENT') {
        console.log('📊 Updating student_profiles table...');
        const { data, error, count } = await supabase
          .from('student_profiles')
          .update({ 
            approval_date: approvalDate,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        updateError = error;
        updateResult = { data, count };
        console.log('📊 Student update result:', { data, error, count });
      } else if (userToUpdate.role === 'TEACHER') {
        console.log('📊 Updating teacher_profiles table...');
        const { data, error, count } = await supabase
          .from('teacher_profiles')
          .update({ 
            approval_date: approvalDate,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        updateError = error;
        updateResult = { data, count };
        console.log('📊 Teacher update result:', { data, error, count });
      }

      if (updateError) {
        throw updateError;
      }      if (updateResult && updateResult.count === 0) {
        throw new Error('No rows were updated. This might be due to RLS policies preventing admin updates. Please run the RLS fix script.');
      }      // Immediately update the local state for instant UI feedback
      console.log('🎯 Updating local UI state...');
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
        console.log('🎯 UI state updated. User now approved:', updatedUsers.find(u => u.user_id === userId)?.is_approved);
        return updatedUsers;
      });

      toast({
        title: `${action === 'approve' ? 'Approved' : 'Rejected'}!`,
        description: `${userToUpdate.display_name} has been ${action}d successfully.`,
      });

      console.log('✅ Approval successful! UI updated immediately.');

      // Refresh data from server to ensure consistency (background refresh)
      setTimeout(() => {
        fetchAllData();
      }, 1000);
    } catch (error: any) {
      console.error('❌ Approval error:', error);
      
      // Provide more specific error messages
      let errorMessage = error.message || `Failed to ${action} user`;
      
      if (error.message && error.message.includes('No rows were updated')) {
        errorMessage = `Approval blocked: Please run the RLS fix script in Supabase to allow admin updates. See ADMIN_APPROVAL_ROOT_CAUSE_SOLUTION.md for details.`;
      } else if (error.message && error.message.includes('policy')) {
        errorMessage = 'Permission denied: Database policies prevent admin approval. Please check RLS policies.';
      }
      
      toast({
        title: "Approval Failed", 
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
    <div key={user.id} className="border rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            {getRoleIcon(user.role)}
            <h3 className="font-semibold text-lg">{user.display_name}</h3>
            {getStatusBadge(user)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role:</strong> {user.role}</div>            {user.role === 'STUDENT' && (
              <>
                <div><strong>Class:</strong> {(user.profile_data as StudentProfile).class_level}</div>
                <div><strong>Student ID:</strong> {user.id}</div>
              </>
            )}
            {user.role === 'TEACHER' && (
              <>
                <div><strong>Department:</strong> {(user.profile_data as TeacherProfile).department}</div>
                <div><strong>Employee ID:</strong> {(user.profile_data as TeacherProfile).employee_id}</div>
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
          <h2 className="text-2xl font-bold text-gray-900">User Management Dashboard</h2>
          <p className="text-gray-600">Manage user approvals (Simplified Version)</p>
        </div>
        <Button onClick={fetchAllData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>      {/* Admin Approval Setup Notice */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-medium">Admin Approval Setup Required</p>
              <p className="text-sm">
                If the "Approve" button doesn't work, you need to run the RLS policy fix in Supabase SQL Editor. 
                See <code>APPLY_ADMIN_APPROVAL_FIX.md</code> for step-by-step instructions.
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedUsers.length})
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
        </TabsContent>      </Tabs>

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
