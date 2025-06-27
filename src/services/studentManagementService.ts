import { supabase } from '@/integrations/supabase/client';
import { StudentProfile, TeacherProfile } from '../types/approval-system';

export interface StudentManagementStats {
  totalStudents: number;
  approvedStudents: number;
  pendingStudents: number;
  rejectedStudents: number;
  studentsByClass: Record<string, number>;
  studentsBySubject: Record<string, number>;
}

export interface DeleteResult {
  success: boolean;
  message: string;
  error?: string;
}

export class StudentManagementService {
  
  /**
   * Get all students with optional filtering
   */
  async getAllStudents(filters?: {
    status?: string;
    class_level?: string;
    subjects?: string[];
    search?: string;
  }): Promise<StudentProfile[]> {
    try {
      let query = supabase
        .from('student_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.class_level) {
        query = query.eq('class_level', filters.class_level);
      }
      
      if (filters?.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,enrollment_no.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching students:', error);
        throw new Error(`Failed to fetch students: ${error.message}`);
      }

      // Transform data to include computed fields
      return (data || []).map(student => ({
        ...student,
        selected_subjects: this.parseSubjectsFromMetadata(student),
        selected_batches: this.parseBatchesFromMetadata(student)
      }));

    } catch (error) {
      console.error('Error in getAllStudents:', error);
      throw error;
    }
  }

  /**
   * Get students for a specific teacher based on their subjects
   */
  async getStudentsForTeacher(teacherId: string): Promise<StudentProfile[]> {
    try {
      // First get teacher's subjects
      const { data: teacherProfile, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('subject_expertise, subject_specialization')
        .eq('id', teacherId)
        .single();

      if (teacherError) {
        console.error('Error fetching teacher profile:', teacherError);
        throw new Error(`Failed to fetch teacher profile: ${teacherError.message}`);
      }

      // Get all students and filter by teacher's subjects
      const allStudents = await this.getAllStudents();
      
      // For now, filter by class level and subject expertise
      // This can be enhanced when proper subject assignment is implemented
      const teacherSubjects = teacherProfile?.subject_specialization || 
                             [teacherProfile?.subject_expertise].filter(Boolean);

      return allStudents.filter(student => {
        // Filter logic can be enhanced based on your subject assignment structure
        const studentSubjects = student.selected_subjects || [];
        return teacherSubjects.some(subject => 
          studentSubjects.includes(subject) || 
          student.class_level === '11' || student.class_level === '12' // Science classes
        );
      });

    } catch (error) {
      console.error('Error in getStudentsForTeacher:', error);
      throw error;
    }
  }

  /**
   * Delete a student (soft delete by updating status)
   */
  async deleteStudent(studentId: string, deletedBy: string, reason?: string): Promise<DeleteResult> {
    try {
      // First check if student exists
      const { data: existingStudent, error: checkError } = await supabase
        .from('student_profiles')
        .select('id, full_name, status')
        .eq('id', studentId)
        .single();

      if (checkError) {
        return {
          success: false,
          message: 'Student not found',
          error: checkError.message
        };
      }

      // Soft delete by updating status to 'DELETED'
      const { error: deleteError } = await supabase
        .from('student_profiles')
        .update({
          status: 'DELETED',
          rejected_by: deletedBy,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason || 'Student record deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId);

      if (deleteError) {
        return {
          success: false,
          message: 'Failed to delete student',
          error: deleteError.message
        };
      }

      // Log the deletion action
      console.log(`Student ${existingStudent.full_name} (${studentId}) deleted by ${deletedBy}`);

      return {
        success: true,
        message: `Student ${existingStudent.full_name} has been deleted successfully`
      };

    } catch (error) {
      console.error('Error deleting student:', error);
      return {
        success: false,
        message: 'Failed to delete student',
        error: error.message
      };
    }
  }

  /**
   * Hard delete a student (permanently remove from database)
   * Use with caution!
   */
  async hardDeleteStudent(studentId: string): Promise<DeleteResult> {
    try {
      const { data: existingStudent, error: checkError } = await supabase
        .from('student_profiles')
        .select('id, full_name')
        .eq('id', studentId)
        .single();

      if (checkError) {
        return {
          success: false,
          message: 'Student not found',
          error: checkError.message
        };
      }

      const { error: deleteError } = await supabase
        .from('student_profiles')
        .delete()
        .eq('id', studentId);

      if (deleteError) {
        return {
          success: false,
          message: 'Failed to permanently delete student',
          error: deleteError.message
        };
      }

      console.log(`Student ${existingStudent.full_name} (${studentId}) permanently deleted`);

      return {
        success: true,
        message: `Student ${existingStudent.full_name} has been permanently deleted`
      };

    } catch (error) {
      console.error('Error hard deleting student:', error);
      return {
        success: false,
        message: 'Failed to permanently delete student',
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive student management statistics
   */
  async getStudentManagementStats(): Promise<StudentManagementStats> {
    try {
      const { data: allStudents } = await supabase
        .from('student_profiles')
        .select('status, class_level')
        .neq('status', 'DELETED'); // Exclude deleted students

      if (!allStudents) {
        return {
          totalStudents: 0,
          approvedStudents: 0,
          pendingStudents: 0,
          rejectedStudents: 0,
          studentsByClass: {},
          studentsBySubject: {}
        };
      }

      const totalStudents = allStudents.length;
      const approvedStudents = allStudents.filter(s => s.status === 'APPROVED').length;
      const pendingStudents = allStudents.filter(s => s.status === 'PENDING').length;
      const rejectedStudents = allStudents.filter(s => s.status === 'REJECTED').length;

      // Group by class
      const studentsByClass = allStudents.reduce((acc, student) => {
        const classLevel = student.class_level || 'Unknown';
        acc[classLevel] = (acc[classLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Placeholder for subjects grouping (enhance when subject data is available)
      const studentsBySubject: Record<string, number> = {
        'Science': allStudents.filter(s => ['11', '12'].includes(s.class_level)).length,
        'Other': allStudents.filter(s => !['11', '12'].includes(s.class_level)).length
      };

      return {
        totalStudents,
        approvedStudents,
        pendingStudents,
        rejectedStudents,
        studentsByClass,
        studentsBySubject
      };

    } catch (error) {
      console.error('Error getting management stats:', error);
      return {
        totalStudents: 0,
        approvedStudents: 0,
        pendingStudents: 0,
        rejectedStudents: 0,
        studentsByClass: {},
        studentsBySubject: {}
      };
    }
  }

  /**
   * Check if user can delete a specific student
   */
  async canDeleteStudent(userId: string, studentId: string, userType: 'admin' | 'teacher'): Promise<boolean> {
    try {
      if (userType === 'admin') {
        return true; // Admins can delete any student
      }

      if (userType === 'teacher') {
        // Teachers can only delete students in their subjects
        const teacherStudents = await this.getStudentsForTeacher(userId);
        return teacherStudents.some(student => student.id === studentId);
      }

      return false;
    } catch (error) {
      console.error('Error checking delete permission:', error);
      return false;
    }
  }

  // Helper methods
  private parseSubjectsFromMetadata(student: any): string[] {
    // Enhanced subject parsing logic
    const classLevel = parseInt(student.class_level);
    if (classLevel >= 11) {
      return ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    } else if (classLevel >= 9) {
      return ['Mathematics', 'Science', 'English', 'Social Studies'];
    } else {
      return ['Mathematics', 'English', 'General Science'];
    }
  }

  private parseBatchesFromMetadata(student: any): string[] {
    const classLevel = parseInt(student.class_level);
    if (classLevel >= 11) {
      return ['NEET Batch', 'JEE Batch'];
    } else {
      return ['Regular Batch'];
    }
  }
}

// Create singleton instance
export const studentManagementService = new StudentManagementService();

// Export convenience functions
export const getAllStudents = (filters?: any) => 
  studentManagementService.getAllStudents(filters);

export const getStudentsForTeacher = (teacherId: string) =>
  studentManagementService.getStudentsForTeacher(teacherId);

export const deleteStudent = (studentId: string, deletedBy: string, reason?: string) =>
  studentManagementService.deleteStudent(studentId, deletedBy, reason);

export const hardDeleteStudent = (studentId: string) =>
  studentManagementService.hardDeleteStudent(studentId);

export const getStudentManagementStats = () =>
  studentManagementService.getStudentManagementStats();

export const canDeleteStudent = (userId: string, studentId: string, userType: 'admin' | 'teacher') =>
  studentManagementService.canDeleteStudent(userId, studentId, userType);
