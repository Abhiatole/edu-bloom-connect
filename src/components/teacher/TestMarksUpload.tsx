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
  class_level: number;
  enrollment_no?: string;
  display_name?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
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
    fetchExams();
  }, []);
  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);
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
      setExams(data || []);
    } catch (error) {
    }
  };  const fetchStudents = async () => {
    try {
      // Try to fetch all possible fields that might exist in different database versions
      const { data, error } = await supabase
        .from('student_profiles')
        .select('id, class_level, enrollment_no, display_name')
        .eq('class_level', parseInt(selectedClass))
        .order('id', { ascending: true });
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
    }
  };
  const handleMarkChange = (studentId: string, mark: string) => {
    const numMark = parseInt(mark) || 0;
    setMarks(prev => ({ ...prev, [studentId]: numMark }));
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
    if (!selectedExamData) return;
    setLoading(true);
    try {
      const resultsToInsert = students
        .filter(student => marks[student.id] !== undefined)
        .map(student => ({
          exam_id: selectedExam,
          student_id: student.id,
          marks_obtained: marks[student.id],
          grade: getGrade((marks[student.id] / selectedExamData.total_marks) * 100)
        }));
      if (resultsToInsert.length === 0) {
        toast({
          title: "Warning",
          description: "No marks entered to save",
          variant: "destructive"
        });
        return;
      }
      const { error } = await supabase
        .from('exam_results')
        .upsert(resultsToInsert, { 
          onConflict: 'exam_id,student_id',
          ignoreDuplicates: false 
        });
      if (error) throw error;
      toast({
        title: "Success",
        description: `Marks saved for ${resultsToInsert.length} students`
      });
      setMarks({});
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save marks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const getGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 35) return 'D';
    return 'F';
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
                  {exams.map(exam => (
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
              <div className="border rounded-lg">                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Enrollment No.</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(student => (
                      <TableRow key={student.id}>                      <TableCell className="font-medium">
                          {`Ananya Sharma`}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {student.enrollment_no || 'N/A'}
                        </TableCell>
                        <TableCell>{student.class_level}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={exams.find(e => e.id === selectedExam)?.total_marks || 100}
                            value={marks[student.id] || ''}
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
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
        </CardContent>
      </Card>
    </div>
  );
};
export default TestMarksUpload;
