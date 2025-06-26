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
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
// Simplified interfaces based on what we know exists in the DB
interface Student {
  id: string;
  enrollment_no?: string;
  class_level: number;
  display_name?: string;
}
// Use hardcoded subjects since the subjects table might not exist
const SUBJECTS = [
  { id: '1', name: 'Physics', class_level: 11 },
  { id: '2', name: 'Chemistry', class_level: 11 },
  { id: '3', name: 'Mathematics', class_level: 11 },
  { id: '4', name: 'Biology', class_level: 11 },
  { id: '5', name: 'English', class_level: 11 }
];
// Use hardcoded topics since the topics table might not exist
const TOPICS_BY_SUBJECT = {
  '1': [
    { id: '101', name: 'Mechanics', subject_id: '1' },
    { id: '102', name: 'Thermodynamics', subject_id: '1' },
    { id: '103', name: 'Optics', subject_id: '1' },
  ],
  '2': [
    { id: '201', name: 'Organic Chemistry', subject_id: '2' },
    { id: '202', name: 'Inorganic Chemistry', subject_id: '2' },
    { id: '203', name: 'Physical Chemistry', subject_id: '2' },
  ],
  '3': [
    { id: '301', name: 'Calculus', subject_id: '3' },
    { id: '302', name: 'Algebra', subject_id: '3' },
    { id: '303', name: 'Trigonometry', subject_id: '3' },
  ],
  '4': [
    { id: '401', name: 'Botany', subject_id: '4' },
    { id: '402', name: 'Zoology', subject_id: '4' },
    { id: '403', name: 'Microbiology', subject_id: '4' },
  ],
  '5': [
    { id: '501', name: 'Grammar', subject_id: '5' },
    { id: '502', name: 'Literature', subject_id: '5' },
    { id: '503', name: 'Comprehension', subject_id: '5' },
  ]
};
// Valid exam types based on Supabase enum
const EXAM_TYPES = ['JEE', 'NEET', 'CET', 'Boards', 'Internal'];
interface Exam {
  id: string;
  title: string;
  exam_date: string;
  exam_type: string;
  duration_minutes: number;
  class_level: number;
  subject?: string;
  topic?: string;
  created_by_teacher_id: string;
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
  submitted_at?: string;
}
const ExamManagement: React.FC = () => {
  const { toast } = useToast();
  
  // State for data
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  
  // State for selected values
  const [selectedClassLevel, setSelectedClassLevel] = useState<string>('11');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  
  // State for UI
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('upload');
  
  // State for new exam form
  const [newExam, setNewExam] = useState({
    title: '',
    exam_date: format(new Date(), 'yyyy-MM-dd'),
    exam_type: 'Internal',
    duration_minutes: 60,
    class_level: 11,
    subject: '',
    topic: '',
    max_marks: 100
  });
  
  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, []);
  
  // Topics depend on selected subject
  const [topics, setTopics] = useState<any[]>([]);
  useEffect(() => {
    if (selectedSubject && TOPICS_BY_SUBJECT[selectedSubject]) {
      setTopics(TOPICS_BY_SUBJECT[selectedSubject]);
    } else {
      setTopics([]);
    }
  }, [selectedSubject]);
  
  // Load all data (students, exams)
  const loadData = async () => {
    setLoading(true);
    
    try {
      // Fetch students
      try {
        const { data: studentsData, error: studentsError } = await supabase
          .from('student_profiles')
          .select('id, class_level');
        
        if (studentsError) {
          setStudents([]);
        } else {
          // Transform student data with a display name placeholder
          const processedStudents = (studentsData || []).map((student, index) => ({
            id: student.id,
            class_level: student.class_level || 11,
            display_name: `Student ${index + 1}`
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
          // Transform exams data with minimal fields we know exist
          const processedExams = (examsData || []).map(exam => ({
            id: exam.id,
            title: exam.title || 'Untitled Exam',
            exam_date: exam.exam_date || new Date().toISOString(),
            exam_type: exam.exam_type || 'Internal',
            duration_minutes: exam.duration_minutes || 60,
            class_level: exam.class_level || 11,
            subject: exam.subject || '',
            topic: exam.topic || '',
            created_by_teacher_id: exam.created_by_teacher_id || '',
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
  
  // Handle form input changes for new exam
  const handleExamInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewExam(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes for new exam
  const handleExamSelectChange = (name: string, value: string) => {
    setNewExam(prev => ({ ...prev, [name]: value }));
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
    const selectedSubjectObj = SUBJECTS.find(s => s.id === selectedSubject);
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
    
    // Create the exam object with only fields that exist in the DB
    const examToCreate: any = {
      title: newExam.title,
      exam_date: newExam.exam_date,
      exam_type: newExam.exam_type,
      duration_minutes: Number(newExam.duration_minutes),
      class_level: Number(newExam.class_level),
      subject: selectedSubjectObj?.name || '',
      topic: selectedTopicObj?.name || '',
      created_by_teacher_id: userId
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
          exam_date: format(new Date(), 'yyyy-MM-dd'),
          exam_type: 'Internal',
          duration_minutes: 60,
          class_level: 11,
          subject: '',
          topic: '',
          max_marks: 100
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
                  <h3 className="font-medium">Manual Mark Entry</h3>
                  
                  <div>
                    <ManualMarkUpload 
                      exams={exams.map(exam => ({
                        id: exam.id,
                        title: exam.title,
                        max_marks: 100 // Default since max_marks may not exist
                      }))} 
                      students={students.map(student => ({
                        id: student.id,
                        enrollment_no: student.id.substring(0, 8), // Generate a fake enrollment number if it doesn't exist
                        display_name: student.display_name || `Student ${student.id.substring(0, 4)}`
                      }))}
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
                        {EXAM_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
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
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Select
                      value={selectedTopic}
                      onValueChange={setSelectedTopic}
                      disabled={!selectedSubject}
                    >
                      <SelectTrigger>
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
