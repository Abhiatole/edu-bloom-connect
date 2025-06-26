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
import { BookOpen, Plus, Upload, Download, Users, Target, AlertTriangle, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import ManualMarkUpload from '@/components/ManualMarkUpload';
// Updated Subject interface to match database structure
interface Subject {
  id: string;
  name: string;
  class_level: number;
}
// Updated Topic interface to match database structure
interface Topic {
  id: string;
  name: string;
  description?: string;
  subject_id: string;
  created_at?: string;
  updated_at?: string;
}
// Updated Exam interface to match the actual database structure
interface Exam {
  id: string;
  title: string;
  exam_type: string;
  class_level: number;
  max_marks?: number;
  total_marks?: number; // Add this as it appears in the DB
  created_at: string;
  subject?: string;
  subject_id?: string;
  topic_id?: string;
  created_by_teacher_id?: string;
  exam_date?: string;
  duration_minutes?: number;
}
// Updated Student interface to match actual database structure
interface Student {
  id: string;
  // We'll use user_id to fetch the actual user display name if needed
  user_id?: string;
  // Fields that could be used for display name
  enrollment_no?: string;
  class_level: number;
  // We'll construct a display name from available fields
  display_name?: string; // This is a computed field, not in the database
}
type ExamType = 'JEE' | 'NEET' | 'CET' | 'Boards';
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
  const [customSubject, setCustomSubject] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<string | null>(null);
  const [exportingExamId, setExportingExamId] = useState<string | null>(null);
  const [uploadingResults, setUploadingResults] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  const [examForm, setExamForm] = useState({
    title: '',
    subjectId: '',
    topicId: '',
    examType: '' as ExamType | '',
    classLevel: '11',
    maxMarks: '100'
  });
  const { toast } = useToast();
  const examTypes: ExamType[] = ['JEE', 'NEET', 'CET', 'Boards'];
  useEffect(() => {
    fetchData();
  }, []);
  // Fetch data from the server
  const fetchData = async () => {
    try {
      // Try to fetch subjects - if it fails, use default values
      try {
        // Check if subjects table exists in the database first
        const { data: subjectsData, error: subjectsError } = await supabase.rpc('get_subjects');
        
        if (subjectsError) {
          // Direct table query as fallback
          const { data: directSubjectsData, error: directSubjectsError } = await supabase
            .from('subjects')
            .select('*');
            
          if (directSubjectsError) {
            // Set default subjects if both methods fail
            setDefaultSubjects();
          } else {
            if (!directSubjectsData || directSubjectsData.length === 0) {
              setDefaultSubjects();
            } else {
              // Map the returned data to our Subject interface
              const mappedSubjects = directSubjectsData.map(subj => ({
                id: subj.id,
                name: subj.name || 'Unknown Subject',
                class_level: subj.class_level || 11
              }));
              setSubjects(mappedSubjects);
            }
          }
        } else {
          if (!subjectsData || subjectsData.length === 0) {
            setDefaultSubjects();
          } else {
            // Map the returned data to our Subject interface
            const mappedSubjects = subjectsData.map(subj => ({
              id: subj.id,
              name: subj.name || 'Unknown Subject',
              class_level: subj.class_level || 11
            }));
            setSubjects(mappedSubjects);
          }
        }
      } catch (subjectError) {
        // Set default subjects if there was an exception
        setDefaultSubjects();
      }
      // Fetch students with better error handling
      try {
        const { data: studentsData, error: studentsError } = await supabase
          .from('student_profiles')
          .select('*');
          
        if (studentsError) {
          setStudents([]); // Set empty array to avoid undefined errors
        } else {
          
          // Map student data to our updated interface
          const mappedStudents = (studentsData || []).map(student => {
            // Create a display name from whatever fields are available
            const displayName = student.enrollment_no || `Student-${student.id.substring(0, 8)}`;
            
            return {
              id: student.id,
              user_id: student.user_id,
              enrollment_no: student.enrollment_no,
              class_level: student.class_level || 0,
              display_name: displayName
            };
          });
          
          setStudents(mappedStudents);
        }
      } catch (studentError) {
        setStudents([]);
      }
      // Fetch exams with better error handling
      try {
        // Try a simple query first as the joins might not be valid
        const { data: examsData, error: examsError } = await supabase
          .from('exams')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (examsError) {
          setExams([]);
          throw examsError;
        }
        
        
        // Map to our interface
        const mappedExams = (examsData || []).map(exam => ({
          id: exam.id,
          title: exam.title || 'Untitled Exam',
          exam_type: exam.exam_type || 'Unknown',
          class_level: exam.class_level || 0,
          max_marks: exam.max_marks || exam.total_marks || 100,
          total_marks: exam.total_marks || exam.max_marks || 100,
          created_at: exam.created_at,
          subject: exam.subject,
          subject_id: exam.subject_id,
          topic_id: exam.topic_id,
          created_by_teacher_id: exam.created_by_teacher_id,
          exam_date: exam.exam_date,
          duration_minutes: exam.duration_minutes
        }));
        
        setExams(mappedExams);
      } catch (examsError) {
        toast({
          title: "Error",
          description: "Failed to load exams data",
          variant: "destructive"
        });
        setExams([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  // Helper function to set default subjects
  const setDefaultSubjects = () => {
    setSubjects([
      { id: '1', name: 'Mathematics', class_level: 11 },
      { id: '2', name: 'Physics', class_level: 11 },
      { id: '3', name: 'Chemistry', class_level: 11 },
      { id: '4', name: 'Biology', class_level: 11 },
      { id: '5', name: 'English', class_level: 11 }
    ]);
  };
  // Fetch topics for a subject
  const fetchTopics = async (subjectId: string) => {
    try {
      // First try to get topics via the topics table
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', subjectId);
      if (error) {
        // If the topics table doesn't exist or has an error, use empty array
        setTopics([]);
        return;
      }
      
      // Map to our interface
      const mappedTopics = (data || []).map(topic => ({
        id: topic.id,
        name: topic.name || 'Unknown Topic',
        description: topic.description,
        subject_id: topic.subject_id,
        created_at: topic.created_at,
        updated_at: topic.updated_at
      }));
      
      setTopics(mappedTopics);
    } catch (error) {
      setTopics([]);
    }
  };
  // Handle subject change
  const handleSubjectChange = (subjectId: string) => {
    setExamForm(prev => ({ ...prev, subjectId, topicId: '' }));
    
    // Only fetch topics if not selecting "other"
    if (subjectId !== 'other') {
      fetchTopics(subjectId);
    } else {
      // Clear topics when "other" is selected
      setTopics([]);
    }
  };
  // Handle create exam form submission
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');
      if (!examForm.examType) {
        toast({
          title: "Error",
          description: "Please select an exam type",
          variant: "destructive"
        });
        return;
      }
      
      // Check if "other" is selected but no custom subject was added
      if (examForm.subjectId === 'other') {
        if (!customSubject.trim()) {
          toast({
            title: "Error",
            description: "Please enter a custom subject name",
            variant: "destructive"
          });
          return;
        }
        
        // Create the custom subject first
        await handleAddCustomSubject();
        // Function will update examForm.subjectId, but we need to wait for the state update
        // We'll proceed with exam creation in the next render
        return;
      }
      
      
      // Get the actual subject name from the selected subject ID
      const selectedSubject = subjects.find(s => s.id === examForm.subjectId);
      const subjectName = selectedSubject ? selectedSubject.name : '';
      
      // Create a consistent payload for the new exam
      const examData: any = {
        title: examForm.title,
        class_level: parseInt(examForm.classLevel),
        exam_type: examForm.examType,
        max_marks: parseInt(examForm.maxMarks),
        total_marks: parseInt(examForm.maxMarks), // Set both fields for compatibility
        created_by_teacher_id: currentUser.user.id,
        exam_date: new Date().toISOString(),
      };
      
      // Add subject fields based on what the database expects
      if (examForm.subjectId !== 'other') {
        // Add subject_id field
        examData.subject_id = examForm.subjectId;
        examData.subject = subjectName; // Also store the name for convenience
      } else if (newSubjectId) {
        // Use the newly created subject ID
        examData.subject_id = newSubjectId;
        examData.subject = customSubject.trim();
      }
      
      // Add topic if selected
      if (examForm.topicId) {
        examData.topic_id = examForm.topicId;
        
        // Get topic name for convenience
        const selectedTopic = topics.find(t => t.id === examForm.topicId);
        if (selectedTopic) {
          examData.topic = selectedTopic.name;
        }
      }
      // Insert the exam
      const { data, error } = await supabase
        .from('exams')
        .insert(examData)
        .select();
      if (error) throw error;
      toast({
        title: "Success",
        description: "Exam created successfully",
        variant: "default"
      });
      // Reset form
      setExamForm({
        title: '',
        subjectId: '',
        topicId: '',
        examType: '',
        classLevel: '11',
        maxMarks: '100'
      });
      
      // Close dialog
      setCreateExamOpen(false);
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create exam",
        variant: "destructive"
      });
    }
  };
  // Handle CSV file upload
  const handleUploadResults = async () => {
    if (!csvFile || !selectedExam) {
      toast({
        title: "Error",
        description: "Please select an exam and upload a CSV file",
        variant: "destructive"
      });
      return;
    }
    // Display a loading toast because this might take some time
    setUploadingResults(true);
    setCsvError(null);
    
    toast({
      title: "Processing...",
      description: "Uploading and processing your results",
      variant: "default"
    });
    try {
      // Read the CSV file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          if (!e.target?.result) throw new Error("Failed to read file");
          
          const csvContent = e.target.result as string;
          const rows = csvContent.split('\n');
          
          // Parse header to determine column indexes
          const headers = rows[0].split(',');
          const studentIdIndex = headers.findIndex(h => 
            h.toLowerCase().includes('student') && h.toLowerCase().includes('id'));
          const marksIndex = headers.findIndex(h => 
            h.toLowerCase().includes('mark') || h.toLowerCase().includes('score'));
          
          if (studentIdIndex === -1 || marksIndex === -1) {
            setCsvError("CSV format error: Could not find required columns (Student ID and Marks)");
            setUploadingResults(false);
            return;
          }
          
          // Parse data rows
          const results = [];
          let errorCount = 0;
          
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i].trim();
            if (!row) continue; // Skip empty rows
            
            const columns = row.split(',');
            const studentId = columns[studentIdIndex]?.trim();
            const marksStr = columns[marksIndex]?.trim();
            
            if (!studentId || !marksStr) {
              errorCount++;
              continue;
            }
            
            const marks = parseInt(marksStr);
            if (isNaN(marks)) {
              errorCount++;
              continue;
            }
            
            results.push({
              exam_id: selectedExam,
              student_id: studentId,
              marks_obtained: marks,
              submitted_at: new Date().toISOString(),
              status: 'SUBMITTED', // Add status field
              examiner_id: (await supabase.auth.getUser()).data.user?.id // Add examiner_id field
            });
          }
          
          if (results.length === 0) {
            setCsvError("No valid data rows found in CSV");
            setUploadingResults(false);
            return;
          }
          
          // Insert results
          const { error } = await supabase.from('exam_results').insert(results as any);
          
          if (error) throw error;
          
          toast({
            title: "Success",
            description: `Marks for ${results.length} students uploaded successfully${
              errorCount > 0 ? ` (${errorCount} rows skipped due to errors)` : ''
            }`,
            variant: "default"
          });
          
          // Reset form
          setCsvFile(null);
          setMarkResultsOpen(false);
          setManualEntryMode(false);
        } catch (parseError: any) {
          setCsvError(parseError.message || "Failed to parse CSV file");
        } finally {
          setUploadingResults(false);
        }
      };
      
      reader.onerror = () => {
        setCsvError("Failed to read file");
        setUploadingResults(false);
      };
      
      reader.readAsText(csvFile);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload results",
        variant: "destructive"
      });
      setUploadingResults(false);
    }
  };
  
  // Handle manual search of students
  const handleSearchStudents = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredStudents([]);
      return;
    }
    
    // Filter students by display_name or enrollment_no
    const filtered = students.filter(student => {
      const nameMatch = student.display_name?.toLowerCase().includes(query.toLowerCase());
      const enrollmentMatch = student.enrollment_no?.toLowerCase().includes(query.toLowerCase());
      const classMatch = selectedClass === '' || student.class_level.toString() === selectedClass;
      
      return (nameMatch || enrollmentMatch) && classMatch;
    });
    
    setFilteredStudents(filtered.slice(0, 10)); // Limit to first 10 results for performance
  };
  // Function to handle adding a custom subject
  const handleAddCustomSubject = async () => {
    try {
      if (!customSubject.trim()) {
        toast({
          title: "Error",
          description: "Please enter a subject name",
          variant: "destructive"
        });
        return;
      }
      
      // Create the subject
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          name: customSubject.trim(),
          class_level: parseInt(examForm.classLevel) || 11
        })
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Store the new subject ID
        setNewSubjectId(data[0].id);
        
        // Add the new subject to the list
        setSubjects(prev => [...prev, {
          id: data[0].id,
          name: customSubject.trim(),
          class_level: parseInt(examForm.classLevel) || 11
        }]);
        
        // Update the form
        setExamForm(prev => ({ ...prev, subjectId: data[0].id }));
        
        toast({
          title: "Success",
          description: "Custom subject added",
          variant: "default"
        });
        
        // Clear the custom subject field
        setCustomSubject('');
        
        // Now we can proceed with exam creation
        handleCreateExam({ preventDefault: () => {} } as React.FormEvent);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add custom subject",
        variant: "destructive"
      });
    }
  };
  // Export exam results as CSV
  const handleExportResults = async (examId: string) => {
    try {
      setExportingExamId(examId);
      
      // Get exam details
      const exam = exams.find(e => e.id === examId);
      if (!exam) throw new Error("Exam not found");
      
      // Get results for this exam
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          *,
          student_profiles(*)
        `)
        .eq('exam_id', examId);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast({
          title: "No Results",
          description: "No results found for this exam",
          variant: "default"
        });
        setExportingExamId(null);
        return;
      }
      
      // Prepare CSV content
      let csvContent = "Student ID,Student Name,Class Level,Marks Obtained,Percentage\n";
      
      data.forEach(result => {
        const student = result.student_profiles;
        const studentName = student?.display_name || student?.enrollment_no || `Student-${result.student_id.substring(0, 8)}`;
        const classLevel = student?.class_level || 'N/A';
        const marks = result.marks_obtained || 0;
        const totalMarks = exam.total_marks || exam.max_marks || 100;
        const percentage = ((marks / totalMarks) * 100).toFixed(2);
        
        csvContent += `${result.student_id},${studentName},${classLevel},${marks},${percentage}%\n`;
      });
      
      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exam.title}_results.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Results exported successfully",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export results",
        variant: "destructive"
      });
    } finally {
      setExportingExamId(null);
    }
  };
  
  // Function to handle file change for CSV upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if it's a CSV file
    if (!file.name.endsWith('.csv')) {
      setCsvError("Please upload a CSV file");
      return;
    }
    
    setCsvFile(file);
    setCsvError(null);
  };
  // Render the loading state
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading exam management data...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Exam Management</h1>
        
        <Dialog open={createExamOpen} onOpenChange={setCreateExamOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Exam</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="examTitle">Exam Title</Label>
                <Input 
                  id="examTitle" 
                  placeholder="e.g. Physics Midterm Exam" 
                  value={examForm.title}
                  onChange={(e) => setExamForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="examType">Exam Type</Label>
                <Select 
                  value={examForm.examType} 
                  onValueChange={(value) => setExamForm(prev => ({ ...prev, examType: value as ExamType }))}
                  required
                >
                  <SelectTrigger id="examType">
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {examTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="classLevel">Class Level</Label>
                <Select 
                  value={examForm.classLevel} 
                  onValueChange={(value) => setExamForm(prev => ({ ...prev, classLevel: value }))}
                  required
                >
                  <SelectTrigger id="classLevel">
                    <SelectValue placeholder="Select class level" />
                  </SelectTrigger>
                  <SelectContent>
                    {[8, 9, 10, 11, 12].map((level) => (
                      <SelectItem key={level} value={level.toString()}>Class {level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={examForm.subjectId} 
                  onValueChange={handleSubjectChange}
                  required
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                    ))}
                    <SelectItem value="other">Other (Add new subject)</SelectItem>
                  </SelectContent>
                </Select>
                
                {examForm.subjectId === 'other' && (
                  <div className="mt-2 flex gap-2">
                    <Input 
                      placeholder="Enter subject name" 
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddCustomSubject} 
                      disabled={!customSubject.trim()}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>
              
              {examForm.subjectId && examForm.subjectId !== 'other' && topics.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic (Optional)</Label>
                  <Select 
                    value={examForm.topicId} 
                    onValueChange={(value) => setExamForm(prev => ({ ...prev, topicId: value }))}
                  >
                    <SelectTrigger id="topic">
                      <SelectValue placeholder="Select topic (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>{topic.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="maxMarks">Maximum Marks</Label>
                <Input 
                  id="maxMarks" 
                  type="number"
                  min="1"
                  value={examForm.maxMarks}
                  onChange={(e) => setExamForm(prev => ({ ...prev, maxMarks: e.target.value }))}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full">Create Exam</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Tabs defaultValue="exams">
        <TabsList className="mb-4">
          <TabsTrigger value="exams">
            <BookOpen className="mr-2 h-4 w-4" />
            Exams
          </TabsTrigger>
          <TabsTrigger value="results">
            <Target className="mr-2 h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="mr-2 h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="mr-2 h-4 w-4" />
            Database Admin
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="exams">
          <Card>
            <CardHeader>
              <CardTitle>Exam List</CardTitle>
            </CardHeader>
            <CardContent>
              {exams.length === 0 ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No Exams Found</AlertTitle>
                  <AlertDescription>
                    You haven't created any exams yet. Click the "Create New Exam" button to get started.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exams.map((exam) => (
                      <Card key={exam.id} className="overflow-hidden">
                        <CardHeader className="bg-muted p-4">
                          <CardTitle className="text-lg">{exam.title}</CardTitle>
                          <div className="text-sm text-muted-foreground">
                            Type: {exam.exam_type} | Class: {exam.class_level}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                          <div className="text-sm">
                            <strong>Subject:</strong> {exam.subject || 'Unknown'}
                          </div>
                          <div className="text-sm">
                            <strong>Total Marks:</strong> {exam.total_marks || exam.max_marks || 100}
                          </div>
                          <div className="text-sm">
                            <strong>Date:</strong> {new Date(exam.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex justify-between mt-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedExam(exam.id)}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Results
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Upload Exam Results</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant={manualEntryMode ? "default" : "outline"}
                                      onClick={() => setManualEntryMode(true)}
                                    >
                                      Manual Entry
                                    </Button>
                                    <Button
                                      variant={manualEntryMode ? "outline" : "default"}
                                      onClick={() => setManualEntryMode(false)}
                                    >
                                      CSV Upload
                                    </Button>
                                  </div>
                                  
                                  {manualEntryMode ? (
                                    <ManualMarkUpload 
                                      students={students}
                                      examId={selectedExam}
                                      onSuccess={() => fetchData()}
                                    />
                                  ) : (
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="csvFile">Upload CSV File</Label>
                                        <Input 
                                          id="csvFile" 
                                          type="file" 
                                          accept=".csv" 
                                          onChange={handleFileChange}
                                        />
                                        {csvError && (
                                          <p className="text-sm text-destructive">{csvError}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                          CSV should have columns for Student ID and Marks.
                                        </p>
                                      </div>
                                      
                                      <Button 
                                        onClick={handleUploadResults}
                                        disabled={!csvFile || uploadingResults}
                                        className="w-full"
                                      >
                                        {uploadingResults ? 'Uploading...' : 'Upload Results'}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportResults(exam.id)}
                              disabled={exportingExamId === exam.id}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {exportingExamId === exam.id ? 'Exporting...' : 'Export'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Exam Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Select an exam to view or manage its results.</p>
              {/* We'll implement detailed results views in a future update */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>View and manage students. This functionality will be expanded in future updates.</p>
              
              <div className="mt-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Input 
                    placeholder="Search by ID or enrollment number"
                    value={searchQuery}
                    onChange={(e) => handleSearchStudents(e.target.value)}
                    className="max-w-md"
                  />
                  <Select 
                    value={selectedClass} 
                    onValueChange={setSelectedClass}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Classes</SelectItem>
                      {[8, 9, 10, 11, 12].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          Class {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="border rounded-md">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(searchQuery ? filteredStudents : students.slice(0, 10)).map((student) => (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{student.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">{student.display_name}</div>
                            <div className="text-sm text-gray-500">{student.enrollment_no || 'No enrollment number'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{student.class_level}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <Button variant="outline" size="sm">View Details</Button>
                          </td>
                        </tr>
                      ))}
                      
                      {students.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            No students found
                          </td>
                        </tr>
                      )}
                      
                      {searchQuery && filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            No students match your search
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Administration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Database Admin Tools</AlertTitle>
                  <AlertDescription>
                    These tools help manage and troubleshoot the database. Use with caution.
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-md">Database Inspection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">Check database structure and diagnose issues.</p>
                        <div className="flex space-x-2">
                          <Link to="/admin/database-inspector">
                            <Button variant="outline" size="sm">Open Inspector</Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-md">Run Maintenance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">Execute database maintenance operations.</p>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Check Tables</Button>
                          <Button variant="outline" size="sm">Fix Permissions</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default ExamManagement;
