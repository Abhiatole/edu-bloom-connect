import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Plus, Upload, Download, Trash2, UserPlus, FileSpreadsheet, CheckSquare, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Student {
  id: string;
  user_id: string;
  enrollment_no: string;
  full_name: string;
  email: string;
  class_level: number;
  guardian_name?: string;
  guardian_mobile?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

const StudentManagementPanel = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  
  // Selection and bulk operations
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject' | 'delete';
    count: number;
  } | null>(null);
  
  // CSV Import
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importDialog, setImportDialog] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  
  // Individual student creation
  const [createDialog, setCreateDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({
    full_name: '',
    email: '',
    class_level: 11,
    guardian_name: '',
    guardian_mobile: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, statusFilter, classFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch students",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        student.full_name?.toLowerCase().includes(query) ||
        student.enrollment_no?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    // Filter by class
    if (classFilter !== 'all') {
      filtered = filtered.filter(student => student.class_level.toString() === classFilter);
    }

    setFilteredStudents(filtered);
  };

  const handleCreateStudent = async () => {
    try {
      if (!newStudent.full_name || !newStudent.email) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      // Generate enrollment number
      const enrollmentNo = `S${(1000 + students.length).toString()}`;

      const { data, error } = await supabase
        .from('student_profiles')
        .insert({
          full_name: newStudent.full_name,
          email: newStudent.email,
          class_level: newStudent.class_level,
          guardian_name: newStudent.guardian_name,
          guardian_mobile: newStudent.guardian_mobile,
          enrollment_no: enrollmentNo,
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) throw error;

      setStudents(prev => [data, ...prev]);
      setCreateDialog(false);
      setNewStudent({
        full_name: '',
        email: '',
        class_level: 11,
        guardian_name: '',
        guardian_mobile: ''
      });

      toast({
        title: "Success",
        description: "Student created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create student",
        variant: "destructive"
      });
    }
  };

  const handleCsvImport = async () => {
    if (!csvFile) return;

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const requiredHeaders = ['full_name', 'email', 'class_level'];
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      
      if (missingHeaders.length > 0) {
        toast({
          title: "Error",
          description: `Missing required columns: ${missingHeaders.join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      const studentsToCreate = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const studentData: any = {};
        
        headers.forEach((header, index) => {
          studentData[header] = values[index] || '';
        });

        if (studentData.full_name && studentData.email) {
          studentsToCreate.push({
            full_name: studentData.full_name,
            email: studentData.email,
            class_level: parseInt(studentData.class_level) || 11,
            guardian_name: studentData.guardian_name || '',
            guardian_mobile: studentData.guardian_mobile || '',
            enrollment_no: `S${(1000 + students.length + i).toString()}`,
            status: 'PENDING'
          });
        }
      }

      if (studentsToCreate.length === 0) {
        toast({
          title: "Error",
          description: "No valid student data found in CSV",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('student_profiles')
        .insert(studentsToCreate)
        .select();

      if (error) throw error;

      setStudents(prev => [...(data || []), ...prev]);
      setImportDialog(false);
      setCsvFile(null);
      setCsvPreview([]);

      toast({
        title: "Success",
        description: `${studentsToCreate.length} students imported successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import students",
        variant: "destructive"
      });
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedStudents.size === 0) return;

    try {
      const studentIds = Array.from(selectedStudents);
      
      if (action === 'delete') {
        const { error } = await supabase
          .from('student_profiles')
          .delete()
          .in('id', studentIds);
        
        if (error) throw error;
        
        setStudents(prev => prev.filter(s => !selectedStudents.has(s.id)));
        
        toast({
          title: "Success",
          description: `${studentIds.length} student(s) deleted successfully`,
        });
      } else {
        const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
        const { data: currentUser } = await supabase.auth.getUser();
        
        const { error } = await supabase
          .from('student_profiles')
          .update({
            status,
            approval_date: action === 'approve' ? new Date().toISOString() : null,
            approved_by: currentUser.user?.id,
            updated_at: new Date().toISOString()
          })
          .in('id', studentIds);

        if (error) throw error;

        setStudents(prev => prev.map(student => 
          selectedStudents.has(student.id) 
            ? { ...student, status: status as any }
            : student
        ));

        toast({
          title: "Success",
          description: `${studentIds.length} student(s) ${action}d successfully`,
        });
      }

      setSelectedStudents(new Set());
      setBulkActionDialog(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} students`,
        variant: "destructive"
      });
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(studentId)) {
        newSelection.delete(studentId);
      } else {
        newSelection.add(studentId);
      }
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const exportToCSV = () => {
    const headers = ['Full Name', 'Email', 'Enrollment No', 'Class', 'Guardian Name', 'Guardian Mobile', 'Status', 'Created At'];
    const rows = filteredStudents.map(student => [
      student.full_name,
      student.email,
      student.enrollment_no,
      student.class_level,
      student.guardian_name || '',
      student.guardian_mobile || '',
      student.status,
      new Date(student.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: "Student data exported successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Management
              </CardTitle>
              <CardDescription>
                Manage student registrations, approvals, and bulk operations
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setCreateDialog(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
              <Button onClick={() => setImportDialog(true)} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, email, or enrollment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="class">Class</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchStudents} variant="outline" className="w-full">
                Refresh
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedStudents.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedStudents.size} student(s) selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setBulkActionDialog({ isOpen: true, action: 'approve', count: selectedStudents.size })}
                  >
                    Approve Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkActionDialog({ isOpen: true, action: 'reject', count: selectedStudents.size })}
                  >
                    Reject Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBulkActionDialog({ isOpen: true, action: 'delete', count: selectedStudents.size })}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Students List */}
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                Select All ({filteredStudents.length} students)
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No students found</p>
                <p className="text-sm">Try adjusting your filters or add new students</p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div 
                  key={student.id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedStudents.has(student.id) ? 'border-blue-500 bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedStudents.has(student.id)}
                      onCheckedChange={() => toggleStudentSelection(student.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{student.full_name}</h3>
                            <Badge 
                              variant={
                                student.status === 'APPROVED' ? 'default' :
                                student.status === 'REJECTED' ? 'destructive' : 'secondary'
                              }
                            >
                              {student.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                            <span>Email: {student.email}</span>
                            <span>Enrollment: {student.enrollment_no}</span>
                            <span>Class: {student.class_level}</span>
                            <span>Guardian: {student.guardian_name || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {student.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleBulkAction('approve')}
                                disabled={selectedStudents.size === 0}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkAction('reject')}
                                disabled={selectedStudents.size === 0}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedStudents(new Set([student.id]));
                              setBulkActionDialog({ isOpen: true, action: 'delete', count: 1 });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Student Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={newStudent.full_name}
                onChange={(e) => setNewStudent(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter student's full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter student's email"
              />
            </div>
            <div>
              <Label htmlFor="class_level">Class</Label>
              <Select 
                value={newStudent.class_level.toString()} 
                onValueChange={(value) => setNewStudent(prev => ({ ...prev, class_level: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="guardian_name">Guardian Name</Label>
              <Input
                id="guardian_name"
                value={newStudent.guardian_name}
                onChange={(e) => setNewStudent(prev => ({ ...prev, guardian_name: e.target.value }))}
                placeholder="Enter guardian's name"
              />
            </div>
            <div>
              <Label htmlFor="guardian_mobile">Guardian Mobile</Label>
              <Input
                id="guardian_mobile"
                value={newStudent.guardian_mobile}
                onChange={(e) => setNewStudent(prev => ({ ...prev, guardian_mobile: e.target.value }))}
                placeholder="Enter guardian's mobile number"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateStudent} className="flex-1">
                Create Student
              </Button>
              <Button onClick={() => setCreateDialog(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Students from CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                CSV should contain columns: full_name, email, class_level, guardian_name (optional), guardian_mobile (optional)
              </AlertDescription>
            </Alert>
            <div>
              <Label htmlFor="csv_file">CSV File</Label>
              <Input
                id="csv_file"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
            </div>
            {csvFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCsvImport} disabled={!csvFile} className="flex-1">
                Import Students
              </Button>
              <Button onClick={() => setImportDialog(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={bulkActionDialog?.isOpen} onOpenChange={(open) => !open && setBulkActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {bulkActionDialog?.action?.charAt(0).toUpperCase()}{bulkActionDialog?.action?.slice(1)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkActionDialog?.action} {bulkActionDialog?.count} student(s)?
              {bulkActionDialog?.action === 'delete' && ' This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkActionDialog && handleBulkAction(bulkActionDialog.action)}
              className={bulkActionDialog?.action === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {bulkActionDialog?.action?.charAt(0).toUpperCase()}{bulkActionDialog?.action?.slice(1)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StudentManagementPanel;
