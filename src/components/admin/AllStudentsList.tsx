import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Search,
  Filter,
  Eye,
  UserCheck,
  Trash2,
  Download,
  RefreshCw,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  class_level: number;
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
  // Additional fields from actual Supabase schema
  address?: string;
  date_of_birth?: string;
  parent_phone?: string;
}

interface AllStudentsListProps {
  userType: 'admin' | 'teacher';
  teacherId?: string;
}

const AllStudentsList: React.FC<AllStudentsListProps> = ({ userType, teacherId }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, [userType, teacherId]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter, classFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching students for:', userType);

      let query = supabase
        .from('student_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // For teachers, we would filter by their subjects here
      // For now, show all students for demo purposes
      if (userType === 'teacher' && teacherId) {
        console.log('👨‍🏫 Teacher view - showing relevant students');
        // Add teacher-specific filtering logic here when subject assignment is implemented
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching students:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} students`);
      
      // Map the data to ensure all required fields are present
      const mappedStudents = (data || []).map((student: any) => ({
        id: student.id,
        user_id: student.user_id,
        full_name: student.full_name || 'N/A',
        email: student.email || 'N/A',
        class_level: student.class_level || 11,
        guardian_name: student.guardian_name || 'N/A',
        guardian_mobile: student.guardian_mobile || student.parent_phone || 'N/A',
        status: student.status,
        approved_by: student.approved_by,
        approval_date: student.approval_date,
        created_at: student.created_at,
        updated_at: student.updated_at,
        rejection_reason: student.rejection_reason,
        rejected_at: student.rejected_at,
        rejected_by: student.rejected_by,
        enrollment_no: student.enrollment_no,
        parent_email: student.parent_email || 'N/A',
        student_mobile: student.student_mobile,
        address: student.address,
        date_of_birth: student.date_of_birth,
        parent_phone: student.parent_phone
      }));
      
      setStudents(mappedStudents);
    } catch (error: any) {
      console.error('💥 Failed to fetch students:', error);
      toast({
        title: "Error",
        description: `Failed to load students: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollment_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parent_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    // Class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter(student => student.class_level.toString() === classFilter);
    }

    setFilteredStudents(filtered);
  };

  const approveStudent = async (studentId: string) => {
    try {
      console.log('✅ Approving student:', studentId);

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
        description: "Student has been approved successfully.",
      });

      fetchStudents(); // Refresh the list
    } catch (error: any) {
      console.error('💥 Failed to approve student:', error);
      toast({
        title: "Error",
        description: `Failed to approve student: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const deleteStudent = async (studentId: string) => {
    try {
      setDeleting(studentId);
      console.log('🗑️ Deleting student:', studentId);

      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      // Soft delete by updating status to 'REJECTED' with deletion reason
      const { error } = await supabase
        .from('student_profiles')
        .update({
          status: 'REJECTED',
          rejected_by: currentUser.user.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: 'Student record deleted by administrator',
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Student Deleted!",
        description: "Student has been deleted successfully.",
      });

      fetchStudents(); // Refresh the list
    } catch (error: any) {
      console.error('💥 Failed to delete student:', error);
      toast({
        title: "Error",
        description: `Failed to delete student: ${error.message}`,
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

  const getSubjects = (student: Student) => {
    // Generate subjects based on class level for demo
    const classLevel = student.class_level;
    if (classLevel >= 11) {
      return ['Physics', 'Chemistry', 'Mathematics'];
    } else if (classLevel >= 9) {
      return ['Mathematics', 'Science', 'English'];
    } else {
      return ['General Studies'];
    }
  };

  const getBatches = (student: Student) => {
    // Generate batches based on class level for demo
    const classLevel = student.class_level;
    if (classLevel >= 11) {
      return ['NEET Batch', 'JEE Batch'];
    } else {
      return ['Regular Batch'];
    }
  };

  const uniqueClasses = [...new Set(students.map(s => s.class_level.toString()))].sort();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading students...
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
          <h2 className="text-2xl font-bold tracking-tight">All Students</h2>
          <p className="text-muted-foreground">
            Manage and view all registered students
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchStudents} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
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
                <p className="text-2xl font-bold text-green-600">
                  {students.filter(s => s.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {students.filter(s => s.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-600" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {students.filter(s => s.status === 'REJECTED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or enrollment number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map(className => (
                  <SelectItem key={className} value={className}>Class {className}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students List ({filteredStudents.length})</CardTitle>
          <CardDescription>
            {userType === 'admin' ? 'All registered students' : 'Students in your subjects'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
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
                        {getSubjects(student).map(subject => (
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
                                Detailed information about the student
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
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Delete Button */}
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
                              <AlertDialogTitle>Delete Student</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {student.full_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteStudent(student.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Student
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
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No students found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || classFilter !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'No students have been registered yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllStudentsList;
