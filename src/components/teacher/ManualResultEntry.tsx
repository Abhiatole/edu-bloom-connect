import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, UserCheck, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
interface ManualResultEntryProps {
  examId: string;
  students: Array<{
    id: string;
    enrollment_no: string;
    full_name: string;
  }>;
  onResultAdded: () => void;
}
interface ExamDetails {
  id: string;
  title: string;
  subject: string;
  max_marks: number;
}
const ManualResultEntry: React.FC<ManualResultEntryProps> = ({ 
  examId, 
  students, 
  onResultAdded 
}) => {
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [enrollmentSearch, setEnrollmentSearch] = useState<string>('');
  const [marks, setMarks] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const { toast } = useToast();
  useEffect(() => {
    fetchExamDetails();
  }, [examId]);
  useEffect(() => {
    if (enrollmentSearch) {
      handleEnrollmentSearch();
    } else {
      setStudentDetails(null);
      setSelectedStudent('');
    }
  }, [enrollmentSearch]);
  const fetchExamDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('id, title, subject, total_marks')
        .eq('id', examId)
        .single();
      if (error) throw error;
      
      // Map the data to match expected interface
      const mappedData = {
        id: data.id,
        title: data.title,
        subject: data.subject,
        max_marks: data.total_marks || 100
      };
      
      setExamDetails(mappedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch exam details",
        variant: "destructive"
      });
    }
  };
  const handleEnrollmentSearch = () => {
    const student = students.find(s => 
      s.enrollment_no.toLowerCase().includes(enrollmentSearch.toLowerCase())
    );
    
    if (student) {
      setStudentDetails(student);
      setSelectedStudent(student.id);
    } else {
      setStudentDetails(null);
      setSelectedStudent('');
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !marks || !examDetails) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    const marksValue = parseFloat(marks);
    if (isNaN(marksValue) || marksValue < 0 || marksValue > examDetails.max_marks) {
      toast({
        title: "Invalid Marks",
        description: `Marks must be between 0 and ${examDetails.max_marks}`,
        variant: "destructive"
      });
      return;
    }
    setSaving(true);
    try {
      const resultData = {
        exam_id: examId,
        student_id: selectedStudent,
        enrollment_no: studentDetails.enrollment_no,
        student_name: studentDetails.full_name,
        subject: examDetails.subject,
        exam_name: examDetails.title,
        marks_obtained: marksValue,
        max_marks: examDetails.max_marks,
        percentage: Math.round((marksValue / examDetails.max_marks) * 100),
        feedback: feedback.trim() || null,
        created_at: new Date().toISOString()
      };
      const { error } = await supabase
        .from('exam_results')
        .upsert(resultData, {
          onConflict: 'exam_id,student_id'
        });
      if (error) throw error;
      toast({
        title: "Success",
        description: `Result saved for ${studentDetails.full_name}`,
      });
      // Reset form
      setEnrollmentSearch('');
      setMarks('');
      setFeedback('');
      setSelectedStudent('');
      setStudentDetails(null);
      
      onResultAdded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save result",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  if (!examDetails) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p>Loading exam details...</p>
      </div>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Manual Result Entry
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <p><strong>Exam:</strong> {examDetails.title}</p>
          <p><strong>Subject:</strong> {examDetails.subject}</p>
          <p><strong>Maximum Marks:</strong> {examDetails.max_marks}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Search */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="enrollment-search">Student Enrollment Number *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="enrollment-search"
                  value={enrollmentSearch}
                  onChange={(e) => setEnrollmentSearch(e.target.value)}
                  placeholder="Enter enrollment number"
                  className="pl-10"
                />
              </div>
            </div>
            {/* Student Details Display */}
            {studentDetails && (
              <Alert>
                <UserCheck className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Student Found:</div>
                  <div className="mt-1">
                    <p><strong>Name:</strong> {studentDetails.full_name}</p>
                    <p><strong>Enrollment No:</strong> {studentDetails.enrollment_no}</p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {/* No Student Found */}
            {enrollmentSearch && !studentDetails && (
              <Alert variant="destructive">
                <AlertDescription>
                  No student found with enrollment number "{enrollmentSearch}"
                </AlertDescription>
              </Alert>
            )}
          </div>
          {/* Alternative: Select from dropdown */}
          <div>
            <Label htmlFor="student-select">Or Select Student from List</Label>
            <Select 
              value={selectedStudent} 
              onValueChange={(value) => {
                setSelectedStudent(value);
                const student = students.find(s => s.id === value);
                if (student) {
                  setStudentDetails(student);
                  setEnrollmentSearch(student.enrollment_no);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.full_name} ({student.enrollment_no})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Marks Entry */}
          {studentDetails && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="marks">Marks Obtained *</Label>
                <Input
                  id="marks"
                  type="number"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder={`Enter marks (0 - ${examDetails.max_marks})`}
                  min="0"
                  max={examDetails.max_marks}
                  step="0.5"
                />
                {marks && !isNaN(parseFloat(marks)) && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    Percentage: {Math.round((parseFloat(marks) / examDetails.max_marks) * 100)}%
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="feedback">Feedback (Optional)</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter feedback for the student and parents"
                  rows={3}
                />
              </div>
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={saving || !marks || !selectedStudent}
                className="w-full"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Result
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
export default ManualResultEntry;
