
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, UserX, Clock, GraduationCap, BookOpen } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  email: string;
  class_level: number;
  guardian_name: string;
  guardian_mobile: string;
  status: string;
  created_at: string;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  subject_expertise: string;
  experience_years: number;
  status: string;
  created_at: string;
}

const UserApprovals = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'approve' | 'reject';
    userType: 'student' | 'teacher';
    userId: string;
    userName: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const [studentsResult, teachersResult] = await Promise.all([
        supabase.from('student_profiles').select('*').eq('status', 'PENDING').order('created_at', { ascending: false }),
        supabase.from('teacher_profiles').select('*').eq('status', 'PENDING').order('created_at', { ascending: false })
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (teachersResult.error) throw teachersResult.error;

      setStudents(studentsResult.data || []);
      setTeachers(teachersResult.data || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "Failed to load pending users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userType: 'student' | 'teacher', userId: string, action: 'approve' | 'reject') => {
    setActionLoading(userId);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const table = userType === 'student' ? 'student_profiles' : 'teacher_profiles';
      const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

      const { error: updateError } = await supabase
        .from(table)
        .update({
          status,
          approved_by: currentUser.user.id,
          approval_date: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Log the approval action
      const { error: logError } = await supabase
        .from('approval_logs')
        .insert({
          approved_user_id: userId,
          approved_by: currentUser.user.id,
          user_type: userType,
          action: action + 'd',
          reason: `${action === 'approve' ? 'Approved' : 'Rejected'} by admin`
        });

      if (logError) console.error('Failed to log approval:', logError);

      toast({
        title: `${action === 'approve' ? 'Approved' : 'Rejected'}!`,
        description: `${userType.charAt(0).toUpperCase() + userType.slice(1)} has been ${action}d successfully.`,
      });

      // Refresh the data
      fetchPendingUsers();
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

  const openConfirmDialog = (type: 'approve' | 'reject', userType: 'student' | 'teacher', userId: string, userName: string) => {
    setConfirmDialog({ isOpen: true, type, userType, userId, userName });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading pending approvals...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Approvals</h2>
          <p className="text-gray-600">Review and approve pending registrations</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{students.length}</div>
            <div className="text-sm text-gray-500">Pending Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{teachers.length}</div>
            <div className="text-sm text-gray-500">Pending Teachers</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="students" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students ({students.length})
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Teachers ({teachers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Pending Student Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending student registrations
                </div>
              ) : (
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{student.full_name}</h3>
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div><strong>Email:</strong> {student.email}</div>
                            <div><strong>Class:</strong> {student.class_level}</div>
                            <div><strong>Guardian:</strong> {student.guardian_name}</div>
                            <div><strong>Contact:</strong> {student.guardian_mobile}</div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Registered: {new Date(student.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openConfirmDialog('approve', 'student', student.id, student.full_name)}
                            disabled={actionLoading === student.id}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openConfirmDialog('reject', 'student', student.id, student.full_name)}
                            disabled={actionLoading === student.id}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Pending Teacher Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teachers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending teacher registrations
                </div>
              ) : (
                <div className="space-y-4">
                  {teachers.map((teacher) => (
                    <div key={teacher.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{teacher.full_name}</h3>
                            <Badge variant="outline" className="text-orange-600 border-orange-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div><strong>Email:</strong> {teacher.email}</div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <strong>Subject:</strong> {teacher.subject_expertise}
                            </div>
                            <div><strong>Experience:</strong> {teacher.experience_years} years</div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Registered: {new Date(teacher.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openConfirmDialog('approve', 'teacher', teacher.id, teacher.full_name)}
                            disabled={actionLoading === teacher.id}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openConfirmDialog('reject', 'teacher', teacher.id, teacher.full_name)}
                            disabled={actionLoading === teacher.id}
                          >
                            <UserX className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
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
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDialog) {
                  handleApproval(confirmDialog.userType, confirmDialog.userId, confirmDialog.type);
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

export default UserApprovals;
