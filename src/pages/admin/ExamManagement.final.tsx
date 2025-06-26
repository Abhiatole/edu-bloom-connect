import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ManualMarkUpload from '@/components/ManualMarkUpload';
import CSVUploader from '@/components/CSVUploader';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
// Interfaces matching the actual DB schema
interface Student {
  id: string;
  enrollment_no?: string;
  class_level: number;
  display_name?: string;
}
interface Subject {
  id: string;
  name: string;
  class_level: number;
  created_at?: string;
  updated_at?: string;
}
interface Topic {
  id: string;
  name: string;
  description?: string;
  subject_id: string;
  created_at?: string;
  updated_at?: string;
}
// Use string literals based on database enum
type ExamType = 'JEE' | 'NEET' | 'CET' | 'Boards' | 'Internal' | 'Quarterly' | 'Half Yearly' | 'Annual';
interface Exam {
  id: string;
  title: string;
  description?: string;
  exam_date: string;
  exam_type: ExamType;
  duration_minutes: number;
  class_level: number;
  subject_id?: string;
  subject?: string;
  topic_id?: string;
  topic?: string;
  max_marks: number;
  passing_marks?: number;
  created_by_teacher_id: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  percentage?: number;
  grade?: string;
  remarks?: string;
  status?: string;
  examiner_id?: string;
  submitted_at?: string;
}
const ExamManagement: React.FC = () => {
  const { toast } = useToast();
  
  // State for data
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  
  // State for selected values
  const [selectedClassLevel, setSelectedClassLevel] = useState<string>('11');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  
  // State for UI
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  
  // State for new exam form
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    exam_date: format(new Date(), 'yyyy-MM-dd'),
    exam_type: 'Internal' as ExamType,
    duration_minutes: 60,
    class_level: 11,
    subject: '',
    subject_id: '',
    topic: '',
    topic_id: '',
    max_marks: 100,
    passing_marks: 35,
  });
  
  // State for CSV upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvError, setCsvError] = useState<string>('');
  const [uploadingResults, setUploadingResults] = useState<boolean>(false);
  
  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, []);
  
  // Reload topics when selected subject changes
  useEffect(() => {
    if (selectedSubject) {
      loadTopicsForSubject(selectedSubject);
    } else {
      setTopics([]);
    }
  }, [selectedSubject]);
  
  // Load all data (students, subjects, exams)
  const loadData = async () => {
    setLoading(true);
    
    try {
      // Try to use RPC function if available
      try {
        const { data: subjectsData, error: subjectsError } = await supabase.rpc('get_subjects');
        
        if (!subjectsError && subjectsData) {
          setSubjects(subjectsData);
        } else {
          throw new Error('RPC failed, falling back to direct query');
        }
      } catch (rpcError) {
        // Fallback: query subjects table directly
        const { data: subjectsData, error: fallbackError } = await supabase
          .from('subjects')
          .select('*')
          .order('name');
          
        if (fallbackError) {
          // Provide default subjects if query fails
          setSubjects([
            { id: '1', name: 'Physics', class_level: 11 },
            { id: '2', name: 'Chemistry', class_level: 11 },
            { id: '3', name: 'Mathematics', class_level: 11 },
            { id: '4', name: 'Biology', class_level: 11 },
            { id: '5', name: 'English', class_level: 11 }
          ]);
        } else {
          // Transform the data to match Subject interface
          const processedSubjects = (subjectsData || []).map(subj => ({
            id: subj.id || '',
            name: subj.name || 'Unknown Subject',
            class_level: subj.class_level || 11,
            created_at: subj.created_at,
            updated_at: subj.updated_at
          }));
          
          setSubjects(processedSubjects);
        }
      }
      
      // Fetch students
      try {
        const { data: studentsData, error: studentsError } = await supabase
          .from('student_profiles')
          .select('id, enrollment_no, class_level, first_name, last_name');
        
        if (studentsError) {
        } else {
          // Transform student data to include display_name
          const processedStudents = (studentsData || []).map(student => ({
            id: student.id,
            enrollment_no: student.enrollment_no,
            class_level: student.class_level || 11,
            display_name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student'
          }));
          
          setStudents(processedStudents);
        }
      } catch (studentError) {
        setStudents([]);
      }
      
      // Fetch exams
      try {
        const { data: examsData, error: examsError } = await supabase
          .from('exams')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (examsError) {
          setExams([]);
        } else {
          // Transform exams data to match Exam interface
          const processedExams = (examsData || []).map(exam => ({
            id: exam.id,
            title: exam.title || 'Untitled Exam',
            description: exam.description,
            exam_date: exam.exam_date || new Date().toISOString(),
            exam_type: exam.exam_type || 'Internal',
            duration_minutes: exam.duration_minutes || 60,
            class_level: exam.class_level || 11,
            subject_id: exam.subject_id,
            subject: exam.subject,
            topic_id: exam.topic_id,
            topic: exam.topic,
            max_marks: exam.max_marks || 100,
            passing_marks: exam.passing_marks || 35,
            created_by_teacher_id: exam.created_by_teacher_id || exam.created_by || '',
            status: exam.status || 'ACTIVE',
            created_at: exam.created_at,
            updated_at: exam.updated_at
          }));
          
          setExams(processedExams);
        }
      } catch (examsError) {
        setExams([]);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load exam data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load topics for a specific subject
  const loadTopicsForSubject = async (subjectId: string) => {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', subjectId);
      
      if (error) {
        setTopics([]);
      } else {
        // Transform topics data
        const processedTopics = (data || []).map(topic => ({
          id: topic.id,
          name: topic.name || 'Unknown Topic',
          description: topic.description,
          subject_id: topic.subject_id,
          created_at: topic.created_at,
          updated_at: topic.updated_at
        }));
        
        setTopics(processedTopics);
      }
    } catch (error) {
      setTopics([]);
    }
  };
  
  // Handle form input changes for new exam
  const handleExamInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewExam(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes for new exam
  const handleExamSelectChange = (name: string, value: string) => {
    setNewExam(prev => ({ ...prev, [name]: value }));
  };
  
  // Add a new subject
  const handleAddSubject = async () => {
    if (!customSubject.trim()) {
      toast({
        title: 'Error',
        description: 'Subject name cannot be empty',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          name: customSubject.trim(),
          class_level: parseInt(selectedClassLevel) || 11
        })
        .select();
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to add subject. Please try again.',
          variant: 'destructive',
        });
      } else if (data && data.length > 0) {
        toast({
          title: 'Success',
          description: 'Subject added successfully',
        });
        
        setSubjects(prev => [...prev, {
          id: data[0].id,
          name: data[0].name,
          class_level: data[0].class_level,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at
        }]);
        
        setCustomSubject('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while adding the subject',
        variant: 'destructive',
      });
    }
  };
  
  // Add a new topic
  const handleAddTopic = async () => {
    if (!customTopic.trim() || !selectedSubject) {
      toast({
        title: 'Error',
        description: 'Topic name and subject are required',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('topics')
        .insert({
          name: customTopic.trim(),
          subject_id: selectedSubject
        })
        .select();
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to add topic. Please try again.',
          variant: 'destructive',
        });
      } else if (data && data.length > 0) {
        toast({
          title: 'Success',
          description: 'Topic added successfully',
        });
        
        setTopics(prev => [...prev, {
          id: data[0].id,
          name: data[0].name,
          description: data[0].description,
          subject_id: data[0].subject_id,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at
        }]);
        
        setCustomTopic('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while adding the topic',
        variant: 'destructive',
      });
    }
  };
  
  // Create a new exam
  const handleCreateExam = async () => {
    // Basic validation
    if (!newExam.title || !newExam.exam_date || !selectedSubject) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    // Get subject and topic information
    const selectedSubjectObj = subjects.find(s => s.id === selectedSubject);
    const selectedTopicObj = topics.find(t => t.id === selectedTopic);
    
    // Get current user ID for created_by field
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    
    if (!userId) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to create an exam',
        variant: 'destructive',
      });
      return;
    }
    
    // Create the exam object
    const examToCreate: any = {
      title: newExam.title,
      description: newExam.description,
      exam_date: newExam.exam_date,
      exam_type: newExam.exam_type,
      duration_minutes: Number(newExam.duration_minutes),
      class_level: Number(newExam.class_level),
      subject_id: selectedSubject,
      subject: selectedSubjectObj?.name || '',
      topic_id: selectedTopic || null,
      topic: selectedTopicObj?.name || '',
      max_marks: Number(newExam.max_marks),
      passing_marks: Number(newExam.passing_marks),
      created_by_teacher_id: userId,
      status: 'ACTIVE'
    };
    
    try {
      const { data, error } = await supabase
        .from('exams')
        .insert(examToCreate)
        .select();
      
      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create exam. Please try again.',
          variant: 'destructive',
        });
      } else if (data && data.length > 0) {
        toast({
          title: 'Success',
          description: 'Exam created successfully',
        });
        
        // Add the new exam to state
        setExams(prev => [
          {
            ...examToCreate,
            id: data[0].id,
            created_at: data[0].created_at,
            updated_at: data[0].updated_at
          },
          ...prev
        ]);
        
        // Reset the form
        setNewExam({
          title: '',
          description: '',
          exam_date: format(new Date(), 'yyyy-MM-dd'),
          exam_type: 'Internal' as ExamType,
          duration_minutes: 60,
          class_level: 11,
          subject: '',
          subject_id: '',
          topic: '',
          topic_id: '',
          max_marks: 100,
          passing_marks: 35,
        });
        
        setSelectedSubject('');
        setSelectedTopic('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while creating the exam',
        variant: 'destructive',
      });
    }
  };
  
  // Handle CSV file selection
  const handleFileSelect = (file: File) => {
    setCsvFile(file);
    setCsvError('');
  };
  
  // Reset CSV upload state
  const handleResetCsv = () => {
    setCsvFile(null);
    setCsvError('');
  };
  
  // Process and upload CSV results
  const handleUploadCsv = async () => {
    if (!csvFile || !selectedExam) {
      setCsvError('Please select a file and an exam');
      return;
    }
    
    setUploadingResults(true);
    
    try {
      // Read the CSV file
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const csv = e.target?.result as string;
        if (!csv) {
          setCsvError('Failed to read CSV file');
          setUploadingResults(false);
          return;
        }
        
        // Parse the CSV data
        const rows = csv.split('\n');
        const headers = rows[0].split(',').map(h => h.trim());
        
        // Check required columns
        const studentIdIndex = headers.findIndex(h => 
          h.toLowerCase() === 'student_id' || h.toLowerCase() === 'studentid' || h.toLowerCase() === 'id');
        const marksIndex = headers.findIndex(h => 
          h.toLowerCase() === 'marks' || h.toLowerCase() === 'marks_obtained' || h.toLowerCase() === 'score');
        
        if (studentIdIndex === -1 || marksIndex === -1) {
          setCsvError('CSV must include student_id and marks columns');
          setUploadingResults(false);
          return;
        }
        
        // Optional columns
        const remarksIndex = headers.findIndex(h => h.toLowerCase() === 'remarks');
        const gradeIndex = headers.findIndex(h => h.toLowerCase() === 'grade');
        
        // Build student map for validation
        const studentMap = new Map();
        students.forEach(student => {
          studentMap.set(student.id, {
            display_name: student.display_name,
            class_level: student.class_level
          });
        });
        
        // Get exam details
        const examData = exams.find(e => e.id === selectedExam);
        if (!examData) {
          setCsvError('Selected exam not found');
          setUploadingResults(false);
          return;
        }
        
        // Process rows (skip header)
        const results = [];
        const errors = [];
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].split(',').map(cell => cell.trim());
          if (row.length <= 1) continue; // Skip empty rows
          
          const studentId = row[studentIdIndex];
          const marksStr = row[marksIndex];
          
          // Validate student ID
          if (!studentMap.has(studentId)) {
            errors.push(`Row ${i+1}: Student ID ${studentId} not found`);
            continue;
          }
          
          // Validate marks
          const marks = parseFloat(marksStr);
          if (isNaN(marks)) {
            errors.push(`Row ${i+1}: Invalid marks value "${marksStr}"`);
            continue;
          }
          
          // Get optional data
          const remarks = remarksIndex !== -1 ? row[remarksIndex] : '';
          const grade = gradeIndex !== -1 ? row[gradeIndex] : '';
          
          // Calculate percentage
          const maxMarks = examData.max_marks || 100;
          const percentage = (marks / maxMarks) * 100;
          
          // Create result object
          results.push({
            exam_id: selectedExam,
            student_id: studentId,
            marks_obtained: marks,
            percentage,
            remarks,
            grade,
            status: 'GRADED',
            submitted_at: new Date().toISOString()
          });
        }
        
        // Handle validation errors
        if (errors.length > 0) {
          setCsvError(`${errors.length} errors found:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n...and ${errors.length - 3} more` : ''}`);
          setUploadingResults(false);
          return;
        }
        
        // Save results to database
        if (results.length > 0) {
          const { error } = await supabase
            .from('exam_results')
            .upsert(results, { 
              onConflict: 'exam_id,student_id',
              ignoreDuplicates: false
            });
          
          if (error) {
            setCsvError(`Database error: ${error.message}`);
          } else {
            toast({
              title: 'Success',
              description: `Uploaded ${results.length} results for ${examData.title}`,
            });
            
            // Reset
            setCsvFile(null);
            setCsvError('');
          }
        } else {
          setCsvError('No valid results found in CSV');
        }
      };
      
      reader.onerror = () => {
        setCsvError('Failed to read the file');
      };
      
      reader.readAsText(csvFile);
    } catch (error) {
      setCsvError('Error processing CSV file');
    } finally {
      setUploadingResults(false);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading exam management...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Exam Management</h1>
      
      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="upload">Upload Results</TabsTrigger>
          <TabsTrigger value="create">Create Exam</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Exam Results</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exam-select">Select Exam</Label>
                  <Select value={selectedExam} onValueChange={setSelectedExam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map(exam => (
                        <SelectItem key={exam.id} value={exam.id}>
                          {exam.title} ({exam.subject || 'Unknown'}) - {new Date(exam.exam_date).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="font-medium">Upload Method</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">CSV Upload</h4>
                      <CSVUploader 
                        onFileSelect={handleFileSelect}
                        onReset={handleResetCsv}
                        isUploading={uploadingResults}
                        error={csvError}
                      />
                      
                      <Button 
                        className="mt-4" 
                        onClick={handleUploadCsv}
                        disabled={uploadingResults || !csvFile || !!csvError || !selectedExam}
                      >
                        {uploadingResults ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Upload Results'
                        )}
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Manual Entry</h4>
                      <ManualMarkUpload 
                        exams={exams} 
                        students={students}
                        onSuccess={() => {
                          toast({
                            title: 'Success',
                            description: 'Marks uploaded successfully',
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Create New Exam</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Exam Title</Label>
                    <Input 
                      id="title" 
                      name="title" 
                      value={newExam.title} 
                      onChange={handleExamInputChange} 
                      placeholder="Midterm Assessment"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input 
                      id="description" 
                      name="description" 
                      value={newExam.description} 
                      onChange={handleExamInputChange} 
                      placeholder="Exam covering chapters 1-5"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exam_date">Exam Date</Label>
                    <Input 
                      id="exam_date" 
                      name="exam_date" 
                      type="date" 
                      value={newExam.exam_date} 
                      onChange={handleExamInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exam_type">Exam Type</Label>
                    <Select
                      value={newExam.exam_type}
                      onValueChange={(value) => handleExamSelectChange('exam_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select exam type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="JEE">JEE</SelectItem>
                        <SelectItem value="NEET">NEET</SelectItem>
                        <SelectItem value="CET">CET</SelectItem>
                        <SelectItem value="Boards">Boards</SelectItem>
                        <SelectItem value="Internal">Internal</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Half Yearly">Half Yearly</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="class_level">Class Level</Label>
                    <Select
                      value={newExam.class_level.toString()}
                      onValueChange={(value) => handleExamSelectChange('class_level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class level" />
                      </SelectTrigger>
                      <SelectContent>
                        {[9, 10, 11, 12].map(level => (
                          <SelectItem key={level} value={level.toString()}>
                            Class {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedSubject}
                        onValueChange={setSelectedSubject}
                      >
                        <SelectTrigger className="flex-grow">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-subject">Add New Subject</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="new-subject" 
                        value={customSubject} 
                        onChange={(e) => setCustomSubject(e.target.value)} 
                        placeholder="Computer Science"
                      />
                      <Button onClick={handleAddSubject}>Add</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedTopic}
                        onValueChange={setSelectedTopic}
                        disabled={!selectedSubject}
                      >
                        <SelectTrigger className="flex-grow">
                          <SelectValue placeholder={selectedSubject ? "Select topic" : "Select a subject first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map(topic => (
                            <SelectItem key={topic.id} value={topic.id}>
                              {topic.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-topic">Add New Topic</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="new-topic" 
                        value={customTopic} 
                        onChange={(e) => setCustomTopic(e.target.value)} 
                        placeholder="Algorithms"
                        disabled={!selectedSubject}
                      />
                      <Button onClick={handleAddTopic} disabled={!selectedSubject}>Add</Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                      <Input 
                        id="duration_minutes" 
                        name="duration_minutes" 
                        type="number" 
                        value={newExam.duration_minutes.toString()} 
                        onChange={handleExamInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="max_marks">Maximum Marks</Label>
                      <Input 
                        id="max_marks" 
                        name="max_marks" 
                        type="number" 
                        value={newExam.max_marks.toString()} 
                        onChange={handleExamInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="passing_marks">Passing Marks</Label>
                    <Input 
                      id="passing_marks" 
                      name="passing_marks" 
                      type="number" 
                      value={newExam.passing_marks.toString()} 
                      onChange={handleExamInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <Button className="mt-6" onClick={handleCreateExam}>
                Create Exam
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default ExamManagement;
