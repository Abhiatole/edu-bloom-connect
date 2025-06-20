
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useExamManagement } from '@/hooks/useExamManagement';
import { Upload, Save, Users } from 'lucide-react';

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  student_profiles?: {
    class_level: number;
  };
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
  const { toast } = useToast();
  const { fetchExams, fetchStudents, uploadResults, loading } = useExamManagement();

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
      const examsData = await fetchExams();
      console.log('Loaded exams:', examsData);
      setExams(examsData || []);
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const studentsData = await fetchStudents(parseInt(selectedClass));
      console.log('Loaded students:', studentsData);
      
      // Transform the data to match our interface
      const transformedStudents = studentsData.map(student => ({
        id: student.id,
        user_id: student.user_id,
        full_name: student.full_name,
        email: student.email,
        student_profiles: student.student_profiles
      }));
      
      setStudents(transformedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleMarkChange = (studentUserId: string, mark: string) => {
    const numMark = parseInt(mark) || 0;
    setMarks(prev => ({ ...prev, [studentUserId]: numMark }));
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

    try {
      const resultsToUpload = students
        .filter(student => marks[student.user_id] !== undefined)
        .map(student => ({
          exam_id: selectedExam,
          student_id: student.user_id,
          marks_obtained: marks[student.user_id]
        }));

      if (resultsToUpload.length === 0) {
        toast({
          title: "Warning",
          description: "No marks entered to save",
          variant: "destructive"
        });
        return;
      }

      await uploadResults(resultsToUpload);
      setMarks({}); // Clear marks after successful upload
    } catch (error) {
      console.error('Error saving marks:', error);
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
                          {student.student_profiles?.class_level || selectedClass}
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
