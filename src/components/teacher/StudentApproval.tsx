import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, UserX, Clock, GraduationCap, Phone, Mail } from 'lucide-react';
import { SubjectService, TeacherStudent } from '@/services/subjectService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StudentApprovalProps {
  teacherUserId: string;
}

const StudentApproval: React.FC<StudentApprovalProps> = ({ teacherUserId }) => {
  const [pendingStudents, setPendingStudents] = useState<TeacherStudent[]>([]);
  const [allStudents, setAllStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (teacherUserId) {
      fetchStudents();
    }
  }, [teacherUserId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const [pending, all] = await Promise.all([
        SubjectService.getTeacherPendingStudents(teacherUserId),
        SubjectService.getTeacherStudents(teacherUserId)
      ]);
      
      setPendingStudents(pending);
      setAllStudents(all);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load students",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (studentId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(studentId);
      
      const result = action === 'approve' 
        ? await SubjectService.approveStudent(studentId, teacherUserId)
        : await SubjectService.rejectStudent(studentId, teacherUserId);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        await fetchStudents(); // Refresh the data
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} student`,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Rejected</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Student Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Student Approvals ({pendingStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingStudents.length === 0 ? (
            <Alert>
              <UserCheck className="h-4 w-4" />
              <AlertDescription>
                🎉 No pending student approvals! All students in your subjects have been processed.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {pendingStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{student.full_name}</h3>
                        <Badge variant="outline">
                          {student.enrollment_no}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Class {student.class_level}
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {student.subject_name}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {student.parent_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.parent_email}
                          </div>
                        )}
                        {student.guardian_mobile && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {student.guardian_mobile}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproval(student.id, 'approve')}
                        disabled={actionLoading === student.id}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => handleApproval(student.id, 'reject')}
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

      {/* All Students */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            All Students in Your Subjects ({allStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No students enrolled in your subjects yet.
            </div>
          ) : (
            <div className="space-y-3">
              {allStudents.map((student) => (
                <div
                  key={student.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium">{student.full_name}</span>
                        <Badge variant="outline">
                          {student.enrollment_no}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Class {student.class_level}
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {student.subject_name}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {student.parent_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.parent_email}
                          </div>
                        )}
                        {student.guardian_mobile && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {student.guardian_mobile}
                          </div>
                        )}
                        {student.approval_date && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            Approved on {new Date(student.approval_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(student.status)}
                    </div>
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

export default StudentApproval;
