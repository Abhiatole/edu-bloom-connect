
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Save, Users } from 'lucide-react';

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  class_level?: number;
}

interface Exam {
  id: string;
  title: string;
  total_marks: number;
  class_level: number;
  subject: string;
}

const TestMarksUpload = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('11');
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  const loadExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading exams:', error);
        return;
      }

      setExams(data || []);
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  };

  const loadStudents = async () => {
    try {
      // Get students from user_profiles with student role
      const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, email')
        .eq('role', 'STUDENT')
        .eq('status', 'APPROVED');

      if (userError) {
        console.error('Error loading students:', userError);
        return;
      }

      // Get student profile data
      const { data: studentProfiles, error: studentError } = await supabase
        .from('student_profiles')
        .select('user_id, class_level')
        .eq('class_level', parseInt(selectedClass));

      if (studentError) {
        console.error('Error loading student profiles:', studentError);
        return;
      }

      // Merge data
      const mergedStudents = userProfiles
        ?.filter(user => 
          studentProfiles?.some(profile => profile.user_id === user.user_id)
        )
        .map(user => {
          const profile = studentProfiles?.find(p => p.user_id === user.user_id);
          return {
            ...user,
            class_level: profile?.class_level || parseInt(selectedClass)
          };
        }) || [];

      setStudents(mergedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleMarkChange = (studentUserId: string, mark: string) => {
    const numMark = parseInt(mark) || 0;
    setMarks(prev => ({ ...prev, [studentUserId]: numMark }));
  };

  const calculateGrade = (marks: number, totalMarks: number): string => {
    const percentage = (marks / totalMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 35) return 'D';
    return 'F';
  };

  const handleSaveMarks = async () => {
    if (!selectedExam) {
      toast({
        title: "Error",
        description: "Please select an exam first",
        variant: "destructive"
      });
      return;
    }

    const selectedExamData = exams.find(e => e.id === selectedExam);
    if (!selectedExamData) {
      toast({
        title: "Error",
        description: "Selected exam not found",
        variant: "destructive"
      });
      return;
    }

    const resultsToUpload = students
      .filter(student => marks[student.user_id] !== undefined)
      .map(student => ({
        exam_id: selectedExam,
        student_id: student.user_id,
        marks_obtained: marks[student.user_id],
        grade: calculateGrade(marks[student.user_id], selectedExamData.total_marks)
      }));

    if (resultsToUpload.length === 0) {
      toast({
        title: "Warning",
        description: "No marks entered to save",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('exam_results')
        .upsert(resultsToUpload, { 
          onConflict: 'exam_id,student_id' 
        });

      if (error) {
        console.error('Error saving marks:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `${resultsToUpload.length} exam results saved successfully`
      });

      setMarks({}); // Clear marks after successful upload
    } catch (error: any) {
      console.error('Error saving marks:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save marks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Test Marks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="class">Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
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
              <Label htmlFor="exam">Select Exam</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams
                    .filter(exam => exam.class_level === parseInt(selectedClass))
                    .map(exam => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.title} - {exam.subject} (Max: {exam.total_marks})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {students.length > 0 && selectedExam && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Students ({students.length})
                </h3>
                <Button onClick={handleSaveMarks} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save All Marks'}
                </Button>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(student => (
                      <TableRow key={student.user_id}>
                        <TableCell className="font-medium">
                          {student.full_name}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {student.email}
                        </TableCell>
                        <TableCell>
                          {student.class_level || selectedClass}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={exams.find(e => e.id === selectedExam)?.total_marks || 100}
                            value={marks[student.user_id] || ''}
                            onChange={(e) => handleMarkChange(student.user_id, e.target.value)}
                            placeholder="Enter marks"
                            className="w-24"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {students.length === 0 && selectedClass && (
            <div className="text-center py-8 text-gray-500">
              No approved students found for Class {selectedClass}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestMarksUpload;
