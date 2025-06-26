import { supabase } from '@/integrations/supabase/client';
export interface PendingUser {
  id: string;
  user_id: string;
  displayName: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  registrationDate: string;
  additionalInfo: any;
}
export interface ApprovalResult {
  success: boolean;
  message: string;
  error?: string;
}
export class ApprovalService {
  /**
   * Get all pending users (students and teachers)
   */
  static async getPendingUsers(): Promise<PendingUser[]> {
    try {      const [studentsResponse, teachersResponse] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('*')
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false }),
        supabase
          .from('teacher_profiles')
          .select('*')
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false })
      ]);
      if (studentsResponse.error) throw studentsResponse.error;
      if (teachersResponse.error) throw teachersResponse.error;
      const pendingUsers: PendingUser[] = [
        ...(studentsResponse.data || []).map(student => ({
          id: student.id,
          user_id: student.user_id,
          displayName: `Student ${student.enrollment_no} (Class ${student.class_level})`,
          email: student.parent_email || 'Email not available',
          role: 'student' as const,
          registrationDate: student.created_at || '',
          additionalInfo: {
            enrollmentNo: student.enrollment_no,
            classLevel: student.class_level,
            parentEmail: student.parent_email,
            parentPhone: student.parent_phone,
            address: student.address
          }
        })),        ...(teachersResponse.data || []).map(teacher => ({
          id: teacher.id,
          user_id: teacher.user_id,
          displayName: `Teacher ${teacher.full_name} (${teacher.subject_expertise})`,
          email: teacher.email,
          role: 'teacher' as const,
          registrationDate: teacher.created_at || '',
          additionalInfo: {
            fullName: teacher.full_name,
            email: teacher.email,
            subjectExpertise: teacher.subject_expertise,
            experienceYears: teacher.experience_years
          }
        }))
      ];
      return pendingUsers;
    } catch (error: any) {
      throw error;
    }
  }
  /**
   * Get pending students for teacher approval
   */
  static async getPendingStudents(): Promise<PendingUser[]> {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(student => ({
        id: student.id,
        user_id: student.user_id,
        displayName: `Student ${student.enrollment_no} (Class ${student.class_level})`,
        email: student.parent_email || 'Email not available',
        role: 'student' as const,
        registrationDate: student.created_at || '',
        additionalInfo: {
          enrollmentNo: student.enrollment_no,
          classLevel: student.class_level,
          parentEmail: student.parent_email,
          parentPhone: student.parent_phone,
          address: student.address
        }
      }));
    } catch (error: any) {
      throw error;
    }
  }
  /**
   * Get pending teachers for admin approval
   */
  static async getPendingTeachers(): Promise<PendingUser[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
      if (error) throw error;      return (data || []).map(teacher => ({
        id: teacher.id,
        user_id: teacher.user_id,
        displayName: `Teacher ${teacher.full_name} (${teacher.subject_expertise})`,
        email: teacher.email,
        role: 'teacher' as const,
        registrationDate: teacher.created_at || '',
        additionalInfo: {
          fullName: teacher.full_name,
          email: teacher.email,
          subjectExpertise: teacher.subject_expertise,
          experienceYears: teacher.experience_years
        }
      }));
    } catch (error: any) {
      throw error;
    }
  }
  /**
   * Approve a student (by teacher)
   */
  static async approveStudent(userId: string, approverId: string): Promise<ApprovalResult> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }      const { error } = await supabase
        .from('student_profiles')
        .update({
          status: 'APPROVED',
          approval_date: new Date().toISOString(),
          approved_by: approverId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      if (error) throw error;
      return {
        success: true,
        message: 'Student approved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to approve student',
        error: error.message
      };
    }
  }
  /**
   * Approve a teacher (by admin)
   */
  static async approveTeacher(userId: string, approverId: string): Promise<ApprovalResult> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }      const { error } = await supabase
        .from('teacher_profiles')
        .update({
          status: 'APPROVED',
          approval_date: new Date().toISOString(),
          approved_by: approverId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      if (error) throw error;
      return {
        success: true,
        message: 'Teacher approved successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to approve teacher',
        error: error.message
      };
    }
  }
  /**
   * Reject a user (update status to rejected instead of deleting)
   */
  static async rejectUser(userId: string, userType: 'student' | 'teacher', reason?: string): Promise<ApprovalResult> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }
      const rejectionData = {
        status: 'REJECTED' as const,
        rejected_at: new Date().toISOString(),
        rejected_by: currentUser.user.id,
        rejection_reason: reason || null,
        updated_at: new Date().toISOString()
      };
      if (userType === 'student') {
        const { error: profileError } = await supabase
          .from('student_profiles')
          .update(rejectionData)
          .eq('user_id', userId);
        if (profileError) throw profileError;
      } else if (userType === 'teacher') {
        const { error: profileError } = await supabase
          .from('teacher_profiles')
          .update(rejectionData)
          .eq('user_id', userId);
        if (profileError) throw profileError;
      }
      return {
        success: true,
        message: `${userType} registration rejected successfully`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to reject ${userType} registration`,
        error: error.message
      };
    }
  }
  /**
   * Bulk approve multiple users
   */
  static async bulkApprove(userIds: string[], userType: 'student' | 'teacher', approverId: string): Promise<ApprovalResult> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }
      const approvalData = {
        status: 'APPROVED' as const,
        approval_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (userType === 'student') {
        const { error } = await supabase
          .from('student_profiles')
          .update({
            ...approvalData,
            approved_by: approverId
          })
          .in('user_id', userIds);
        if (error) throw error;
      } else if (userType === 'teacher') {
        const { error } = await supabase
          .from('teacher_profiles')
          .update({
            ...approvalData,
            approved_by: approverId
          })
          .in('user_id', userIds);
        if (error) throw error;
      }
      return {
        success: true,
        message: `${userIds.length} ${userType}(s) approved successfully`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to bulk approve ${userType}s`,
        error: error.message
      };
    }
  }
  /**
   * Get approval statistics
   */
  static async getApprovalStats() {
    try {
      const [studentsResponse, teachersResponse] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('status', { count: 'exact' }),
        supabase
          .from('teacher_profiles')
          .select('status', { count: 'exact' })
      ]);
      if (studentsResponse.error) throw studentsResponse.error;
      if (teachersResponse.error) throw teachersResponse.error;
      const studentStats = {
        total: studentsResponse.count || 0,
        pending: (studentsResponse.data || []).filter(s => s.status === 'PENDING').length,
        approved: (studentsResponse.data || []).filter(s => s.status === 'APPROVED').length,
        rejected: (studentsResponse.data || []).filter(s => s.status === 'REJECTED').length
      };
      const teacherStats = {
        total: teachersResponse.count || 0,
        pending: (teachersResponse.data || []).filter(t => t.status === 'PENDING').length,
        approved: (teachersResponse.data || []).filter(t => t.status === 'APPROVED').length,
        rejected: (teachersResponse.data || []).filter(t => t.status === 'REJECTED').length
      };
      return {
        students: studentStats,
        teachers: teacherStats,
        overall: {
          totalPending: studentStats.pending + teacherStats.pending,
          totalApproved: studentStats.approved + teacherStats.approved,
          totalRejected: studentStats.rejected + teacherStats.rejected,
          totalUsers: studentStats.total + teacherStats.total
        }
      };
    } catch (error: any) {
      throw error;
    }
  }
  /**
   * Check if user is approved
   */
  static async isUserApproved(userId: string): Promise<boolean> {
    try {
      // Check in student_profiles
      const { data: studentData } = await supabase
        .from('student_profiles')
        .select('status')
        .eq('user_id', userId)
        .single();
      if (studentData && studentData.status === 'APPROVED') {
        return true;
      }
      // Check in teacher_profiles
      const { data: teacherData } = await supabase
        .from('teacher_profiles')
        .select('status')
        .eq('user_id', userId)
        .single();
      if (teacherData && teacherData.status === 'APPROVED') {
        return true;
      }
      // Check in user_profiles (for admins)
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('status')
        .eq('user_id', userId)
        .single();
      if (userData && userData.status === 'APPROVED') {
        return true;
      }
      return false;
    } catch (error: any) {
      return false;
    }
  }
}
