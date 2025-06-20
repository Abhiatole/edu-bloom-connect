
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExamData {
  id?: string;
  title: string;
  subject: string;
  class_level: number;
  exam_type: string;
  total_marks: number;
  duration_minutes?: number;
  exam_date: string;
}

export interface ExamResult {
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  grade?: string;
}

export const useExamManagement = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createExam = async (examData: ExamData) => {
    setLoading(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      console.log('Creating exam:', examData);

      const { data, error } = await supabase
        .from('exams')
        .insert({
          title: examData.title,
          subject: examData.subject as any,
          class_level: examData.class_level,
          exam_type: examData.exam_type as any,
          total_marks: examData.total_marks,
          duration_minutes: examData.duration_minutes || 180,
          exam_date: examData.exam_date,
          created_by_teacher_id: currentUser.user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating exam:', error);
        throw error;
      }

      console.log('Exam created successfully:', data);
      toast({
        title: "Success",
        description: "Exam created successfully"
      });

      return data;
    } catch (error: any) {
      console.error('Create exam error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create exam",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const uploadResults = async (results: ExamResult[]) => {
    setLoading(true);
    try {
      console.log('Uploading results:', results);

      const resultsToInsert = results.map(result => ({
        exam_id: result.exam_id,
        student_id: result.student_id,
        marks_obtained: result.marks_obtained,
        grade: result.grade || calculateGrade(result.marks_obtained, 100) // Assuming 100 total marks
      }));

      const { data, error } = await supabase
        .from('exam_results')
        .upsert(resultsToInsert, { 
          onConflict: 'exam_id,student_id' 
        });

      if (error) {
        console.error('Error uploading results:', error);
        throw error;
      }

      console.log('Results uploaded successfully:', data);
      toast({
        title: "Success",
        description: `${results.length} exam results uploaded successfully`
      });

      return data;
    } catch (error: any) {
      console.error('Upload results error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload results",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exams:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Fetch exams error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch exams",
        variant: "destructive"
      });
      return [];
    }
  };

  const fetchStudents = async (classLevel?: number) => {
    try {
      let query = supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          student_profiles(class_level)
        `)
        .eq('role', 'STUDENT')
        .eq('status', 'APPROVED');

      if (classLevel) {
        // We'll filter by class level client-side since we need to join with student_profiles
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }

      // Filter by class level if specified
      let filteredData = data;
      if (classLevel) {
        filteredData = data?.filter(student => 
          student.student_profiles && 
          (student.student_profiles as any).class_level === classLevel
        ) || [];
      }

      return filteredData;
    } catch (error: any) {
      console.error('Fetch students error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive"
      });
      return [];
    }
  };

  return {
    createExam,
    uploadResults,
    fetchExams,
    fetchStudents,
    loading
  };
};

// Helper function to calculate grade based on marks
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
