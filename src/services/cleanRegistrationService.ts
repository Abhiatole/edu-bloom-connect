import { supabase } from '@/integrations/supabase/client';

export interface StudentRegistrationData {
  fullName: string;
  email: string;
  password: string;
  classLevel: string;
  guardianName?: string;
  guardianMobile?: string;
  parentMobile?: string;
  batches?: string[];
  subjects?: string[];
}

export interface TeacherRegistrationData {
  fullName: string;
  email: string;
  password: string;
  subjectExpertise: string;
  experienceYears: number;
}

export interface AdminRegistrationData {
  fullName: string;
  email: string;
  password: string;
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  user?: any;
  requiresEmailConfirmation?: boolean;
  enrollmentNumber?: string;
  employeeId?: string;
}

export class CleanRegistrationService {
  
  /**
   * Generate unique enrollment number for students
   */
  private static generateEnrollmentNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = String(Date.now()).slice(-4);
    return `STU${year}${month}${timestamp}`;
  }

  /**
   * Generate unique employee ID for teachers
   */
  private static generateEmployeeId(): string {
    const year = new Date().getFullYear();
    const timestamp = String(Date.now()).slice(-4);
    return `TCH${year}${timestamp}`;
  }

  /**
   * Get confirmation URL for email redirects - using production-safe domain
   */
  private static getConfirmationUrl(): string {
    // Use HTTPS and proper domain for production
    const baseUrl = window.location.protocol === 'https:' 
      ? window.location.origin 
      : 'https://edu-bloom-connect.vercel.app'; // Replace with your actual domain
    return `${baseUrl}/auth/confirm`;
  }

  /**
   * Sanitize metadata to prevent auth issues
   */
  private static sanitizeMetadata(role: 'student' | 'teacher' | 'admin', data: any): Record<string, any> {
    const metadata: Record<string, any> = {
      role: role.toLowerCase()
    };

    if (role === 'student') {
      metadata.full_name = data.fullName || '';
      metadata.class_level = data.classLevel || '11';
      metadata.guardian_name = data.guardianName || '';
      metadata.guardian_mobile = data.guardianMobile || '';
      metadata.parent_mobile = data.parentMobile || '';
      
      // Convert arrays to JSON strings to avoid metadata issues
      if (Array.isArray(data.batches) && data.batches.length > 0) {
        metadata.batches = JSON.stringify(data.batches);
      }
      if (Array.isArray(data.subjects) && data.subjects.length > 0) {
        metadata.subjects = JSON.stringify(data.subjects);
      }
    } else if (role === 'teacher') {
      metadata.full_name = data.fullName || '';
      metadata.subject_expertise = data.subjectExpertise || 'Other';
      metadata.experience_years = data.experienceYears || 0;
    } else if (role === 'admin') {
      metadata.full_name = data.fullName || '';
    }

    return metadata;
  }

  /**
   * Register a new student
   */
  static async registerStudent(data: StudentRegistrationData): Promise<RegistrationResult> {
    try {
      // Validation
      if (!data.fullName || !data.email || !data.password) {
        throw new Error('Full name, email, and password are required');
      }
      
      if (data.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Prepare metadata
      const userMetadata = this.sanitizeMetadata('student', data);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: this.getConfirmationUrl()
        }
      });

      if (authError) {
        throw new Error(`Registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;

      // If no email confirmation required, create profile immediately
      if (!requiresConfirmation) {
        const enrollmentNumber = await this.createStudentProfile(authData.user.id, data);
        
        return {
          success: true,
          message: 'Student registered successfully. Your account is pending approval.',
          user: authData.user,
          requiresEmailConfirmation: false,
          enrollmentNumber
        };
      }

      // Email confirmation required
      return {
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        user: authData.user,
        requiresEmailConfirmation: true
      };

    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Create student profile using the secure bypass function
   */
  private static async createStudentProfile(userId: string, data: StudentRegistrationData): Promise<string> {
    const enrollmentNumber = this.generateEnrollmentNumber();
    
    try {
      // First try the secure RPC function if it exists
      try {
        const { data: result, error } = await (supabase as any).rpc(
          'create_student_profile_secure',
          {
            p_user_id: userId,
            p_enrollment_no: enrollmentNumber,
            p_full_name: data.fullName,
            p_email: data.email,
            p_class_level: parseInt(data.classLevel) || 11,
            p_parent_email: data.email,
            p_parent_phone: data.parentMobile || data.guardianMobile || '',
            p_guardian_name: data.guardianName || '',
            p_guardian_mobile: data.guardianMobile || ''
          }
        );

        if (!error && result && result.success) {
          return result.enrollment_no || enrollmentNumber;
        }
      } catch (rpcError) {
        // RPC function doesn't exist, fall back to direct insert
      }

      // Fallback: Direct insert into student_profiles
      const profileData = {
        user_id: userId,
        enrollment_no: enrollmentNumber,
        class_level: parseInt(data.classLevel) || 11,
        parent_email: data.email,
        parent_phone: data.parentMobile || data.guardianMobile || '',
        status: 'PENDING' as const
      };

      const { data: profileResult, error: profileError } = await supabase
        .from('student_profiles')
        .insert(profileData)
        .select('enrollment_no')
        .single();

      if (profileError) {
        throw profileError;
      }

      return profileResult?.enrollment_no || enrollmentNumber;

    } catch (error: any) {
      throw new Error(`Profile creation failed: ${error.message}`);
    }
  }

  /**
   * Register a new teacher
   */
  static async registerTeacher(data: TeacherRegistrationData): Promise<RegistrationResult> {
    try {
      // Validation
      if (!data.fullName || !data.subjectExpertise || typeof data.experienceYears !== 'number') {
        throw new Error('All fields are required and experience years must be a number');
      }

      // Prepare metadata
      const userMetadata = this.sanitizeMetadata('teacher', data);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: this.getConfirmationUrl()
        }
      });

      if (authError) {
        throw new Error(`Registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;
      
      // If no email confirmation required, create profile immediately
      if (!requiresConfirmation) {
        const employeeId = await this.createTeacherProfile(authData.user.id, data);
        
        return {
          success: true,
          message: 'Teacher registration successful! Your account is pending admin approval.',
          user: authData.user,
          requiresEmailConfirmation: false,
          employeeId
        };
      }

      return {
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        user: authData.user,
        requiresEmailConfirmation: true
      };

    } catch (error: any) {
      throw new Error(error.message || 'Teacher registration failed');
    }
  }

  /**
   * Create teacher profile using secure function
   */
  private static async createTeacherProfile(userId: string, data: TeacherRegistrationData): Promise<string> {
    const employeeId = this.generateEmployeeId();
    
    try {
      // First try the secure RPC function if it exists
      try {
        const { data: result, error } = await (supabase as any).rpc(
          'create_teacher_profile_secure',
          {
            p_user_id: userId,
            p_employee_id: employeeId,
            p_full_name: data.fullName,
            p_email: data.email,
            p_subject_expertise: data.subjectExpertise,
            p_experience_years: data.experienceYears
          }
        );

        if (!error && result && result.success) {
          return result.employee_id || employeeId;
        }
      } catch (rpcError) {
        // RPC function doesn't exist, fall back to direct insert
      }

      // Fallback: Direct insert into teacher_profiles
      const profileData = {
        user_id: userId,
        full_name: data.fullName,
        email: data.email,
        subject_expertise: data.subjectExpertise as any,
        experience_years: data.experienceYears,
        status: 'PENDING' as const
      };

      const { error: profileError } = await supabase
        .from('teacher_profiles')
        .insert(profileData);

      if (profileError) {
        throw profileError;
      }

      return employeeId;

    } catch (error: any) {
      throw new Error(`Teacher profile creation failed: ${error.message}`);
    }
  }

  /**
   * Register a new admin
   */
  static async registerAdmin(data: AdminRegistrationData): Promise<RegistrationResult> {
    try {
      // Validation
      if (!data.fullName) {
        throw new Error('Full name is required');
      }

      // Prepare metadata
      const userMetadata = this.sanitizeMetadata('admin', data);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: this.getConfirmationUrl()
        }
      });

      if (authError) {
        throw new Error(`Registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;
      
      // If no email confirmation required, create profile immediately
      if (!requiresConfirmation) {
        await this.createAdminProfile(authData.user.id, data);
        
        return {
          success: true,
          message: 'Admin registration successful! You can now login.',
          user: authData.user,
          requiresEmailConfirmation: false
        };
      }

      return {
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        user: authData.user,
        requiresEmailConfirmation: true
      };

    } catch (error: any) {
      throw new Error(error.message || 'Admin registration failed');
    }
  }

  /**
   * Create admin profile
   */
  private static async createAdminProfile(userId: string, data: AdminRegistrationData): Promise<void> {
    try {
      // Insert into user_profiles (admins are auto-approved)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          full_name: data.fullName,
          email: data.email,
          role: 'ADMIN' as const,
          status: 'APPROVED' as const
        });

      if (profileError) {
        throw profileError;
      }

    } catch (error: any) {
      throw new Error(`Admin profile creation failed: ${error.message}`);
    }
  }

  /**
   * Handle email confirmation and create profiles if needed
   */
  static async handleEmailConfirmation(userMetadata: any): Promise<RegistrationResult> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }

      const role = (userMetadata.role || '').toLowerCase();
      const userId = currentUser.user.id;

      if (role === 'student') {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('student_profiles')
          .select('enrollment_no')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          return {
            success: true,
            message: 'Account confirmed successfully!',
            user: currentUser.user,
            enrollmentNumber: existingProfile.enrollment_no
          };
        }

        // Create student profile
        const enrollmentNumber = await this.createStudentProfile(userId, {
          fullName: userMetadata.full_name || 'Student',
          email: currentUser.user.email!,
          password: '', // Not needed
          classLevel: userMetadata.class_level || '11',
          guardianName: userMetadata.guardian_name || '',
          guardianMobile: userMetadata.guardian_mobile || '',
          parentMobile: userMetadata.parent_mobile || '',
          batches: userMetadata.batches ? JSON.parse(userMetadata.batches) : [],
          subjects: userMetadata.subjects ? JSON.parse(userMetadata.subjects) : []
        });

        return {
          success: true,
          message: 'Account confirmed successfully! Your enrollment is pending approval.',
          user: currentUser.user,
          enrollmentNumber
        };

      } else if (role === 'teacher') {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          return {
            success: true,
            message: 'Account confirmed successfully!',
            user: currentUser.user,
            employeeId: 'TCH_' + userId.slice(-8)
          };
        }

        // Create teacher profile
        const employeeId = await this.createTeacherProfile(userId, {
          fullName: userMetadata.full_name || 'Teacher',
          email: currentUser.user.email!,
          password: '', // Not needed
          subjectExpertise: userMetadata.subject_expertise || 'Other',
          experienceYears: userMetadata.experience_years || 0
        });

        return {
          success: true,
          message: 'Account confirmed successfully! Your registration is pending admin approval.',
          user: currentUser.user,
          employeeId
        };

      } else if (role === 'admin') {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          return {
            success: true,
            message: 'Account confirmed successfully!',
            user: currentUser.user
          };
        }

        // Create admin profile
        await this.createAdminProfile(userId, {
          fullName: userMetadata.full_name || 'Admin',
          email: currentUser.user.email!,
          password: '' // Not needed
        });

        return {
          success: true,
          message: 'Account confirmed successfully! You can now access the admin dashboard.',
          user: currentUser.user
        };
      }

      throw new Error(`Unknown role: ${role}`);

    } catch (error: any) {
      throw new Error(error.message || 'Email confirmation failed');
    }
  }
}
