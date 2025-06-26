import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
export const useDeleteOperations = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const deleteStudents = async (studentIds: string[]) => {
    setLoading(true);
    try {
      // Delete related records first to avoid foreign key constraints
      await supabase.from('exam_results').delete().in('student_id', studentIds);
      await supabase.from('student_insights').delete().in('student_id', studentIds);
      await supabase.from('fee_payments').delete().in('student_id', studentIds);
      await supabase.from('parent_links').delete().in('student_id', studentIds);
      
      // Delete student profiles
      const { error: profileError } = await supabase
        .from('student_profiles')
        .delete()
        .in('user_id', studentIds);
      if (profileError) throw profileError;
      // Delete user profiles
      const { error: userError } = await supabase
        .from('user_profiles')
        .delete()
        .in('user_id', studentIds);
      if (userError) throw userError;
      toast({
        title: "Success",
        description: `${studentIds.length} student${studentIds.length > 1 ? 's' : ''} deleted successfully`
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete students",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  const deleteTeachers = async (teacherIds: string[]) => {
    setLoading(true);
    try {
      // Delete related records first
      await supabase.from('exams').delete().in('created_by_teacher_id', teacherIds);
      await supabase.from('timetables').delete().in('teacher_id', teacherIds);
      
      // Delete teacher profiles
      const { error: profileError } = await supabase
        .from('teacher_profiles')
        .delete()
        .in('user_id', teacherIds);
      if (profileError) throw profileError;
      // Delete user profiles
      const { error: userError } = await supabase
        .from('user_profiles')
        .delete()
        .in('user_id', teacherIds);
      if (userError) throw userError;
      toast({
        title: "Success",
        description: `${teacherIds.length} teacher${teacherIds.length > 1 ? 's' : ''} deleted successfully`
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete teachers",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  const deleteExams = async (examIds: string[]) => {
    setLoading(true);
    try {
      // Delete exam results first
      await supabase.from('exam_results').delete().in('exam_id', examIds);
      
      // Delete exams
      const { error } = await supabase.from('exams').delete().in('id', examIds);
      if (error) throw error;
      toast({
        title: "Success",
        description: `${examIds.length} exam${examIds.length > 1 ? 's' : ''} deleted successfully`
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete exams",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  const deleteExamResults = async (resultIds: string[]) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('exam_results').delete().in('id', resultIds);
      if (error) throw error;
      toast({
        title: "Success",
        description: `${resultIds.length} result${resultIds.length > 1 ? 's' : ''} deleted successfully`
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete exam results",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  const deleteFeePayments = async (paymentIds: string[]) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('fee_payments').delete().in('id', paymentIds);
      if (error) throw error;
      toast({
        title: "Success",
        description: `${paymentIds.length} payment${paymentIds.length > 1 ? 's' : ''} deleted successfully`
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete fee payments",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  const deleteFeeStructures = async (structureIds: string[]) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('fee_structures').delete().in('id', structureIds);
      if (error) throw error;
      toast({
        title: "Success",
        description: `${structureIds.length} fee structure${structureIds.length > 1 ? 's' : ''} deleted successfully`
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete fee structures",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };
  return {
    loading,
    deleteStudents,
    deleteTeachers,
    deleteExams,
    deleteExamResults,
    deleteFeePayments,
    deleteFeeStructures
  };
};
