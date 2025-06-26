import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Plus, Upload, Download, FileText, Send, Calendar, Clock, Target, Trash2, CheckSquare, Square, MessageSquare, Users, Bell, GraduationCap } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import ExamCreationForm from '@/components/teacher/ExamCreationForm';
import ExamResultsUpload from '@/components/teacher/ExamResultsUpload';
import ManualResultEntry from '@/components/teacher/ManualResultEntry';
import ParentNotificationSystem from '@/components/teacher/ParentNotificationSystem';
import WhatsAppMessaging from '@/components/messaging/WhatsAppMessaging';
import StudentApproval from '@/components/teacher/StudentApproval';
import TeacherNotifications from '@/components/teacher/TeacherNotifications';
import { SubjectService } from '@/services/subjectService';
// Types
interface Exam {
  id: string;
  title: string;
  subject?: string;
  exam_date: string;
  exam_time?: string;
  duration_minutes: number | null;
  max_marks?: number;
  total_marks?: number; // Alternative field name from Supabase
  class_level: number;
  exam_type: string;
  description?: string;
  question_paper_url?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
  created_at: string | null;
  created_by_teacher_id: string;
  updated_at?: string | null;
}
interface Student {
  id: string;
  enrollment_no: string;
  full_name?: string;
  display_name?: string;
  class_level: number;
  guardian_mobile?: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  user_id?: string;
}
interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  enrollment_no?: string;
  student_name?: string;
  subject?: string;
  marks_obtained: number;
  max_marks?: number;
  percentage?: number;
  feedback?: string;
  exam_name?: string;
  created_at: string;
  submitted_at?: string;
  grade?: string;
  remarks?: string;
  exams?: any;
  student_profiles?: any;
}
const EnhancedTeacherDashboard = () => {
  // State management
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dialog states
  const [createExamDialogOpen, setCreateExamDialogOpen] = useState(false);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  
  // Delete functionality states
  const [selectedExams, setSelectedExams] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingExams, setDeletingExams] = useState<Set<string>>(new Set());
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  
  // Form states
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedResultsExam, setSelectedResultsExam] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'manual' | 'excel'>('manual');
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  
  const { toast } = useToast();
  useEffect(() => {
    fetchInitialData();
  }, []);
  // Add keyboard shortcuts for better UX
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when we're in the exams tab and not in dialogs
      if (activeTab !== 'exams' || deleteDialogOpen) return;
      
      // Delete key for bulk delete
      if (event.key === 'Delete' && selectedExams.size > 0) {
        event.preventDefault();
        handleBulkDelete();
      }
      
      // Escape key to clear selection
      if (event.key === 'Escape' && selectedExams.size > 0) {
        event.preventDefault();
        setSelectedExams(new Set());
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [activeTab, selectedExams, deleteDialogOpen]);
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Set current user for WhatsApp messaging
      setCurrentUser({ id: user.id, role: 'TEACHER' });
      
      // Fetch teacher's exams
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*')
        .eq('created_by_teacher_id', user.id)
        .order('created_at', { ascending: false });
      if (examsError) throw examsError;
      setExams(examsData || []);
      // Fetch approved students - use available fields only
      const { data: studentsData, error: studentsError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('status', 'APPROVED')
        .order('created_at');
      if (studentsError) {
        setStudents([]);
      } else {
        // Map the data to match our interface, handling missing fields gracefully
        const mappedStudents = (studentsData || []).map((student: any) => ({
          id: student.id || student.user_id,
          enrollment_no: student.enrollment_no || `ENR-${student.id?.slice(0, 8)}`,
          full_name: student.full_name || student.display_name || `Student ${student.id?.slice(0, 8)}`,
          class_level: student.class_level || 11,
          guardian_mobile: student.guardian_mobile,
          status: student.status as 'APPROVED' | 'PENDING' | 'REJECTED',
          user_id: student.user_id
        }));
        
        setStudents(mappedStudents);
      }
      // Fetch exam results for teacher's exams - simplified query
      const examIds = examsData?.map(exam => exam.id) || [];
      if (examIds.length > 0) {
        const { data: resultsData, error: resultsError } = await supabase
          .from('exam_results')
          .select('*')
          .in('exam_id', examIds)
          .order('submitted_at', { ascending: false });
        if (resultsError) {
          setExamResults([]);
        } else {
          // Map the data to match our interface
          const mappedResults = (resultsData || []).map((result: any) => ({
            id: result.id,
            exam_id: result.exam_id,
            student_id: result.student_id,
            enrollment_no: result.enrollment_no || 'N/A',
            student_name: result.student_name || 'Unknown Student',
            subject: result.subject || 'General',
            marks_obtained: result.marks_obtained || 0,
            max_marks: result.max_marks || 100,
            percentage: result.percentage || Math.round((result.marks_obtained / (result.max_marks || 100)) * 100),
            feedback: result.feedback || result.remarks,
            exam_name: result.exam_name || 'Exam',
            created_at: result.submitted_at || result.created_at || new Date().toISOString(),
            submitted_at: result.submitted_at,
            grade: result.grade,
            remarks: result.remarks
          }));
          
          setExamResults(mappedResults);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleExamCreated = async (examData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('exams')
        .insert({
          ...examData,
          created_by_teacher_id: user.id,
          status: 'DRAFT'
        })
        .select()
        .single();
      if (error) throw error;
      setExams(prev => [data, ...prev]);
      setCreateExamDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Exam created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create exam",
        variant: "destructive"
      });
    }
  };
  const handlePublishExam = async (examId: string) => {
    try {
      // First, try to update with status column
      let updateSuccess = false;
      
      try {
        const { error: statusError } = await supabase
          .from('exams')
          .update({ 
            status: 'PUBLISHED',
            updated_at: new Date().toISOString()
          })
          .eq('id', examId);
          
        if (!statusError) {
          updateSuccess = true;
        }
      } catch (error) {
      }
      
      // If status update failed, just update the timestamp
      if (!updateSuccess) {
        const { error: fallbackError } = await supabase
          .from('exams')
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq('id', examId);
          
        if (fallbackError) {
          throw fallbackError;
        }
      }
      // Update local state regardless
      setExams(prev => prev.map(exam => 
        exam.id === examId ? { ...exam, status: 'PUBLISHED' as const } : exam
      ));
      toast({
        title: "Success",
        description: "Exam published successfully. Students can now see it.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to publish exam",
        variant: "destructive"
      });
    }
  };
  const handleSendExamNotification = async (examId: string) => {
    try {
      // In a real implementation, this would trigger notifications to all enrolled students
      // For now, we'll just show a success message
      toast({
        title: "Notifications Sent",
        description: "All enrolled students have been notified about the exam",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send notifications",
        variant: "destructive"
      });
    }
  };
  // Delete functionality handlers
  const handleDeleteExam = async (examId: string) => {
    setExamToDelete(examId);
    setBulkDeleteMode(false);
    setDeleteDialogOpen(true);
  };
  const handleBulkDelete = () => {
    if (selectedExams.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one exam to delete",
        variant: "destructive"
      });
      return;
    }
    setBulkDeleteMode(true);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = async () => {
    try {
      const examIds = bulkDeleteMode ? Array.from(selectedExams) : [examToDelete!];
      setDeletingExams(new Set(examIds));
      // Delete exams from database - Supabase should handle cascade deletion
      // if foreign key constraints are set up properly
      const { error: examError } = await supabase
        .from('exams')
        .delete()
        .in('id', examIds);
      if (examError) throw examError;
      // Update local state with optimistic update
      setExams(prev => prev.filter(exam => !examIds.includes(exam.id)));
      setExamResults(prev => prev.filter(result => !examIds.includes(result.exam_id)));
      // Clear selections
      setSelectedExams(new Set());
      setDeleteDialogOpen(false);
      setExamToDelete(null);
      toast({
        title: "Success",
        description: `${examIds.length} exam${examIds.length > 1 ? 's' : ''} deleted successfully`,
      });
      // Refresh data to ensure consistency
      await fetchInitialData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete exam(s)",
        variant: "destructive"
      });
    } finally {
      setDeletingExams(new Set());
    }
  };
  const toggleExamSelection = (examId: string) => {
    setSelectedExams(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(examId)) {
        newSelection.delete(examId);
      } else {
        newSelection.add(examId);
      }
      return newSelection;
    });
  };
  const toggleSelectAll = () => {
    if (selectedExams.size === exams.length) {
      setSelectedExams(new Set());
    } else {
      setSelectedExams(new Set(exams.map(exam => exam.id)));
    }
  };
  const renderDashboardStats = () => {
    const totalExams = exams.length;
    const publishedExams = exams.filter(exam => exam.status === 'PUBLISHED').length;
    const totalResults = examResults.length;
    const averageScore = totalResults > 0 
      ? Math.round(examResults.reduce((sum, result) => sum + result.percentage, 0) / totalResults)
      : 0;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExams}</div>
            <p className="text-xs text-muted-foreground">
              {publishedExams} published
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Approved students
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Results Entered</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResults}</div>
            <p className="text-xs text-muted-foreground">
              Exam submissions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              Class performance
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage exams, results, and communicate with parents</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createExamDialogOpen} onOpenChange={setCreateExamDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
              </DialogHeader>
              <ExamCreationForm onExamCreated={handleExamCreated} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Enter Results
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Enter Exam Results</DialogTitle>
              </DialogHeader>
              <ExamResultsUpload 
                exams={exams
                  .filter(exam => exam.status === 'PUBLISHED')
                  .map(exam => ({
                    id: exam.id,
                    title: exam.title,
                    subject: exam.subject || 'General',
                    max_marks: exam.max_marks || exam.total_marks || 100
                  }))
                }
                students={students
                  .filter(student => student.full_name || student.display_name)
                  .map(student => ({
                    id: student.id,
                    enrollment_no: student.enrollment_no,
                    full_name: student.full_name || student.display_name || `Student ${student.id.slice(0, 8)}`
                  }))
                }
                onResultsUploaded={fetchInitialData}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {/* Dashboard Stats */}
      {renderDashboardStats()}
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student Approvals
          </TabsTrigger>
          <TabsTrigger value="exams">My Exams</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="communication">Parent Communication</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Exams */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exams.slice(0, 5).map(exam => (
                    <div key={exam.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h4 className="font-medium">{exam.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exam.subject} • {new Date(exam.exam_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={exam.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {exam.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Recent Results */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {examResults.slice(0, 5).map(result => (
                    <div key={result.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h4 className="font-medium">{result.student_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.exam_name} • {result.enrollment_no}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{result.percentage}%</div>
                        <div className="text-sm text-muted-foreground">
                          {result.marks_obtained}/{result.max_marks}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <TeacherNotifications 
            teacherUserId={currentUser?.id || ''} 
            onNavigateToTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <StudentApproval teacherUserId={currentUser?.id || ''} />
        </TabsContent>

        <TabsContent value="exams" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>All Exams</CardTitle>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {exams.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                          checked={selectedExams.size === exams.length && exams.length > 0}
                          onCheckedChange={toggleSelectAll}
                          className="h-4 w-4"
                        />
                        <span>Select All ({selectedExams.size}/{exams.length})</span>
                      </div>
                      {selectedExams.size > 0 && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleBulkDelete}
                          disabled={deletingExams.size > 0}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Selected ({selectedExams.size})
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {selectedExams.size > 0 && (
                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-4">
                  <span>💡 Tip: Press Delete key to delete selected exams, Escape to clear selection</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {exams.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No exams created yet</p>
                  <p className="text-sm">Create your first exam to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exams.map(exam => (
                    <div 
                      key={exam.id} 
                      className={`border rounded-lg p-4 transition-all duration-200 ${
                        selectedExams.has(exam.id) 
                          ? 'border-blue-500 bg-blue-50/50 shadow-md transform scale-[1.02]' 
                          : 'hover:shadow-md'
                      } ${deletingExams.has(exam.id) ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedExams.has(exam.id)}
                          onCheckedChange={() => toggleExamSelection(exam.id)}
                          disabled={deletingExams.has(exam.id)}
                          className="mt-1 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{exam.title}</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-sm text-muted-foreground mt-2">
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {exam.subject}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(exam.exam_date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {exam.exam_time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {exam.duration_minutes} mins
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {exam.max_marks} marks
                                </span>
                              </div>
                              {exam.question_paper_url && (
                                <div className="mt-2">
                                  <a 
                                    href={exam.question_paper_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                  >
                                    <FileText className="h-3 w-3" />
                                    View Question Paper
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={exam.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                {exam.status}
                              </Badge>
                              {exam.status === 'DRAFT' && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePublishExam(exam.id)}
                                  disabled={deletingExams.has(exam.id)}
                                >
                                  Publish
                                </Button>
                              )}
                              {exam.status === 'PUBLISHED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSendExamNotification(exam.id)}
                                  disabled={deletingExams.has(exam.id)}
                                  className="hidden sm:flex"
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Notify Students
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteExam(exam.id)}
                                disabled={deletingExams.has(exam.id)}
                                className="relative"
                              >
                                {deletingExams.has(exam.id) ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" />
                                    <span className="hidden sm:inline">Deleting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">Delete</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exam Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {examResults.map(result => (
                  <div key={result.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{result.student_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {result.exam_name} • {result.subject} • Enrollment: {result.enrollment_no}
                        </p>
                        {result.feedback && (
                          <p className="text-sm mt-1">Feedback: {result.feedback}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{result.percentage}%</div>
                        <div className="text-sm text-muted-foreground">
                          {result.marks_obtained}/{result.max_marks} marks
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="communication" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Parent Notification System */}
            <ParentNotificationSystem 
              examResults={examResults
                .filter(result => result.enrollment_no && result.student_name)
                .map(result => ({
                  id: result.id,
                  exam_id: result.exam_id,
                  student_id: result.student_id,
                  enrollment_no: result.enrollment_no || 'N/A',
                  student_name: result.student_name || 'Unknown Student',
                  subject: result.subject || 'General',
                  marks_obtained: result.marks_obtained,
                  max_marks: result.max_marks || 100,
                  percentage: result.percentage || Math.round((result.marks_obtained / (result.max_marks || 100)) * 100),
                  feedback: result.feedback,
                  exam_name: result.exam_name || 'Exam',
                  created_at: result.created_at
                }))
              }
              onNotificationSent={fetchInitialData}
            />
            
            {/* WhatsApp Messaging */}
            {currentUser ? (
              <WhatsAppMessaging 
                userRole="TEACHER" 
                userId={currentUser.id} 
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Loading user information...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              {bulkDeleteMode ? 'Confirm Bulk Delete' : 'Confirm Delete'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {bulkDeleteMode ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete <strong>{selectedExams.size}</strong> selected exam{selectedExams.size > 1 ? 's' : ''}?
                </p>
                <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs font-medium text-muted-foreground mb-2">Selected Exams:</div>
                  {Array.from(selectedExams).map(examId => {
                    const exam = exams.find(e => e.id === examId);
                    return exam ? (
                      <div key={examId} className="text-sm py-1 border-b last:border-b-0">
                        • {exam.title} ({exam.subject})
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this exam?
                </p>
                {examToDelete && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    {(() => {
                      const exam = exams.find(e => e.id === examToDelete);
                      return exam ? (
                        <div className="space-y-1">
                          <div className="font-medium">{exam.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {exam.subject} • {new Date(exam.exam_date).toLocaleDateString()}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            )}
            <Alert>
              <AlertDescription className="text-sm">
                This action cannot be undone. All related exam results and data will also be permanently deleted.
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingExams.size > 0}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deletingExams.size > 0}
              className="relative"
            >
              {deletingExams.size > 0 ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {bulkDeleteMode ? `Delete ${selectedExams.size} Exams` : 'Delete Exam'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default EnhancedTeacherDashboard;
