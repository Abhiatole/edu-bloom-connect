import { supabase } from '@/integrations/supabase/client';

export interface StudentApprovalData {
  id: string;
  full_name: string;
  email: string;
  class_level: string;
  selected_subjects: string[];
  selected_batches: string[];
  guardian_name: string;
  guardian_mobile: string;
  student_mobile?: string;
  status: string;
  is_approved: boolean;
  created_at: string;
  enrollment_no?: string;
}

export interface ApprovalAction {
  action: 'approve' | 'reject';
  reason?: string;
}

export interface ApprovalResult {
  success: boolean;
  message: string;
  student?: StudentApprovalData;
}

export class StudentApprovalService {
  /**
   * Get pending students for admin dashboard (all pending students)
   */
  static async getPendingStudentsForAdmin(): Promise<StudentApprovalData[]> {
    try {
      console.log('🔍 Fetching pending students for admin dashboard...');
      
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          id,
          full_name,
          email,
          class_level,
          selected_subjects,
          selected_batches,
          guardian_name,
          guardian_mobile,
          student_mobile,
          status,
          is_approved,
          created_at,
          enrollment_no
        `)
        .or('is_approved.eq.false,status.eq.PENDING')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching pending students for admin:', error);
        throw error;
      }

      console.log(`✅ Found ${data.length} pending students for admin`);
      return data || [];
    } catch (error: any) {
      console.error('💥 Failed to fetch pending students for admin:', error);
      throw new Error(`Failed to fetch pending students: ${error.message}`);
    }
  }

  /**
   * Get pending students for teacher dashboard (only students with teacher's subjects)
   */
  static async getPendingStudentsForTeacher(teacherUserId: string): Promise<StudentApprovalData[]> {
    try {
      console.log('🔍 Fetching pending students for teacher dashboard...');
      
      // First get the teacher's subject specializations
      const { data: teacherData, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('subject_specialization')
        .eq('user_id', teacherUserId)
        .single();

      if (teacherError) {
        console.error('❌ Error fetching teacher profile:', teacherError);
        throw teacherError;
      }

      if (!teacherData?.subject_specialization || teacherData.subject_specialization.length === 0) {
        console.log('⚠️ Teacher has no subject specializations');
        return [];
      }

      console.log('👨‍🏫 Teacher specializations:', teacherData.subject_specialization);

      // Get pending students who selected any of the teacher's subjects
      const { data, error } = await supabase
        .from('student_profiles')
        .select(`
          id,
          full_name,
          email,
          class_level,
          selected_subjects,
          selected_batches,
          guardian_name,
          guardian_mobile,
          student_mobile,
          status,
          is_approved,
          created_at,
          enrollment_no
        `)
        .or('is_approved.eq.false,status.eq.PENDING')
        .overlaps('selected_subjects', teacherData.subject_specialization)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching pending students for teacher:', error);
        throw error;
      }

      console.log(`✅ Found ${data.length} pending students for teacher`);
      return data || [];
    } catch (error: any) {
      console.error('💥 Failed to fetch pending students for teacher:', error);
      throw new Error(`Failed to fetch pending students: ${error.message}`);
    }
  }

  /**
   * Approve a student (admin or teacher action)
   */
  static async approveStudent(
    studentId: string, 
    approverUserId: string, 
    approverType: 'admin' | 'teacher'
  ): Promise<ApprovalResult> {
    try {
      console.log('✅ Approving student...', { studentId, approverUserId, approverType });

      // Use the database function for approval
      const { data, error } = await supabase.rpc('approve_student', {
        p_student_id: studentId,
        p_approver_id: approverUserId,
        p_approver_type: approverType
      });

      if (error) {
        console.error('❌ Error approving student:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Approval failed - no response from database');
      }

      // Get the updated student data
      const { data: studentData, error: fetchError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (fetchError) {
        console.error('⚠️ Student approved but failed to fetch updated data:', fetchError);
      }

      console.log('🎉 Student approved successfully');
      
      return {
        success: true,
        message: 'Student approved successfully',
        student: studentData
      };
    } catch (error: any) {
      console.error('💥 Failed to approve student:', error);
      return {
        success: false,
        message: `Failed to approve student: ${error.message}`
      };
    }
  }

  /**
   * Reject a student (admin or teacher action)
   */
  static async rejectStudent(
    studentId: string, 
    approverUserId: string, 
    approverType: 'admin' | 'teacher',
    reason?: string
  ): Promise<ApprovalResult> {
    try {
      console.log('❌ Rejecting student...', { studentId, approverUserId, approverType, reason });

      // Use the database function for rejection
      const { data, error } = await supabase.rpc('reject_student', {
        p_student_id: studentId,
        p_approver_id: approverUserId,
        p_approver_type: approverType,
        p_reason: reason
      });

      if (error) {
        console.error('❌ Error rejecting student:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Rejection failed - no response from database');
      }

      // Get the updated student data
      const { data: studentData, error: fetchError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('id', studentId)
        .single();

      if (fetchError) {
        console.error('⚠️ Student rejected but failed to fetch updated data:', fetchError);
      }

      console.log('🚫 Student rejected successfully');
      
      return {
        success: true,
        message: 'Student rejected successfully',
        student: studentData
      };
    } catch (error: any) {
      console.error('💥 Failed to reject student:', error);
      return {
        success: false,
        message: `Failed to reject student: ${error.message}`
      };
    }
  }

  /**
   * Get approval history for a student
   */
  static async getApprovalHistory(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('approval_actions')
        .select(`
          *,
          approver:approver_id (
            email,
            raw_user_meta_data
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching approval history:', error);
        throw error;
      }

      return data || [];
    } catch (error: any) {
      console.error('💥 Failed to fetch approval history:', error);
      throw new Error(`Failed to fetch approval history: ${error.message}`);
    }
  }

  /**
   * Send approval confirmation email to student
   */
  static async sendApprovalEmail(studentData: StudentApprovalData): Promise<boolean> {
    try {
      console.log('📧 Sending approval email to student...', studentData.email);

      // Create email content
      const emailContent = {
        to: studentData.email,
        subject: 'Your Student Registration Has Been Approved! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Congratulations! Your Registration is Approved</h2>
            
            <p>Dear ${studentData.full_name},</p>
            
            <p>We're excited to inform you that your student registration has been approved!</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e40af;">Your Registration Details:</h3>
              <p><strong>Enrollment Number:</strong> ${studentData.enrollment_no || 'Will be assigned soon'}</p>
              <p><strong>Class:</strong> ${studentData.class_level}</p>
              <p><strong>Selected Subjects:</strong> ${studentData.selected_subjects?.join(', ') || 'Not specified'}</p>
              <p><strong>Selected Batches:</strong> ${studentData.selected_batches?.join(', ') || 'Not specified'}</p>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>You can now log in to your student dashboard</li>
              <li>Access your course materials and assignments</li>
              <li>View your class schedule and exam dates</li>
              <li>Connect with your teachers and classmates</li>
            </ul>
            
            <p style="margin-top: 30px;">
              <a href="${window.location.origin}/login" 
                 style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Login to Your Dashboard
              </a>
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        `
      };

      // Here you would integrate with your email service (e.g., Supabase Edge Functions, SendGrid, etc.)
      // For now, we'll just log the email content
      console.log('📧 Email content prepared:', emailContent);
      
      // TODO: Implement actual email sending
      // await sendEmail(emailContent);
      
      return true;
    } catch (error: any) {
      console.error('💥 Failed to send approval email:', error);
      return false;
    }
  }
}
