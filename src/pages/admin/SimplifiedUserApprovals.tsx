
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserApprovals } from '@/hooks/useUserApprovals';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, UserX, Clock, GraduationCap, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface UserWithProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER';
  is_approved: boolean;
  approval_date: string | null;
  created_at: string | null;
  profile_data: any;
}

const SimplifiedUserApprovals = () => {
  const [allUsers, setAllUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    userId: string;
    userName: string;
    userType: 'STUDENT' | 'TEACHER';
  } | null>(null);
  
  const { toast } = useToast();
  const { approveUser, rejectUser, loading: actionLoading } = useUserApprovals();

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
      // Fetch from user_profiles table which should have all users
      const { data: userProfiles, error: userProfilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('role', ['STUDENT', 'TEACHER'])
        .order('created_at', { ascending: false });

      if (userProfilesError) {
        console.error('Error fetching user profiles:', userProfilesError);
        throw userProfilesError;
      }

      console.log('Fetched user profiles:', userProfiles);

      // Transform the data
      const allUsersData: UserWithProfile[] = (userProfiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        display_name: profile.full_name || 'Unknown User',
        email: profile.email,
        role: profile.role as 'STUDENT' | 'TEACHER',
        is_approved: profile.status === 'APPROVED',
        approval_date: profile.updated_at,
        created_at: profile.created_at,
        profile_data: profile
      }));

      console.log('Transformed users data:', allUsersData);
      setAllUsers(allUsersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  };

  const handleApproval = async (userId: string, userType: 'STUDENT' | 'TEACHER', action: 'approve' | 'reject') => {
    try {
      let success = false;
      
      if (action === 'approve') {
        success = await approveUser(userId, userType);
      } else {
        success = await rejectUser(userId, userType);
      }

      if (success) {
        await fetchAllData(); // Refresh the data
      }
    } catch (error: any) {
      console.error('Approval/Rejection error:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} user`,
        variant: "destructive"
      });
    } finally {
      setConfirmDialog(null);
    }
  };

  const openConfirmDialog = (type: 'approve' | 'reject', userId: string, userName: string, userType: 'STUDENT' | 'TEACHER') => {
    setConfirmDialog({ isOpen: true, type, userId, userName, userType });
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
            <div><strong>Role:</strong> {user.role}</div>
            <div><strong>User ID:</strong> {user.user_id.substring(0, 8)}...</div>
          </div>
          <div className="text-xs text-gray-500">
            <div>Registered: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</div>
            {user.approval_date && user.is_approved && (
              <div>Approved: {new Date(user.approval_date).toLocaleDateString()}</div>
            )}
          </div>
        </div>
        {showActions && !user.is_approved && (
          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => openConfirmDialog('approve', user.user_id, user.display_name, user.role)}
              disabled={actionLoading}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              {actionLoading ? 'Processing...' : 'Approve'}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => openConfirmDialog('reject', user.user_id, user.display_name, user.role)}
              disabled={actionLoading}
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
          <p className="text-gray-600">Manage user approvals</p>
        </div>
        <Button onClick={fetchAllData} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

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
                  handleApproval(confirmDialog.userId, confirmDialog.userType, confirmDialog.type);
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
