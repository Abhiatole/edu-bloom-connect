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
    try {
      const [studentsResponse, teachersResponse] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('*')
          .is('approval_date', null)
          .order('created_at', { ascending: false }),
        supabase
          .from('teacher_profiles')
          .select('*')
          .is('approval_date', null)
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
        })),
        ...(teachersResponse.data || []).map(teacher => ({
          id: teacher.id,
          user_id: teacher.user_id,
          displayName: `Teacher ${teacher.employee_id} (${teacher.department})`,
          email: 'Contact via admin',
          role: 'teacher' as const,
          registrationDate: teacher.created_at || '',
          additionalInfo: {
            employeeId: teacher.employee_id,
            department: teacher.department,
            subjectExpertise: teacher.subject_expertise,
            experienceYears: teacher.experience_years,
            designation: teacher.designation,
            qualification: teacher.qualification
          }
        }))
      ];

      return pendingUsers;
    } catch (error: any) {
      console.error('Error fetching pending users:', error);
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
        .is('approval_date', null)
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
      console.error('Error fetching pending students:', error);
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
        .is('approval_date', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(teacher => ({
        id: teacher.id,
        user_id: teacher.user_id,
        displayName: `Teacher ${teacher.employee_id} (${teacher.department})`,
        email: 'Contact via admin',
        role: 'teacher' as const,
        registrationDate: teacher.created_at || '',
        additionalInfo: {
          employeeId: teacher.employee_id,
          department: teacher.department,
          subjectExpertise: teacher.subject_expertise,
          experienceYears: teacher.experience_years,
          designation: teacher.designation,
          qualification: teacher.qualification
        }
      }));
    } catch (error: any) {
      console.error('Error fetching pending teachers:', error);
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
      }

      const { error } = await supabase
        .from('student_profiles')
        .update({
          approval_date: new Date().toISOString(),
          approved_by_teacher_id: approverId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        message: 'Student approved successfully'
      };
    } catch (error: any) {
      console.error('Error approving student:', error);
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
      }

      const { error } = await supabase
        .from('teacher_profiles')
        .update({
          approval_date: new Date().toISOString(),
          approved_by_admin_id: approverId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        message: 'Teacher approved successfully'
      };
    } catch (error: any) {
      console.error('Error approving teacher:', error);
      return {
        success: false,
        message: 'Failed to approve teacher',
        error: error.message
      };
    }
  }

  /**
   * Reject a user (remove from pending)
   */
  static async rejectUser(userId: string, userType: 'student' | 'teacher', reason?: string): Promise<ApprovalResult> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }

      // For rejection, we could either delete the profile or mark it as rejected
      // For now, let's delete the profile and the auth user
      
      if (userType === 'student') {
        const { error: profileError } = await supabase
          .from('student_profiles')
          .delete()
          .eq('user_id', userId);

        if (profileError) throw profileError;
      } else if (userType === 'teacher') {
        const { error: profileError } = await supabase
          .from('teacher_profiles')
          .delete()
          .eq('user_id', userId);

        if (profileError) throw profileError;
      }

      // Note: In a production system, you might want to:
      // 1. Keep the profile but mark it as rejected
      // 2. Send an email notification about the rejection
      // 3. Log the rejection reason for audit purposes

      return {
        success: true,
        message: `${userType} registration rejected successfully`
      };
    } catch (error: any) {
      console.error(`Error rejecting ${userType}:`, error);
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
        approval_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (userType === 'student') {
        const { error } = await supabase
          .from('student_profiles')
          .update({
            ...approvalData,
            approved_by_teacher_id: approverId
          })
          .in('user_id', userIds);

        if (error) throw error;
      } else if (userType === 'teacher') {
        const { error } = await supabase
          .from('teacher_profiles')
          .update({
            ...approvalData,
            approved_by_admin_id: approverId
          })
          .in('user_id', userIds);

        if (error) throw error;
      }

      return {
        success: true,
        message: `${userIds.length} ${userType}(s) approved successfully`
      };
    } catch (error: any) {
      console.error(`Error bulk approving ${userType}s:`, error);
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
          .select('approval_date', { count: 'exact' }),
        supabase
          .from('teacher_profiles')
          .select('approval_date', { count: 'exact' })
      ]);

      if (studentsResponse.error) throw studentsResponse.error;
      if (teachersResponse.error) throw teachersResponse.error;

      const studentStats = {
        total: studentsResponse.count || 0,
        pending: (studentsResponse.data || []).filter(s => !s.approval_date).length,
        approved: (studentsResponse.data || []).filter(s => s.approval_date).length
      };

      const teacherStats = {
        total: teachersResponse.count || 0,
        pending: (teachersResponse.data || []).filter(t => !t.approval_date).length,
        approved: (teachersResponse.data || []).filter(t => t.approval_date).length
      };

      return {
        students: studentStats,
        teachers: teacherStats,
        overall: {
          totalPending: studentStats.pending + teacherStats.pending,
          totalApproved: studentStats.approved + teacherStats.approved,
          totalUsers: studentStats.total + teacherStats.total
        }
      };
    } catch (error: any) {
      console.error('Error fetching approval stats:', error);
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
        .select('approval_date')
        .eq('user_id', userId)
        .single();

      if (studentData && studentData.approval_date) {
        return true;
      }

      // Check in teacher_profiles
      const { data: teacherData } = await supabase
        .from('teacher_profiles')
        .select('approval_date')
        .eq('user_id', userId)
        .single();

      if (teacherData && teacherData.approval_date) {
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
      console.error('Error checking user approval status:', error);
      return false;
    }
  }
}
