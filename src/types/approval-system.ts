// Updated Supabase Types for Student Approval System
// Based on actual database schema discovered on 2025-06-27

// Actual Student Profile Interface (based on existing schema)
export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  class_level: string;
  guardian_name: string;
  guardian_mobile: string;
  status: string;
  approved_by: string | null;
  approval_date: string | null;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  enrollment_no: string;
  parent_email: string;
  student_mobile: string | null;
  
  // Extended fields we'll add via metadata or separate logic
  selected_subjects?: string[];
  selected_batches?: string[];
}

// Actual Teacher Profile Interface (based on existing schema)
export interface TeacherProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  subject_expertise: string;
  experience_years: number | null;
  status: string;
  approved_by: string | null;
  approval_date: string | null;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  
  // Extended fields
  subject_specialization?: string[];
}

// Approval System Types
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserType = 'admin' | 'teacher' | 'student' | 'superadmin';

// Pending Student with computed fields
export interface PendingStudent extends StudentProfile {
  subjects_display?: string;
  batches_display?: string;
  is_approved: boolean; // computed from status
}

// Simple approval action tracking (using existing columns)
export interface ApprovalAction {
  student_id: string;
  approver_id: string;
  approver_type: 'admin' | 'teacher';
  action: 'approve' | 'reject';
  reason?: string;
  timestamp: string;
}

// Component props types
export interface StudentApprovalProps {
  student: PendingStudent;
  onApprove: (studentId: string, reason?: string) => Promise<void>;
  onReject: (studentId: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export interface ApprovalSystemStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  pendingBySubject: Record<string, number>;
}

// Hook types
export interface UseApprovalSystemReturn {
  pendingStudents: PendingStudent[];
  stats: ApprovalSystemStats;
  isLoading: boolean;
  error: string | null;
  approveStudent: (studentId: string, reason?: string) => Promise<boolean>;
  rejectStudent: (studentId: string, reason: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

// Service types
export interface ApprovalService {
  getPendingStudents(userType: UserType, userId?: string): Promise<PendingStudent[]>;
  approveStudent(studentId: string, approverId: string, approverType: UserType): Promise<boolean>;
  rejectStudent(studentId: string, approverId: string, approverType: UserType, reason: string): Promise<boolean>;
  getApprovalStats(userType: UserType, userId?: string): Promise<ApprovalSystemStats>;
}
