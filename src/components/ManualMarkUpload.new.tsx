import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  max_marks: number;
}

interface Student {
  id: string;
  enrollment_no: string;
  display_name?: string;
}

interface MarkEntry {
  examId: string;
  studentId: string;
  marks: number;
  remarks: string;
  grade: string;
}

interface ManualMarkUploadProps {
  exams: Exam[];
  students: Student[];
  onSuccess: () => void;
}

const ManualMarkUpload: React.FC<ManualMarkUploadProps> = ({ exams, students, onSuccess }) => {  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [markEntry, setMarkEntry] = useState<MarkEntry>({
    examId: '',
    studentId: '',
    marks: 0,
    remarks: '',
    grade: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!markEntry.examId || !markEntry.studentId) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please select both exam and student.',
        });
        return;
      }

      const selectedExam = exams.find(e => e.id === markEntry.examId);
      if (!selectedExam) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Selected exam not found.',
        });
        return;
      }

      // Validate marks
      if (markEntry.marks < 0 || markEntry.marks > selectedExam.max_marks) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: `Marks must be between 0 and ${selectedExam.max_marks}.`,
        });
        return;
      }

      // Check if entry already exists
      const { data: existingResult } = await supabase
        .from('exam_results')
        .select('*')
        .eq('exam_id', markEntry.examId)
        .eq('student_id', markEntry.studentId)
        .single();      let operation;
      if (existingResult) {
        // Update existing result
        const { data: currentUser } = await supabase.auth.getUser();
        
        operation = supabase
          .from('exam_results')
          .update({
            marks_obtained: markEntry.marks,
            remarks: markEntry.remarks || null,
            grade: markEntry.grade || null,
            status: 'updated',
            examiner_id: currentUser.user?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingResult.id);
      } else {
        // Insert new result
        const { data: currentUser } = await supabase.auth.getUser();
        
        operation = supabase
          .from('exam_results')
          .insert({
            exam_id: markEntry.examId,
            student_id: markEntry.studentId,
            marks_obtained: markEntry.marks,
            remarks: markEntry.remarks || null,
            grade: markEntry.grade || null,
            status: 'pending',
            examiner_id: currentUser.user?.id,
            submitted_at: new Date().toISOString()
          });
      }

      const { error } = await operation;

      if (error) {
        console.error('Error saving marks:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save marks. Please try again.',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Marks saved successfully!',
      });

      // Reset form
      setMarkEntry({
        examId: markEntry.examId, // Keep the same exam selected
        studentId: '',
        marks: 0,
        remarks: '',
        grade: '',
      });

      // Notify parent component
      onSuccess();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate grade based on percentage
  const calculateGrade = (marks: number, maxMarks: number) => {
    const percentage = (marks / maxMarks) * 100;
    
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  const handleMarksChange = (marks: number) => {
    const selectedExam = exams.find(e => e.id === markEntry.examId);
    if (!selectedExam) return;
    
    const grade = calculateGrade(marks, selectedExam.max_marks);
    setMarkEntry(prev => ({ ...prev, marks, grade }));
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-xl font-bold mb-4">Manual Mark Entry</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="exam">Select Exam</Label>
              <Select
                value={markEntry.examId}
                onValueChange={(value) => setMarkEntry({ ...markEntry, examId: value })}
              >
                <SelectTrigger id="exam" className="mt-1">
                  <SelectValue placeholder="Select exam" />
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
            
            <div>              <Label htmlFor="student">Select Student</Label>
              <Select
                value={markEntry.studentId}
                onValueChange={(value) => setMarkEntry({ ...markEntry, studentId: value })}
              >
                <SelectTrigger id="student" className="mt-1">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.display_name || 'Student'} - {student.enrollment_no}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="marks">Marks Obtained</Label>
              <Input
                id="marks"
                type="number"
                value={markEntry.marks}
                onChange={e => handleMarksChange(parseInt(e.target.value) || 0)}
                className="mt-1"
                min={0}
                max={markEntry.examId ? exams.find(e => e.id === markEntry.examId)?.max_marks || 100 : 100}
              />
              {markEntry.examId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Max marks: {exams.find(e => e.id === markEntry.examId)?.max_marks || 'N/A'}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Input
                id="grade"
                value={markEntry.grade}
                onChange={e => setMarkEntry({ ...markEntry, grade: e.target.value })}
                className="mt-1"
                placeholder="Auto-calculated grade (can override)"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Input
                id="remarks"
                value={markEntry.remarks}
                onChange={e => setMarkEntry({ ...markEntry, remarks: e.target.value })}
                className="mt-1"
                placeholder="Add any remarks about student performance"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Marks'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ManualMarkUpload;
