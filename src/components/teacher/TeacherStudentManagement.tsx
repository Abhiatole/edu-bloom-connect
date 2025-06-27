import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Eye,
  UserCheck,
  Trash2,
  RefreshCw,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  UserX
} from 'lucide-react';

interface Student {
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

interface TeacherStudentManagementProps {
  teacherId: string;
  teacherSubjects: string[];
}

const TeacherStudentManagement: React.FC<TeacherStudentManagementProps> = ({ 
  teacherId, 
  teacherSubjects = ['Physics', 'Chemistry', 'Mathematics'] // Default subjects for demo
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeacherStudents();
  }, [teacherId, teacherSubjects]);

  const fetchTeacherStudents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching students for teacher:', teacherId);
      console.log('👨‍🏫 Teacher subjects:', teacherSubjects);

      // For now, get all students and filter by class level (11 and 12 for science subjects)
      // In a real implementation, you would filter by actual subject assignments
      let query = supabase
        .from('student_profiles')
        .select('*')
        .in('class_level', ['11', '12']) // Science classes
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching students:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} students for teacher`);
      setStudents(data || []);
    } catch (error: any) {
      console.error('💥 Failed to fetch teacher students:', error);
      toast({
        title: "Error",
        description: `Failed to load students: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveStudent = async (studentId: string) => {
    try {
      setApproving(studentId);
      console.log('✅ Teacher approving student:', studentId);

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('student_profiles')
        .update({
          status: 'APPROVED',
          approved_by: currentUser.user.id,
          approval_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Student Approved!",
        description: "Student has been approved for your subject.",
      });

      fetchTeacherStudents(); // Refresh the list
    } catch (error: any) {
      console.error('💥 Failed to approve student:', error);
      toast({
        title: "Error",
        description: `Failed to approve student: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setApproving(null);
    }
  };

  const deleteStudent = async (studentId: string) => {
    try {
      setDeleting(studentId);
      console.log('🗑️ Teacher deleting student:', studentId);

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      // Soft delete by updating status to 'REJECTED' with deletion reason
      const { error } = await supabase
        .from('student_profiles')
        .update({
          status: 'REJECTED',
          rejected_by: currentUser.user.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: `Student removed from ${teacherSubjects.join(', ')} by subject teacher`,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Student Removed!",
        description: "Student has been removed from your subject.",
      });

      fetchTeacherStudents(); // Refresh the list
    } catch (error: any) {
      console.error('💥 Failed to delete student:', error);
      toast({
        title: "Error",
        description: `Failed to remove student: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStudentSubjects = (student: Student) => {
    // Based on class level, return relevant subjects for this teacher
    const classLevel = parseInt(student.class_level);
    if (classLevel >= 11) {
      return teacherSubjects; // Return teacher's subjects
    } else {
      return ['General Science']; // For lower classes
    }
  };

  const getBatches = (student: Student) => {
    const classLevel = parseInt(student.class_level);
    if (classLevel >= 11) {
      return ['NEET Batch', 'JEE Batch'];
    } else {
      return ['Regular Batch'];
    }
  };

  const pendingStudents = students.filter(s => s.status === 'PENDING');
  const approvedStudents = students.filter(s => s.status === 'APPROVED');
  const totalStudents = students.length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading your students...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Students</h2>
          <p className="text-muted-foreground">
            Students registered for your subjects: {teacherSubjects.join(', ')}
          </p>
        </div>
        <Button onClick={fetchTeacherStudents} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">My Subjects</p>
                <p className="text-sm font-bold text-blue-600">{teacherSubjects.length} subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Students Section */}
      {pendingStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-yellow-600" />
              Pending Approvals ({pendingStudents.length})
            </CardTitle>
            <CardDescription>
              Students waiting for your approval to join your subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-semibold">{student.full_name}</h4>
                      <p className="text-sm text-muted-foreground">Class {student.class_level} • {student.enrollment_no}</p>
                      <p className="text-sm text-muted-foreground">{student.email || student.parent_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => approveStudent(student.id)}
                      disabled={approving === student.id}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {approving === student.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <UserCheck className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <UserX className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject Student</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to reject {student.full_name} from your subjects?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteStudent(student.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Reject Student
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>All My Students ({students.length})</CardTitle>
          <CardDescription>
            Students registered for your subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Your Subjects</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{student.full_name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {student.email || student.parent_email}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          {student.enrollment_no}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Class {student.class_level}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStudentSubjects(student).map(subject => (
                          <Badge key={subject} variant="secondary" className="mr-1 mb-1">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getBatches(student).map(batch => (
                          <Badge key={batch} variant="outline" className="mr-1 mb-1">
                            {batch}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(student.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* View Profile */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedStudent(student)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Student Profile</DialogTitle>
                              <DialogDescription>
                                Student details for your subjects
                              </DialogDescription>
                            </DialogHeader>
                            {selectedStudent && (
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold">{selectedStudent.full_name}</h4>
                                  <p className="text-sm text-muted-foreground">Class {selectedStudent.class_level}</p>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center text-sm">
                                    <Mail className="w-4 h-4 mr-2" />
                                    {selectedStudent.email || selectedStudent.parent_email}
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Phone className="w-4 h-4 mr-2" />
                                    {selectedStudent.guardian_mobile}
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <GraduationCap className="w-4 h-4 mr-2" />
                                    {selectedStudent.enrollment_no}
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Registered on {new Date(selectedStudent.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Guardian: {selectedStudent.guardian_name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Subjects: {getStudentSubjects(selectedStudent).join(', ')}
                                  </p>
                                  <p className="text-sm text-muted-foreground">Status: {getStatusBadge(selectedStudent.status)}</p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {/* Approve Button (if pending) */}
                        {student.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveStudent(student.id)}
                            className="text-green-600 hover:text-green-700"
                            disabled={approving === student.id}
                          >
                            {approving === student.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                        )}

                        {/* Remove/Delete Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              disabled={deleting === student.id}
                            >
                              {deleting === student.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Student</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {student.full_name} from your subjects? 
                                This will remove them from {teacherSubjects.join(', ')}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteStudent(student.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove Student
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {students.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No students assigned</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No students have registered for your subjects yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherStudentManagement;
