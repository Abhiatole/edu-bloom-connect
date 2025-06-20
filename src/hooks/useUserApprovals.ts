
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserToApprove {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export const useUserApprovals = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const approveUser = async (userId: string, userType: 'STUDENT' | 'TEACHER') => {
    setLoading(true);
    try {
      console.log(`Approving ${userType} with user_id:`, userId);

      // Update user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          status: 'APPROVED',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error updating user_profiles:', profileError);
        throw profileError;
      }

      // Update specific profile table
      if (userType === 'STUDENT') {
        const { error: studentError } = await supabase
          .from('student_profiles')
          .update({ 
            status: 'APPROVED',
            approval_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (studentError) {
          console.error('Error updating student_profiles:', studentError);
          throw studentError;
        }
      } else if (userType === 'TEACHER') {
        const { error: teacherError } = await supabase
          .from('teacher_profiles')
          .update({ 
            status: 'APPROVED',
            approval_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (teacherError) {
          console.error('Error updating teacher_profiles:', teacherError);
          throw teacherError;
        }
      }

      toast({
        title: "Success",
        description: `${userType.toLowerCase()} approved successfully`,
      });

      return true;
    } catch (error: any) {
      console.error('Approval error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve user",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectUser = async (userId: string, userType: 'STUDENT' | 'TEACHER') => {
    setLoading(true);
    try {
      console.log(`Rejecting ${userType} with user_id:`, userId);

      // Update user_profiles table
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({ 
          status: 'REJECTED',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (profileError) {
        console.error('Error updating user_profiles:', profileError);
        throw profileError;
      }

      // Update specific profile table
      if (userType === 'STUDENT') {
        const { error: studentError } = await supabase
          .from('student_profiles')
          .update({ 
            status: 'REJECTED',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (studentError) {
          console.error('Error updating student_profiles:', studentError);
          throw studentError;
        }
      } else if (userType === 'TEACHER') {
        const { error: teacherError } = await supabase
          .from('teacher_profiles')
          .update({ 
            status: 'REJECTED',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (teacherError) {
          console.error('Error updating teacher_profiles:', teacherError);
          throw teacherError;
        }
      }

      toast({
        title: "Success",
        description: `${userType.toLowerCase()} rejected successfully`,
      });

      return true;
    } catch (error: any) {
      console.error('Rejection error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject user",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    approveUser,
    rejectUser,
    loading
  };
};
