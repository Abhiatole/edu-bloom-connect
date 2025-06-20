
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Users, History, AlertTriangle } from 'lucide-react';

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  user_type: 'student' | 'teacher';
  class_level?: number;
  subject_expertise?: string;
  experience_years?: number;
  guardian_name?: string;
  guardian_mobile?: string;
  created_at: string;
}

const EnhancedUserApprovalsWithHistory = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPendingUsers(),
        fetchApprovalHistory()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      // Get pending students
      const { data: students, error: studentsError } = await supabase
        .from('student_profiles')
        .select('*')
        .is('approval_date', null);

      if (studentsError) throw studentsError;

      // Get pending teachers  
      const { data: teachers, error: teachersError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .is('approval_date', null);

      if (teachersError) throw teachersError;

      // Transform data
      const pendingStudents = students?.map(student => ({
        id: student.id,
        user_id: student.user_id,
        full_name: student.full_name,
        email: student.email,
        user_type: 'student' as const,
        class_level: student.class_level,
        guardian_name: student.guardian_name,
        guardian_mobile: student.guardian_mobile,
        created_at: student.created_at
      })) || [];

      const pendingTeachers = teachers?.map(teacher => ({
        id: teacher.id,
        user_id: teacher.user_id,
        full_name: teacher.full_name,
        email: teacher.email,
        user_type: 'teacher' as const,
        subject_expertise: teacher.subject_expertise,
        experience_years: teacher.experience_years,
        created_at: teacher.created_at
      })) || [];

      setPendingUsers([...pendingStudents, ...pendingTeachers]);
    } catch (error) {
      console.error('Error fetching pending users:', error);
    }
  };

  const fetchApprovalHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('approval_history')
        .select('*')
        .order('approval_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setApprovalHistory(data || []);
    } catch (error) {
      console.error('Error fetching approval history:', error);
    }
  };

  const handleApproval = async (userId: string, userType: 'student' | 'teacher', action: 'approve' | 'reject') => {
    if (processingIds.has(userId)) return;

    setProcessingIds(prev => new Set([...prev, userId]));

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      // Call the handle_user_approval function
      const { data, error } = await supabase.rpc('handle_user_approval', {
        p_user_id: userId,
        p_user_type: userType,
        p_action: action,
        p_approved_by: currentUser.user.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${action === 'approve' ? 'approved' : 'rejected'} successfully`
      });

      // Refresh data
      await fetchData();
    } catch (error: any) {
      console.error(`Error ${action}ing user:`, error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} user`,
        variant: "destructive"
      });
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading user approvals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Approvals & History</h2>
          <p className="text-gray-600">Manage user registrations and view approval history</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-gray-600">{pendingUsers.length} Pending</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pending Approvals ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Approval History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pending User Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending user registrations
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.user_type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.user_type === 'student' ? (
                            <div className="text-sm">
                              <div>Class: {user.class_level}</div>
                              {user.guardian_name && (
                                <div className="text-gray-500">Guardian: {user.guardian_name}</div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm">
                              <div>Subject: {user.subject_expertise}</div>
                              <div className="text-gray-500">Experience: {user.experience_years} years</div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproval(user.user_id, user.user_type, 'approve')}
                              disabled={processingIds.has(user.user_id)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproval(user.user_id, user.user_type, 'reject')}
                              disabled={processingIds.has(user.user_id)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Approval History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvalHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No approval history available
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Approved By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvalHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {entry.user_name || 'Unknown User'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {entry.user_type?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(entry.action)}</TableCell>
                        <TableCell>{entry.approved_by_name || 'Admin'}</TableCell>
                        <TableCell>
                          {new Date(entry.approval_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {entry.reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedUserApprovalsWithHistory;
