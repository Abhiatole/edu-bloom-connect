import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, Users, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  user_type: 'student' | 'teacher';
  additional_info: string;
}
const QuickApprovalDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pendingStudents: 0,
    pendingTeachers: 0,
    totalApproved: 0
  });
  const { toast } = useToast();
  useEffect(() => {
    fetchPendingUsers();
  }, []);
  const fetchPendingUsers = async () => {
    try {
      const [studentsResult, teachersResult, approvedResult] = await Promise.all([
        supabase.from('student_profiles')
          .select('id, full_name, email, status, created_at, class_level, guardian_name')
          .eq('status', 'PENDING'),
        supabase.from('teacher_profiles')
          .select('id, full_name, email, status, created_at, subject_expertise, experience_years')
          .eq('status', 'PENDING'),
        supabase.from('student_profiles')
          .select('*', { count: 'exact' })
          .eq('status', 'APPROVED')
      ]);
      if (studentsResult.error) throw studentsResult.error;
      if (teachersResult.error) throw teachersResult.error;
      // Transform data for unified display
      const students: PendingUser[] = (studentsResult.data || []).map(s => ({
        id: s.id,
        full_name: s.full_name,
        email: s.email,
        status: s.status,
        created_at: s.created_at,
        user_type: 'student' as const,
        additional_info: `Class ${s.class_level} - Guardian: ${s.guardian_name}`
      }));
      const teachers: PendingUser[] = (teachersResult.data || []).map(t => ({
        id: t.id,
        full_name: t.full_name,
        email: t.email,
        status: t.status,
        created_at: t.created_at,
        user_type: 'teacher' as const,
        additional_info: `${t.subject_expertise} (${t.experience_years} years exp.)`
      }));
      const allPending = [...students, ...teachers].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setPendingUsers(allPending);
      setStats({
        pendingStudents: students.length,
        pendingTeachers: teachers.length,
        totalApproved: approvedResult.count || 0
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pending users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleQuickAction = async (userId: string, userType: 'student' | 'teacher', action: 'approve' | 'reject') => {
    setActionLoading(userId);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');
      const table = userType === 'student' ? 'student_profiles' : 'teacher_profiles';
      const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
      const { error } = await supabase
        .from(table)
        .update({
          status,
          approved_by: currentUser.user.id,
          approval_date: new Date().toISOString()
        })
        .eq('id', userId);
      if (error) throw error;
      toast({
        title: `${action === 'approve' ? 'Approved' : 'Rejected'}!`,
        description: `${userType.charAt(0).toUpperCase() + userType.slice(1)} ${action}d successfully.`,
      });
      // Refresh data
      fetchPendingUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} user`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };
  const bulkApproveAll = async () => {
    if (pendingUsers.length === 0) return;
    
    setLoading(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');
      const students = pendingUsers.filter(u => u.user_type === 'student');
      const teachers = pendingUsers.filter(u => u.user_type === 'teacher');
      const updates = [];
      if (students.length > 0) {
        updates.push(
          supabase.from('student_profiles')
            .update({
              status: 'APPROVED',
              approved_by: currentUser.user.id,
              approval_date: new Date().toISOString()
            })
            .in('id', students.map(s => s.id))
        );
      }
      if (teachers.length > 0) {
        updates.push(
          supabase.from('teacher_profiles')
            .update({
              status: 'APPROVED',
              approved_by: currentUser.user.id,
              approval_date: new Date().toISOString()
            })
            .in('id', teachers.map(t => t.id))
        );
      }
      const results = await Promise.all(updates);
      
      // Check for errors
      results.forEach(result => {
        if (result.error) throw result.error;
      });
      toast({
        title: "Bulk Approval Complete!",
        description: `Approved ${pendingUsers.length} users successfully.`,
      });
      fetchPendingUsers();
    } catch (error: any) {
      toast({
        title: "Bulk Approval Failed",
        description: error.message || "Failed to approve users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading approval dashboard...
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quick Approval Dashboard</h2>
          <p className="text-gray-600">Fast-track user approvals</p>
        </div>
        <Button onClick={fetchPendingUsers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Students</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pendingStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Teachers</p>
                <p className="text-2xl font-bold text-green-600">{stats.pendingTeachers}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Approved</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalApproved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Bulk Actions */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bulk Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={bulkApproveAll} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve All ({pendingUsers.length})
              </Button>
              <Button variant="outline" asChild>
                <a href="/admin/approvals">
                  Detailed Review
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Pending Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals ({pendingUsers.length})</CardTitle>
          <CardDescription>
            Users waiting for approval to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                🎉 No pending approvals! All users have been processed.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{user.full_name}</span>
                      <Badge variant={user.user_type === 'student' ? 'default' : 'secondary'}>
                        {user.user_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500">{user.additional_info}</p>
                    <p className="text-xs text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleQuickAction(user.id, user.user_type, 'approve')}
                      disabled={actionLoading === user.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickAction(user.id, user.user_type, 'reject')}
                      disabled={actionLoading === user.id}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default QuickApprovalDashboard;
