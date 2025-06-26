import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, UserCheck, UserX, Trash2, Download, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface Teacher {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  subject_expertise: string;
  experience_years: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  approval_date?: string;
  approved_by?: string;
}

const TeacherManagementPanel = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  
  // Selection and bulk operations
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    isOpen: boolean;
    action: 'approve' | 'reject' | 'delete';
    count: number;
  } | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchTeachers();
  }, []);

  useEffect(() => {
    filterTeachers();
  }, [teachers, searchQuery, statusFilter, subjectFilter]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch teachers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTeachers = () => {
    let filtered = [...teachers];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(teacher => 
        teacher.full_name?.toLowerCase().includes(query) ||
        teacher.email?.toLowerCase().includes(query) ||
        teacher.subject_expertise?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(teacher => teacher.status === statusFilter);
    }

    // Filter by subject
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(teacher => teacher.subject_expertise === subjectFilter);
    }

    setFilteredTeachers(filtered);
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedTeachers.size === 0) return;

    try {
      const teacherIds = Array.from(selectedTeachers);
      
      if (action === 'delete') {
        const { error } = await supabase
          .from('teacher_profiles')
          .delete()
          .in('id', teacherIds);
        
        if (error) throw error;
        
        setTeachers(prev => prev.filter(t => !selectedTeachers.has(t.id)));
        
        toast({
          title: "Success",
          description: `${teacherIds.length} teacher(s) deleted successfully`,
        });
      } else {
        const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
        const { data: currentUser } = await supabase.auth.getUser();
        
        const { error } = await supabase
          .from('teacher_profiles')
          .update({
            status,
            approval_date: action === 'approve' ? new Date().toISOString() : null,
            approved_by: currentUser.user?.id,
            updated_at: new Date().toISOString()
          })
          .in('id', teacherIds);

        if (error) throw error;

        setTeachers(prev => prev.map(teacher => 
          selectedTeachers.has(teacher.id) 
            ? { ...teacher, status: status as any }
            : teacher
        ));

        toast({
          title: "Success",
          description: `${teacherIds.length} teacher(s) ${action}d successfully`,
        });
      }

      setSelectedTeachers(new Set());
      setBulkActionDialog(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} teachers`,
        variant: "destructive"
      });
    }
  };

  const handleIndividualAction = async (teacherId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('teacher_profiles')
          .delete()
          .eq('id', teacherId);
        
        if (error) throw error;
        
        setTeachers(prev => prev.filter(t => t.id !== teacherId));
        
        toast({
          title: "Success",
          description: "Teacher deleted successfully",
        });
      } else {
        const status = action === 'approve' ? 'APPROVED' : 'REJECTED';
        const { data: currentUser } = await supabase.auth.getUser();
        
        const { error } = await supabase
          .from('teacher_profiles')
          .update({
            status,
            approval_date: action === 'approve' ? new Date().toISOString() : null,
            approved_by: currentUser.user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', teacherId);

        if (error) throw error;

        setTeachers(prev => prev.map(teacher => 
          teacher.id === teacherId 
            ? { ...teacher, status: status as any }
            : teacher
        ));

        toast({
          title: "Success",
          description: `Teacher ${action}d successfully`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} teacher`,
        variant: "destructive"
      });
    }
  };

  const toggleTeacherSelection = (teacherId: string) => {
    setSelectedTeachers(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(teacherId)) {
        newSelection.delete(teacherId);
      } else {
        newSelection.add(teacherId);
      }
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTeachers.size === filteredTeachers.length) {
      setSelectedTeachers(new Set());
    } else {
      setSelectedTeachers(new Set(filteredTeachers.map(t => t.id)));
    }
  };

  const exportToCSV = () => {
    const headers = ['Full Name', 'Email', 'Subject Expertise', 'Experience Years', 'Status', 'Created At', 'Approval Date'];
    const rows = filteredTeachers.map(teacher => [
      teacher.full_name,
      teacher.email,
      teacher.subject_expertise,
      teacher.experience_years,
      teacher.status,
      new Date(teacher.created_at).toLocaleDateString(),
      teacher.approval_date ? new Date(teacher.approval_date).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `teachers_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: "Teacher data exported successfully",
    });
  };

  const uniqueSubjects = Array.from(new Set(teachers.map(t => t.subject_expertise))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Teacher Management
              </CardTitle>
              <CardDescription>
                Manage teacher registrations, approvals, and bulk operations
              </CardDescription>
            </div>
            <div className="flex gap-2">
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
                placeholder="Search by name, email, or subject..."
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
              <Label htmlFor="subject">Subject</Label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchTeachers} variant="outline" className="w-full">
                Refresh
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedTeachers.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedTeachers.size} teacher(s) selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setBulkActionDialog({ isOpen: true, action: 'approve', count: selectedTeachers.size })}
                  >
                    Approve Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkActionDialog({ isOpen: true, action: 'reject', count: selectedTeachers.size })}
                  >
                    Reject Selected
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBulkActionDialog({ isOpen: true, action: 'delete', count: selectedTeachers.size })}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Teachers List */}
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                checked={selectedTeachers.size === filteredTeachers.length && filteredTeachers.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium">
                Select All ({filteredTeachers.length} teachers)
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading teachers...</div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No teachers found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              filteredTeachers.map((teacher) => (
                <div 
                  key={teacher.id}
                  className={`border rounded-lg p-4 transition-all ${
                    selectedTeachers.has(teacher.id) ? 'border-blue-500 bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTeachers.has(teacher.id)}
                      onCheckedChange={() => toggleTeacherSelection(teacher.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{teacher.full_name}</h3>
                            <Badge 
                              variant={
                                teacher.status === 'APPROVED' ? 'default' :
                                teacher.status === 'REJECTED' ? 'destructive' : 'secondary'
                              }
                            >
                              {teacher.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
                            <span>Email: {teacher.email}</span>
                            <span>Subject: {teacher.subject_expertise}</span>
                            <span>Experience: {teacher.experience_years} years</span>
                            <span>Joined: {new Date(teacher.created_at).toLocaleDateString()}</span>
                          </div>
                          {teacher.approval_date && (
                            <div className="text-xs text-green-600">
                              Approved on {new Date(teacher.approval_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {teacher.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleIndividualAction(teacher.id, 'approve')}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleIndividualAction(teacher.id, 'reject')}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedTeachers(new Set([teacher.id]));
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

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={bulkActionDialog?.isOpen} onOpenChange={(open) => !open && setBulkActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirm {bulkActionDialog?.action?.charAt(0).toUpperCase()}{bulkActionDialog?.action?.slice(1)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkActionDialog?.action} {bulkActionDialog?.count} teacher(s)?
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

export default TeacherManagementPanel;
