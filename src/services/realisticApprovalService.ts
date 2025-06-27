import { supabase } from '@/integrations/supabase/client';
import { 
  PendingStudent, 
  ApprovalSystemStats, 
  UserType,
  ApprovalService 
} from '../types/approval-system';

export class RealisticApprovalService implements ApprovalService {
  
  /**
   * Get pending students based on user type and permissions
   * Works with existing schema columns
   */
  async getPendingStudents(userType: UserType, userId?: string): Promise<PendingStudent[]> {
    try {
      let query = supabase
        .from('student_profiles')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      // For teachers, we'll need to implement subject filtering later
      // For now, return all pending students but we can add filtering logic
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pending students:', error);
        throw new Error(`Failed to fetch pending students: ${error.message}`);
      }

      // Transform data to include computed fields
      return (data || []).map(student => ({
        ...student,
        is_approved: student.status === 'APPROVED',
        subjects_display: this.getSubjectsFromMetadata(student),
        batches_display: this.getBatchesFromMetadata(student),
        selected_subjects: this.parseSubjectsFromMetadata(student),
        selected_batches: this.parseBatchesFromMetadata(student)
      }));

    } catch (error) {
      console.error('Error in getPendingStudents:', error);
      throw error;
    }
  }

  /**
   * Approve a student using existing schema
   */
  async approveStudent(studentId: string, approverId: string, approverType: UserType): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          status: 'APPROVED',
          approved_by: approverId,
          approval_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) {
        throw error;
      }

      // Log the approval action (we can use a simple log or implement a logging table later)
      console.log(`Student ${studentId} approved by ${approverType} ${approverId}`);
      
      return true;

    } catch (error) {
      console.error('Error approving student:', error);
      throw new Error(`Failed to approve student: ${error.message}`);
    }
  }

  /**
   * Reject a student using existing schema
   */
  async rejectStudent(studentId: string, approverId: string, approverType: UserType, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          status: 'REJECTED',
          rejected_by: approverId,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (error) {
        throw error;
      }

      // Log the rejection action
      console.log(`Student ${studentId} rejected by ${approverType} ${approverId}: ${reason}`);
      
      return true;

    } catch (error) {
      console.error('Error rejecting student:', error);
      throw new Error(`Failed to reject student: ${error.message}`);
    }
  }

  /**
   * Get approval system statistics
   */
  async getApprovalStats(userType: UserType, userId?: string): Promise<ApprovalSystemStats> {
    try {
      const { data: allStudents } = await supabase
        .from('student_profiles')
        .select('status');

      if (!allStudents) {
        return {
          totalPending: 0,
          totalApproved: 0,
          totalRejected: 0,
          pendingBySubject: {}
        };
      }

      // Calculate basic stats
      const totalPending = allStudents.filter(s => s.status === 'PENDING').length;
      const totalApproved = allStudents.filter(s => s.status === 'APPROVED').length;
      const totalRejected = allStudents.filter(s => s.status === 'REJECTED').length;

      // For pendingBySubject, we'll implement this when we have subject data
      const pendingBySubject: Record<string, number> = {};

      return {
        totalPending,
        totalApproved,
        totalRejected,
        pendingBySubject
      };

    } catch (error) {
      console.error('Error getting approval stats:', error);
      return {
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        pendingBySubject: {}
      };
    }
  }

  // Helper methods to extract subject/batch info from metadata or other fields
  private getSubjectsFromMetadata(student: any): string {
    // For now, return class level as a placeholder
    // Later we can implement proper subject extraction from metadata
    return student.class_level ? `Class ${student.class_level}` : 'N/A';
  }

  private getBatchesFromMetadata(student: any): string {
    // Placeholder implementation
    return 'Standard Batch';
  }

  private parseSubjectsFromMetadata(student: any): string[] {
    // Placeholder implementation - return subjects based on class level
    const classLevel = parseInt(student.class_level);
    if (classLevel >= 11) {
      return ['Physics', 'Chemistry', 'Mathematics']; // Science stream
    } else if (classLevel >= 9) {
      return ['Mathematics', 'Science', 'English', 'Social Studies'];
    } else {
      return ['Mathematics', 'English', 'Science'];
    }
  }

  private parseBatchesFromMetadata(student: any): string[] {
    return ['Batch A']; // Default batch
  }
}

// Create a singleton instance
export const realisticApprovalService = new RealisticApprovalService();

// Export individual functions for easier use
export const getPendingStudents = (userType: UserType, userId?: string) => 
  realisticApprovalService.getPendingStudents(userType, userId);

export const approveStudent = (studentId: string, approverId: string, approverType: UserType) => 
  realisticApprovalService.approveStudent(studentId, approverId, approverType);

export const rejectStudent = (studentId: string, approverId: string, approverType: UserType, reason: string) => 
  realisticApprovalService.rejectStudent(studentId, approverId, approverType, reason);

export const getApprovalStats = (userType: UserType, userId?: string) => 
  realisticApprovalService.getApprovalStats(userType, userId);
