import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { ApprovalService, PendingUser } from '@/services/approvalService';
import { NotificationService } from '@/services/notificationService';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  GraduationCap, 
  BookOpen, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  Eye
} from 'lucide-react';

interface ApprovalAction {
  type: 'approve' | 'reject' | 'bulk_approve';
  userIds: string[];
  userType: 'student' | 'teacher';
  reason?: string;
}

const WorkflowManagementDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'student' | 'teacher'>('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    action: ApprovalAction;
    title: string;
    description: string;
  } | null>(null);
  const [viewingUser, setViewingUser] = useState<PendingUser | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const users = await ApprovalService.getPendingUsers();
      setPendingUsers(users);
    } catch (error: any) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (action: ApprovalAction) => {
    setActionLoading(action.userIds[0] || 'bulk');
    try {
      let result;
      
      if (action.type === 'bulk_approve') {
        // Get current user for approver ID
        const { data: currentUser } = await supabase.auth.getUser();
        if (!currentUser.user) throw new Error('Not authenticated');
        
        result = await ApprovalService.bulkApprove(
          action.userIds, 
          action.userType, 
          currentUser.user.id
        );
      } else if (action.type === 'approve') {
        const { data: currentUser } = await supabase.auth.getUser();
        if (!currentUser.user) throw new Error('Not authenticated');
        
        if (action.userType === 'student') {
          result = await ApprovalService.approveStudent(action.userIds[0], currentUser.user.id);
        } else {
          result = await ApprovalService.approveTeacher(action.userIds[0], currentUser.user.id);
        }
      } else if (action.type === 'reject') {
        result = await ApprovalService.rejectUser(action.userIds[0], action.userType, action.reason);
      }

      if (result?.success) {
        toast({
          title: "Success",
          description: result.message,
        });
          // Send notification emails
        const usersToNotify = pendingUsers.filter(user => action.userIds.includes(user.user_id));
        
        for (const user of usersToNotify) {
          if (action.type === 'approve' && (user.role === 'student' || user.role === 'teacher')) {
            await NotificationService.sendApprovalNotification(user.role, {
              email: user.email,
              userName: user.displayName,
              ...user.additionalInfo
            });
          } else if (action.type === 'reject') {
            await NotificationService.sendRejectionNotification({
              email: user.email,
              userName: user.displayName,
              rejectionReason: action.reason || 'No specific reason provided'
            });
          }
        }
        
        // Refresh the list
        await fetchPendingUsers();
        setSelectedUsers([]);
      } else {
        throw new Error(result?.error || 'Action failed');
      }
    } catch (error: any) {
      console.error('Approval action error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process approval action",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
      setConfirmDialog(null);
    }
  };

  const openConfirmDialog = (action: ApprovalAction, user?: PendingUser) => {
    let title = '';
    let description = '';
    
    if (action.type === 'approve') {
      title = `Approve ${user?.role}`;
      description = `Are you sure you want to approve ${user?.displayName}? This will grant them full access to the platform.`;
    } else if (action.type === 'reject') {
      title = `Reject ${user?.role}`;
      description = `Are you sure you want to reject ${user?.displayName}? This action cannot be undone.`;
    } else if (action.type === 'bulk_approve') {
      title = `Bulk Approve ${action.userIds.length} Users`;
      description = `Are you sure you want to approve ${action.userIds.length} ${action.userType}(s)? This will grant them all full access to the platform.`;
    }
    
    setConfirmDialog({
      isOpen: true,
      action,
      title,
      description
    });
  };

  const filteredUsers = pendingUsers.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || user.role === filterType;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: pendingUsers.length,
    students: pendingUsers.filter(u => u.role === 'student').length,
    teachers: pendingUsers.filter(u => u.role === 'teacher').length,
    selectedCount: selectedUsers.length
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const filteredUserIds = filteredUsers.map(u => u.user_id);
    setSelectedUsers(prev => 
      prev.length === filteredUserIds.length 
        ? []
        : filteredUserIds
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-2xl font-bold">{stats.students}</p>
            </div>
            <GraduationCap className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Teachers</p>
              <p className="text-2xl font-bold">{stats.teachers}</p>
            </div>
            <BookOpen className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected</p>
              <p className="text-2xl font-bold">{stats.selectedCount}</p>
            </div>
            <UserCheck className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                User Approval Management
              </CardTitle>
              <CardDescription>
                Review and approve pending user registrations
              </CardDescription>
            </div>
            <Button onClick={fetchPendingUsers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button
                variant={filterType === 'student' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('student')}
              >
                Students
              </Button>
              <Button
                variant={filterType === 'teacher' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('teacher')}
              >
                Teachers
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  onClick={() => {
                    const selectedUserData = filteredUsers.filter(u => selectedUsers.includes(u.user_id));
                    const studentIds = selectedUserData.filter(u => u.role === 'student').map(u => u.user_id);
                    const teacherIds = selectedUserData.filter(u => u.role === 'teacher').map(u => u.user_id);
                    
                    if (studentIds.length > 0) {
                      openConfirmDialog({
                        type: 'bulk_approve',
                        userIds: studentIds,
                        userType: 'student'
                      });
                    }
                    if (teacherIds.length > 0) {
                      openConfirmDialog({
                        type: 'bulk_approve',
                        userIds: teacherIds,
                        userType: 'teacher'
                      });
                    }
                  }}
                  disabled={actionLoading === 'bulk'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* User List */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading pending users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No pending users</h3>
                <p>All user registrations have been processed.</p>
              </div>
            ) : (
              <>
                {/* Select All */}
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Select All ({filteredUsers.length})</span>
                </div>
                
                {/* User Cards */}
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedUsers.includes(user.user_id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.user_id)}
                        onChange={() => handleSelectUser(user.user_id)}
                        className="rounded"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {user.role === 'student' ? (
                            <GraduationCap className="h-4 w-4 text-blue-500" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-purple-500" />
                          )}
                          <h3 className="font-medium">{user.displayName}</h3>
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Registered: {new Date(user.registrationDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"                          onClick={() => openConfirmDialog({
                            type: 'approve',
                            userIds: [user.user_id],
                            userType: user.role as 'student' | 'teacher'
                          }, user)}
                          disabled={actionLoading === user.user_id}
                        >
                          {actionLoading === user.user_id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"                          onClick={() => openConfirmDialog({
                            type: 'reject',
                            userIds: [user.user_id],
                            userType: user.role as 'student' | 'teacher'
                          }, user)}
                          disabled={actionLoading === user.user_id}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <AlertDialog open={confirmDialog.isOpen} onOpenChange={() => setConfirmDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {confirmDialog.action.type === 'reject' && (
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Reason for rejection (optional)</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Provide a reason for rejection..."
                  onChange={(e) => {
                    if (confirmDialog) {
                      setConfirmDialog({
                        ...confirmDialog,
                        action: {
                          ...confirmDialog.action,
                          reason: e.target.value
                        }
                      });
                    }
                  }}
                />
              </div>
            )}
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleApproval(confirmDialog.action)}
                className={confirmDialog.action.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {confirmDialog.action.type === 'approve' ? 'Approve' : 
                 confirmDialog.action.type === 'reject' ? 'Reject' : 'Approve Selected'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* User Details Dialog */}
      {viewingUser && (
        <AlertDialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {viewingUser.role === 'student' ? (
                  <GraduationCap className="h-5 w-5 text-blue-500" />
                ) : (
                  <BookOpen className="h-5 w-5 text-purple-500" />
                )}
                {viewingUser.displayName}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Registration details and information
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-gray-600">{viewingUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Registration Date</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(viewingUser.registrationDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Additional Information</Label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(viewingUser.additionalInfo, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default WorkflowManagementDashboard;
