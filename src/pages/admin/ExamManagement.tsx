
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useExamManagement } from '@/hooks/useExamManagement';
import { BookOpen, Plus, Calendar } from 'lucide-react';

interface ExamFormData {
  title: string;
  subject: string;
  class_level: number;
  exam_type: string;
  total_marks: number;
  duration_minutes: number;
  exam_date: string;
}

const ExamManagement = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [createExamOpen, setCreateExamOpen] = useState(false);
  const [examForm, setExamForm] = useState<ExamFormData>({
    title: '',
    subject: 'Physics',
    class_level: 11,
    exam_type: 'Internal',
    total_marks: 100,
    duration_minutes: 180,
    exam_date: ''
  });

  const { toast } = useToast();
  const { createExam, fetchExams, loading } = useExamManagement();

  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other'];
  const examTypes = ['JEE', 'NEET', 'CET', 'Boards', 'Internal', 'Quarterly', 'Half Yearly', 'Annual'];

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const examsData = await fetchExams();
      console.log('Loaded exams:', examsData);
      setExams(examsData || []);
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!examForm.title || !examForm.exam_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Creating exam with data:', examForm);
      await createExam(examForm);
      
      // Reset form and close dialog
      setExamForm({
        title: '',
        subject: 'Physics',
        class_level: 11,
        exam_type: 'Internal',
        total_marks: 100,
        duration_minutes: 180,
        exam_date: ''
      });
      setCreateExamOpen(false);
      
      // Reload exams
      await loadExams();
    } catch (error) {
      console.error('Error creating exam:', error);
    }
  };

  const handleInputChange = (field: keyof ExamFormData, value: string | number) => {
    setExamForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Management</h2>
          <p className="text-gray-600">Create and manage exams</p>
        </div>
        <Dialog open={createExamOpen} onOpenChange={setCreateExamOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <Label htmlFor="title">Exam Title *</Label>
                <Input
                  id="title"
                  value={examForm.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter exam title"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="classLevel">Class Level *</Label>
                  <Select 
                    value={examForm.class_level.toString()} 
                    onValueChange={(value) => handleInputChange('class_level', parseInt(value))}
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
                  <Label htmlFor="examType">Exam Type *</Label>
                  <Select 
                    value={examForm.exam_type} 
                    onValueChange={(value) => handleInputChange('exam_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Select 
                  value={examForm.subject} 
                  onValueChange={(value) => handleInputChange('subject', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalMarks">Total Marks *</Label>
                  <Input
                    id="totalMarks"
                    type="number"
                    value={examForm.total_marks}
                    onChange={(e) => handleInputChange('total_marks', parseInt(e.target.value))}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={examForm.duration_minutes}
                    onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="examDate">Exam Date *</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={examForm.exam_date}
                  onChange={(e) => handleInputChange('exam_date', e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Exam'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            All Exams ({exams.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No exams created yet
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div key={exam.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{exam.title}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div><strong>Subject:</strong> {exam.subject}</div>
                        <div><strong>Type:</strong> {exam.exam_type}</div>
                        <div><strong>Class:</strong> {exam.class_level}</div>
                        <div><strong>Total Marks:</strong> {exam.total_marks}</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        Exam Date: {new Date(exam.exam_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        Created: {new Date(exam.created_at).toLocaleDateString()}
                      </div>
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

export default ExamManagement;
