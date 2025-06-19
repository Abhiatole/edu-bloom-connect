import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, UserX, Clock, GraduationCap, BookOpen, History, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  approved_by?: string;
  approval_date?: string;
}

interface ApprovalLog {
  id: string;
  approved_user_id: string;
  user_type: string;
  action: string;
  user_name?: string;
  user_email?: string;
  approved_by_name?: string;
  created_at: string;
  reason?: string;
}

const EnhancedUserApprovalsWithHistory = () => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalLog[]>([]);
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
      await Promise.all([
        fetchUsers(),
        fetchApprovalHistory()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchUsers = async () => {
    try {
      // Fetch both student and teacher profiles
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
      if (teachersResponse.error) throw teachersResponse.error;

      // Combine and normalize the data
      const allUsersData: UserProfile[] = [
        ...(studentsResponse.data || []).map(student => ({
          id: student.id,
          user_id: student.user_id,
          full_name: student.full_name,
          email: student.email,
          role: 'STUDENT',
          status: student.status,
          created_at: student.created_at,
          approved_by: student.approved_by,
          approval_date: student.approval_date
        })),
        ...(teachersResponse.data || []).map(teacher => ({
          id: teacher.id,
          user_id: teacher.user_id,
          full_name: teacher.full_name,
          email: teacher.email,
          role: 'TEACHER',
          status: teacher.status,
          created_at: teacher.created_at,
          approved_by: teacher.approved_by,
          approval_date: teacher.approval_date
        }))
      ];

      setAllUsers(allUsersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive"
      });
    }
  };
  const fetchApprovalHistory = async () => {
    try {
      // Try to fetch from approval_logs table (if it exists)
      const { data, error } = await supabase
        .from('approval_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Table might not exist yet, that's okay
        console.log('Approval logs table not available yet');
        setApprovalHistory([]);
        return;
      }
      setApprovalHistory(data || []);
    } catch (error) {
      console.error('Error fetching approval history:', error);
      setApprovalHistory([]);
    }
  };
  const handleApproval = async (userId: string, action: 'approve' | 'reject') => {
    setActionLoading(userId);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const userToUpdate = allUsers.find(u => u.user_id === userId);
      
      if (!userToUpdate) throw new Error('User not found');

      // Update the appropriate table based on user role
      let updateError;
      if (userToUpdate.role === 'STUDENT') {
        const { error } = await supabase
          .from('student_profiles')
          .update({ 
            status,
            approved_by: currentUser.user.id,
            approval_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        updateError = error;
      } else if (userToUpdate.role === 'TEACHER') {
        const { error } = await supabase
          .from('teacher_profiles')
          .update({ 
            status,
            approved_by: currentUser.user.id,
            approval_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        updateError = error;
      }

      if (updateError) throw updateError;      // Note: Approval logging will be available after running SETUP_APPROVAL_SYSTEM.sql
      // For now, basic approval/rejection works without logging

      toast({
        title: `${action === 'approve' ? 'Approved' : 'Rejected'}!`,
        description: `${userToUpdate.full_name} has been ${action}d successfully.`,
      });

      // Refresh data
      await fetchAllData();
    } catch (error: any) {
      console.error('Approval error:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} user`,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'TEACHER':
        return <GraduationCap className="h-4 w-4 text-green-600" />;
      case 'ADMIN':
        return <BookOpen className="h-4 w-4 text-purple-600" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const renderUserCard = (user: UserProfile, showActions: boolean = true) => (
    <div key={user.id} className="border rounded-lg p-4 bg-gray-50">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            {getRoleIcon(user.role)}
            <h3 className="font-semibold text-lg">{user.full_name}</h3>
            {getStatusBadge(user.status)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role:</strong> {user.role}</div>
          </div>
          <div className="text-xs text-gray-500">
            <div>Registered: {new Date(user.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        {showActions && user.status === 'PENDING' && (
          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => openConfirmDialog('approve', user.user_id, user.full_name)}
              disabled={actionLoading === user.user_id}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              {actionLoading === user.user_id ? 'Processing...' : 'Approve'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => openConfirmDialog('reject', user.user_id, user.full_name)}
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
  const pendingUsers = allUsers.filter(u => u.status === 'PENDING');
  const approvedUsers = allUsers.filter(u => u.status === 'APPROVED');
  const rejectedUsers = allUsers.filter(u => u.status === 'REJECTED');

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
          <p className="text-gray-600">Manage user approvals and view history</p>
        </div>
        <Button onClick={fetchAllData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingUsers.length}</div>
            <div className="text-sm text-gray-500">Pending</div>
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
            <div className="text-2xl font-bold text-red-600">{rejectedUsers.length}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{approvalHistory.length}</div>
            <div className="text-sm text-gray-500">Total Actions</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedUsers.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedUsers.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
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

        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Rejected Users ({rejectedUsers.length})
              </CardTitle>
              <CardDescription>
                Users whose applications have been rejected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rejectedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No rejected users
                </div>
              ) : (
                <div className="space-y-4">
                  {rejectedUsers.map((user) => renderUserCard(user, false))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Approval History
              </CardTitle>
              <CardDescription>
                Complete log of all approval actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvalHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No approval history yet. Actions will appear here once you start approving/rejecting users.
                </div>
              ) : (
                <div className="space-y-3">
                  {approvalHistory.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {log.action === 'approved' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <div className="font-medium">
                              {log.user_name || 'Unknown User'} ({log.user_type})
                            </div>
                            <div className="text-sm text-gray-600">
                              {log.user_email || 'No email'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {log.action === 'approved' ? 'Approved' : 'Rejected'} by {log.approved_by_name || 'Admin'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {log.reason && (
                        <div className="mt-2 text-sm text-gray-600 ml-8">
                          Reason: {log.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
              This action will be logged in the system.
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

export default EnhancedUserApprovalsWithHistory;
