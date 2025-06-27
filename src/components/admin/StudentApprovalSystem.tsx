import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  UserCheck,
  UserX,
  Clock,
  GraduationCap,
  BookOpen,
  Users,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

// Updated interface based on actual database schema
interface PendingStudent {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  class_level: string;
  guardian_name: string;
  guardian_mobile: string;
  status: string;
  approved_by: string | null;
  approval_date: string | null;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  enrollment_no: string;
  parent_email: string;
  student_mobile: string | null;
}

interface StudentApprovalSystemProps {
  userType: 'admin' | 'teacher';
  teacherSubjects?: string[];
}

const StudentApprovalSystem: React.FC<StudentApprovalSystemProps> = ({ userType, teacherSubjects = [] }) => {
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<PendingStudent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingStudents();
  }, [userType, teacherSubjects]);

  const fetchPendingStudents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching pending students for:', userType);

      // Simplified query that works with actual schema
      let query = supabase
        .from('student_profiles')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      // For teachers, we'll implement subject filtering later
      // when we have the proper subject data structure
      if (userType === 'teacher' && teacherSubjects.length > 0) {
        console.log('👨‍🏫 Teacher subjects filter (will be implemented):', teacherSubjects);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching pending students:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} pending students`);
      setPendingStudents(data || []);
    } catch (error: any) {
      console.error('💥 Failed to fetch pending students:', error);
      toast({
        title: "Error",
        description: `Failed to load pending students: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveStudent = async (studentId: string) => {
    try {
      setApproving(studentId);
      console.log('✅ Approving student:', studentId);

      // Get current user for approval tracking
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('student_profiles')
        .update({
          status: 'APPROVED',
          // is_approved: true,  // Will work after migration
          approved_by: currentUser.user.id,
          approval_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;

      // Remove from pending list
      setPendingStudents(prev => prev.filter(s => s.id !== studentId));

      toast({
        title: "Student Approved!",
        description: "The student has been successfully approved and can now access their dashboard.",
      });

      console.log('🎉 Student approved successfully');
    } catch (error: any) {
      console.error('💥 Failed to approve student:', error);
      toast({
        title: "Approval Failed",
        description: `Failed to approve student: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setApproving(null);
    }
  };

  const rejectStudent = async (studentId: string, reason: string) => {
    try {
      setRejecting(studentId);
      console.log('❌ Rejecting student:', studentId, 'Reason:', reason);

      // Get current user for rejection tracking
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('student_profiles')
        .update({
          status: 'REJECTED',
          // is_approved: false,  // Will work after migration
          rejected_by: currentUser.user.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;

      // Remove from pending list
      setPendingStudents(prev => prev.filter(s => s.id !== studentId));
      setRejectionReason('');
      setSelectedStudent(null);

      toast({
        title: "Student Rejected",
        description: "The student has been rejected with the provided reason.",
      });

      console.log('🚫 Student rejected successfully');
    } catch (error: any) {
      console.error('💥 Failed to reject student:', error);
      toast({
        title: "Rejection Failed",
        description: `Failed to reject student: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setRejecting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Student Approval System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading pending students...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Student Approval System
            {userType === 'teacher' && <Badge variant="outline">Teacher View</Badge>}
          </CardTitle>
          <CardDescription>
            {userType === 'admin' 
              ? 'Review and approve/reject student registrations' 
              : `Review students who selected your subjects: ${teacherSubjects.join(', ')}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingStudents.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
              <p className="text-gray-600">All student registrations have been processed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Pending Students ({pendingStudents.length})
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchPendingStudents}
                >
                  Refresh
                </Button>
              </div>

              <div className="grid gap-4">
                {pendingStudents.map((student) => (
                  <Card key={student.id} className="border-l-4 border-l-yellow-400">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-lg font-semibold">{student.full_name}</h4>
                            {getStatusBadge(student.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <span>{student.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-gray-500" />
                                <span>Class {student.class_level}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>Applied: {new Date(student.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span>Guardian: {student.guardian_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-500" />
                                <span>Contact: {student.guardian_mobile}</span>
                              </div>
                              {student.student_mobile && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-500" />
                                  <span>Student: {student.student_mobile}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Show subjects and batches when available after migration */}
                          {student.selected_subjects && student.selected_subjects.length > 0 && (
                            <div className="mt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">Selected Subjects:</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {student.selected_subjects.map((subject) => (
                                  <Badge key={subject} variant="secondary" className="text-xs">
                                    {subject}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {student.selected_batches && student.selected_batches.length > 0 && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">Selected Batches:</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {student.selected_batches.map((batch) => (
                                  <Badge key={batch} variant="outline" className="text-xs">
                                    {batch}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => approveStudent(student.id)}
                            disabled={approving === student.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {approving === student.id ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Approve
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSelectedStudent(student)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Student Registration</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for rejecting {student.full_name}'s registration.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Enter rejection reason..."
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  className="min-h-[100px]"
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedStudent(null);
                                      setRejectionReason('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => rejectStudent(student.id, rejectionReason)}
                                    disabled={!rejectionReason.trim() || rejecting === student.id}
                                  >
                                    {rejecting === student.id ? (
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    ) : (
                                      <XCircle className="w-4 h-4 mr-2" />
                                    )}
                                    Reject Student
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentApprovalSystem;
