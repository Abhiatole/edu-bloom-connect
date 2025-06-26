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
// Minimal interface for Student
interface Student {
  id: string;
  enrollment_no: string;
  display_name: string;
}
// Minimal interface for Exam
interface Exam {
  id: string;
  title: string;
  max_marks: number;
}
// Valid exam types based on Supabase enum
const EXAM_TYPES = ['JEE', 'NEET', 'CET', 'Boards', 'Internal'];
// Hardcoded subjects
const SUBJECTS = [
  { id: '1', name: 'Physics' },
  { id: '2', name: 'Chemistry' },
  { id: '3', name: 'Mathematics' },
  { id: '4', name: 'Biology' },
  { id: '5', name: 'English' }
];
const ExamManagement: React.FC = () => {
  const { toast } = useToast();
  
  // State for data
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  
  // State for selected values
  const [selectedClassLevel, setSelectedClassLevel] = useState<string>('11');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
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
    max_marks: 100
  });
  
  // Load data when component mounts
  useEffect(() => {
    loadData();
  }, []);
  
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
          // Transform student data with placeholder info
          const processedStudents = (studentsData || []).map((student, index) => ({
            id: student.id,
            enrollment_no: `S${index + 1000}`,
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
          .select('id, title');
        
        if (examsError) {
          setExams([]);
        } else {
          // Transform exams data with minimal fields
          const processedExams = (examsData || []).map(exam => ({
            id: exam.id,
            title: exam.title || 'Untitled Exam',
            max_marks: 100 // Default value
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
    if (!newExam.title || !newExam.exam_date) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
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
    
    // Create minimal exam object
    const examToCreate = {
      title: newExam.title,
      exam_date: newExam.exam_date,
      exam_type: newExam.exam_type,
      duration_minutes: Number(newExam.duration_minutes),
      class_level: Number(newExam.class_level),
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
            id: data[0].id,
            title: data[0].title || examToCreate.title,
            max_marks: 100
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
          max_marks: 100
        });
        
        setSelectedSubject('');
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
                          {exam.title}
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
