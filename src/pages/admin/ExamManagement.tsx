
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
import { BookOpen, Plus, Upload, Download, Users, Target } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  class_level: number;
}

interface Topic {
  id: string;
  name: string;
  chapter_number: number;
}

interface Exam {
  id: string;
  title: string;
  exam_type: string;
  class_level: number;
  max_marks: number;
  created_at: string;
  subjects: { name: string };
  topics: { name: string };
}

interface Student {
  id: string;
  full_name: string;
  class_level: number;
}

const ExamManagement = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [createExamOpen, setCreateExamOpen] = useState(false);
  const [markResultsOpen, setMarkResultsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
  const [examForm, setExamForm] = useState({
    title: '',
    subjectId: '',
    topicId: '',
    examType: '',
    classLevel: '11',
    maxMarks: '100'
  });

  const { toast } = useToast();
  const examTypes = ['JEE', 'NEET', 'CET', 'Boards'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsResult, examsResult, studentsResult] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase.from('exams').select(`
          *,
          subjects(name),
          topics(name)
        `).order('created_at', { ascending: false }),
        supabase.from('student_profiles').select('id, full_name, class_level').eq('status', 'APPROVED')
      ]);

      if (subjectsResult.error) throw subjectsResult.error;
      if (examsResult.error) throw examsResult.error;
      if (studentsResult.error) throw studentsResult.error;

      setSubjects(subjectsResult.data || []);
      setExams(examsResult.data || []);
      setStudents(studentsResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async (subjectId: string) => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', subjectId)
        .order('chapter_number');

      if (error) throw error;
      setTopics(data || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setExamForm(prev => ({ ...prev, subjectId, topicId: '' }));
    fetchTopics(subjectId);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const { error } = await supabase.from('exams').insert({
        title: examForm.title,
        subject_id: examForm.subjectId,
        topic_id: examForm.topicId || null,
        exam_type: examForm.examType,
        class_level: parseInt(examForm.classLevel),
        max_marks: parseInt(examForm.maxMarks),
        created_by: currentUser.user.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Exam created successfully"
      });

      setCreateExamOpen(false);
      setExamForm({
        title: '',
        subjectId: '',
        topicId: '',
        examType: '',
        classLevel: '11',
        maxMarks: '100'
      });
      fetchData();
    } catch (error: any) {
      console.error('Error creating exam:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create exam",
        variant: "destructive"
      });
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !selectedExam) {
      toast({
        title: "Error",
        description: "Please select an exam and upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      if (!headers.includes('student_id') || !headers.includes('marks')) {
        throw new Error('CSV must contain student_id and marks columns');
      }

      const results = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const studentId = values[headers.indexOf('student_id')];
        const marks = parseInt(values[headers.indexOf('marks')]);
        
        if (studentId && !isNaN(marks)) {
          results.push({
            exam_id: selectedExam,
            student_id: studentId,
            marks_obtained: marks
          });
        }
      }

      const { error } = await supabase.from('exam_results').insert(results);
      if (error) throw error;

      toast({
        title: "Success",
        description: `Uploaded ${results.length} exam results`
      });

      setMarkResultsOpen(false);
      setCsvFile(null);
      setSelectedExam('');
    } catch (error: any) {
      console.error('Error uploading CSV:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload CSV",
        variant: "destructive"
      });
    }
  };

  const downloadSampleCsv = () => {
    const headers = ['student_id', 'marks'];
    const sampleData = students.slice(0, 5).map(student => [student.id, '0']);
    const csvContent = [headers, ...sampleData].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_marks.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExamResults = async (examId: string) => {
    try {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          *,
          student_profiles(full_name, class_level),
          exams(title, max_marks)
        `)
        .eq('exam_id', examId);

      if (error) throw error;

      const headers = ['Student Name', 'Class', 'Marks Obtained', 'Max Marks', 'Percentage'];
      const rows = data.map(result => [
        result.student_profiles?.full_name || 'N/A',
        result.student_profiles?.class_level || 'N/A',
        result.marks_obtained,
        result.exams?.max_marks || 100,
        result.percentage || ((result.marks_obtained / (result.exams?.max_marks || 100)) * 100).toFixed(2)
      ]);

      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam_results_${examId}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Exam results exported successfully"
      });
    } catch (error: any) {
      console.error('Error exporting results:', error);
      toast({
        title: "Error",
        description: "Failed to export results",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading exam management...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Management</h2>
          <p className="text-gray-600">Create and manage exams and results</p>
        </div>
        <div className="flex gap-2">
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
                    onChange={(e) => setExamForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter exam title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="classLevel">Class Level *</Label>
                  <Select value={examForm.classLevel} onValueChange={(value) => setExamForm(prev => ({ ...prev, classLevel: value }))}>
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
                  <Select value={examForm.examType} onValueChange={(value) => setExamForm(prev => ({ ...prev, examType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={examForm.subjectId} onValueChange={handleSubjectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.filter(s => s.class_level === parseInt(examForm.classLevel)).map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {topics.length > 0 && (
                  <div>
                    <Label htmlFor="topic">Topic (Optional)</Label>
                    <Select value={examForm.topicId} onValueChange={(value) => setExamForm(prev => ({ ...prev, topicId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map(topic => (
                          <SelectItem key={topic.id} value={topic.id}>
                            Chapter {topic.chapter_number}: {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="maxMarks">Maximum Marks *</Label>
                  <Input
                    id="maxMarks"
                    type="number"
                    value={examForm.maxMarks}
                    onChange={(e) => setExamForm(prev => ({ ...prev, maxMarks: e.target.value }))}
                    min="1"
                    max="1000"
                    required
                  />
                </div>

                <Button type="submit" className="w-full">Create Exam</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={markResultsOpen} onOpenChange={setMarkResultsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Results
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Exam Results</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="examSelect">Select Exam *</Label>
                  <Select value={selectedExam} onValueChange={setSelectedExam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map(exam => (
                        <SelectItem key={exam.id} value={exam.id}>
                          {exam.title} - {exam.subjects?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="csvFile">CSV File *</Label>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    CSV should contain columns: student_id, marks
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={downloadSampleCsv} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample CSV
                  </Button>
                </div>

                <Button onClick={handleCsvUpload} className="w-full">
                  Upload Results
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            All Exams
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
                        <div><strong>Subject:</strong> {exam.subjects?.name}</div>
                        <div><strong>Type:</strong> {exam.exam_type}</div>
                        <div><strong>Class:</strong> {exam.class_level}</div>
                        <div><strong>Max Marks:</strong> {exam.max_marks}</div>
                      </div>
                      {exam.topics?.name && (
                        <div className="text-sm text-gray-600">
                          <strong>Topic:</strong> {exam.topics.name}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Created: {new Date(exam.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => exportExamResults(exam.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export Results
                    </Button>
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
