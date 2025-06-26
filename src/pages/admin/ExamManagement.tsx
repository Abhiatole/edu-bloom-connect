import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Plus, Upload, Calendar, Clock, FileText, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Define exam types with "Other" option
const PREDEFINED_EXAM_TYPES = [
  'JEE',
  'NEET', 
  'MHT-CET',
  'BOARD',
  'Other'
] as const;

type PredefinedExamType = typeof PREDEFINED_EXAM_TYPES[number];

interface ExamFormData {
  title: string;
  subject: string;
  examType: PredefinedExamType | '';
  customExamType: string;
  examDate: string;
  examTime: string;
  duration: number;
  maxMarks: number;
  classLevel: number;
  description: string;
}

interface Exam {
  id: string;
  title: string;
  subject: string;
  exam_type: string;
  exam_date: string;
  exam_time: string;
  duration_minutes: number;
  max_marks: number;
  class_level: number;
  description: string;
  status: string;
  created_at: string;
  created_by_teacher_id: string;
}

const ExamManagement: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<ExamFormData>({
    title: '',
    subject: '',
    examType: '',
    customExamType: '',
    examDate: '',
    examTime: '',
    duration: 60,
    maxMarks: 100,
    classLevel: 11,
    description: ''
  });

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
    'Hindi', 'History', 'Geography', 'Computer Science', 'Economics'
  ];

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('created_by_teacher_id', currentUser.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams((data as unknown as Exam[]) || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch exams',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ExamFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter an exam title',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.subject) {
      toast({
        title: 'Validation Error',
        description: 'Please select a subject',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.examType) {
      toast({
        title: 'Validation Error',
        description: 'Please select an exam type',
        variant: 'destructive'
      });
      return false;
    }

    if (formData.examType === 'Other' && !formData.customExamType.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a custom exam name',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.examDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select an exam date',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.examTime) {
      toast({
        title: 'Validation Error',
        description: 'Please select an exam time',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setUploading(true);

    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('User not authenticated');

      // Determine the final exam type
      const finalExamType = formData.examType === 'Other' 
        ? formData.customExamType.trim() 
        : formData.examType;

      const examData = {
        title: formData.title.trim(),
        subject: formData.subject,
        exam_type: finalExamType as string,
        exam_date: formData.examDate,
        exam_time: formData.examTime,
        duration_minutes: formData.duration,
        max_marks: formData.maxMarks,
        class_level: formData.classLevel,
        description: formData.description.trim(),
        status: 'DRAFT',
        created_by_teacher_id: currentUser.user.id
      };

      const { error } = await supabase
        .from('exams')
        .insert([examData as any]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Exam created successfully',
      });

      // Reset form and close dialog
      setFormData({
        title: '',
        subject: '',
        examType: '',
        customExamType: '',
        examDate: '',
        examTime: '',
        duration: 60,
        maxMarks: 100,
        classLevel: 11,
        description: ''
      });
      setCreateDialogOpen(false);
      
      // Refresh exams list
      fetchExams();

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create exam',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Exam deleted successfully',
      });

      fetchExams();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete exam',
        variant: 'destructive'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Exam Management</h1>
          <p className="text-muted-foreground">Create and manage exams with enhanced type selection</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateExam} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Exam Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Mathematics Mid-term Exam"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="examType">Exam Type *</Label>
                  <Select value={formData.examType} onValueChange={(value) => handleInputChange('examType', value as PredefinedExamType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREDEFINED_EXAM_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Custom Exam Type Input (shown when "Other" is selected) */}
                {formData.examType === 'Other' && (
                  <div className="md:col-span-2">
                    <Label htmlFor="customExamType">Enter Custom Exam Name *</Label>
                    <Input
                      id="customExamType"
                      value={formData.customExamType}
                      onChange={(e) => handleInputChange('customExamType', e.target.value)}
                      placeholder="e.g., Weekly Assessment, Mock Test, Unit Test"
                      required={formData.examType === 'Other'}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Please enter a descriptive name for your custom exam type
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="examDate">Exam Date *</Label>
                  <Input
                    id="examDate"
                    type="date"
                    value={formData.examDate}
                    onChange={(e) => handleInputChange('examDate', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="examTime">Exam Time *</Label>
                  <Input
                    id="examTime"
                    type="time"
                    value={formData.examTime}
                    onChange={(e) => handleInputChange('examTime', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    max="300"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 60)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxMarks">Maximum Marks</Label>
                  <Input
                    id="maxMarks"
                    type="number"
                    min="10"
                    max="1000"
                    value={formData.maxMarks}
                    onChange={(e) => handleInputChange('maxMarks', parseInt(e.target.value) || 100)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="classLevel">Class Level</Label>
                  <Select value={formData.classLevel.toString()} onValueChange={(value) => handleInputChange('classLevel', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(cls => (
                        <SelectItem key={cls} value={cls.toString()}>Class {cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Additional instructions or information about the exam"
                  rows={3}
                />
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploading}
                  className="min-w-[120px]"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Create Exam
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exams List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Your Exams
          </CardTitle>
          <CardDescription>
            Manage your created exams
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No exams created yet</p>
              <p className="text-sm">Click "Create Exam" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div key={exam.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-lg">{exam.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{exam.subject}</span>
                        <span>•</span>
                        <Badge variant="outline">{exam.exam_type}</Badge>
                        <span>•</span>
                        <span>Class {exam.class_level}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={exam.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {exam.status}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteExam(exam.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <p className="font-medium">{formatDate(exam.exam_date)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span>
                      <p className="font-medium">{formatTime(exam.exam_time)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">{exam.duration_minutes} min</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Marks:</span>
                      <p className="font-medium">{exam.max_marks}</p>
                    </div>
                  </div>
                  
                  {exam.description && (
                    <div>
                      <span className="text-sm text-muted-foreground">Description:</span>
                      <p className="text-sm mt-1">{exam.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamManagement;
