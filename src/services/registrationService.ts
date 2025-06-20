import { supabase } from '@/integrations/supabase/client';

export interface RegistrationData {
  fullName: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  additionalData?: any;
}

export interface StudentRegistrationData extends RegistrationData {
  classLevel: number;
  guardianName: string;
  guardianMobile: string;
}

export interface TeacherRegistrationData extends RegistrationData {
  subjectExpertise: string;
  experienceYears: number;
}

export interface AdminRegistrationData extends RegistrationData {
  department?: string;
}

export class RegistrationService {
  /**
   * Register a new student
   */
  static async registerStudent(data: StudentRegistrationData) {
    try {
      const currentDomain = window.location.origin;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'student',
            full_name: data.fullName,
            class_level: data.classLevel,
            guardian_name: data.guardianName,
            guardian_mobile: data.guardianMobile
          },
          emailRedirectTo: `${currentDomain}/email-confirmed`
        }
      });

      if (authError) throw authError;

      if (authData.user) {        // Create student profile if user is immediately confirmed
        if (authData.session || authData.user.email_confirmed_at) {
          // Generate enrollment number
          const enrollmentNo = `ENR${Date.now()}`;
            const profileData = {
            user_id: authData.user.id,
            enrollment_no: enrollmentNo,
            class_level: data.classLevel,
            parent_email: data.email,
            parent_phone: data.guardianMobile,
            address: `Guardian: ${data.guardianName}`,
            status: 'PENDING' as const
          };

          const { error: profileError } = await supabase
            .from('student_profiles')
            .insert(profileData);

          if (profileError) {
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }
        }

        return {
          success: true,
          user: authData.user,
          requiresEmailConfirmation: !authData.session && !authData.user.email_confirmed_at
        };
      }

      throw new Error('User creation failed - no user data returned');
    } catch (error: any) {
      console.error('Student registration error:', error);
      throw error;
    }
  }

  /**
   * Register a new teacher
   */
  static async registerTeacher(data: TeacherRegistrationData) {
    try {
      const currentDomain = window.location.origin;
      // Validate teacher fields
      if (!data.fullName || !data.subjectExpertise || typeof data.experienceYears !== 'number') {
        throw new Error('All fields are required and experience years must be a number');
      }
      // Only allow valid enum values for subject_expertise
      const validSubjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other'];
      if (!validSubjects.includes(data.subjectExpertise)) {
        throw new Error('Invalid subject expertise');
      }
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'TEACHER',
            full_name: data.fullName,
            subject_expertise: data.subjectExpertise,
            experience_years: data.experienceYears
          },
          emailRedirectTo: `${currentDomain}/email-confirmed`
        }
      });

      if (authError) throw authError;

      if (authData.user) {        // Create teacher profile if user is immediately confirmed
        if (authData.session || authData.user.email_confirmed_at) {
          const profileData = {
            user_id: authData.user.id,
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
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }
        }

        return {
          success: true,
          user: authData.user,
          requiresEmailConfirmation: !authData.session && !authData.user.email_confirmed_at
        };
      }

      throw new Error('User creation failed - no user data returned');
    } catch (error: any) {
      console.error('Teacher registration error:', error);
      throw error;
    }
  }

  /**
   * Register a new admin
   */
  static async registerAdmin(data: AdminRegistrationData) {
    try {
      const currentDomain = window.location.origin;
      if (!data.fullName) {
        throw new Error('Full name is required');
      }
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {          data: {
            role: 'ADMIN',
            full_name: data.fullName
            // Remove department field as it doesn't exist in the schema
          },
          emailRedirectTo: `${currentDomain}/email-confirmed`
        }
      });
      if (authError) throw authError;
      if (authData.user) {
        if (authData.session || authData.user.email_confirmed_at) {          const profileData = {
            user_id: authData.user.id,
            full_name: data.fullName,
            email: data.email,
            role: 'ADMIN' as const,
            status: 'APPROVED' as const  // Auto-approve admins
          };
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert(profileData);
          if (profileError) {
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }
        }
        return {
          success: true,
          user: authData.user,
          requiresEmailConfirmation: !authData.session && !authData.user.email_confirmed_at
        };
      }
      throw new Error('User creation failed - no user data returned');
    } catch (error: any) {
      console.error('Admin registration error:', error);
      throw error;
    }
  }
  /**
   * Handle email confirmation and create profile
   */
  static async handleEmailConfirmation(userMetadata: any) {
    try {
      // Get auth user data
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      // Normalize role to uppercase for consistency
      const role = (userMetadata.role || '').toUpperCase();
      const userId = currentUser.user.id;
      
      if (role === 'STUDENT') {
        // Generate enrollment number
        const enrollmentNo = `ENR${Date.now()}`;
          const profileData = {
          user_id: userId,
          enrollment_no: enrollmentNo,
          class_level: userMetadata.class_level || 1,
          parent_email: currentUser.user.email,
          parent_phone: userMetadata.guardian_mobile || '',
          address: userMetadata.guardian_name ? `Guardian: ${userMetadata.guardian_name}` : '',
          status: 'PENDING' as const
        };

        const { error } = await supabase
          .from('student_profiles')
          .insert(profileData);

        if (error) throw error;
      } else if (role === 'TEACHER') {
        const profileData = {
          user_id: userId,
          full_name: userMetadata.full_name || 'Teacher',
          email: userMetadata.email || currentUser.user.email,
          subject_expertise: userMetadata.subject_expertise || 'Other',
          experience_years: userMetadata.experience_years || 0,
          status: 'PENDING' as const
        };

        const { error } = await supabase
          .from('teacher_profiles')
          .insert(profileData);

        if (error) throw error;      } else if (role === 'ADMIN') {
        const profileData = {
          user_id: userId,
          full_name: userMetadata.full_name || 'Admin',
          email: currentUser.user.email,
          role: 'ADMIN' as const,
          status: 'APPROVED' as const  // Auto-approve admins
        };
        const { error } = await supabase
          .from('user_profiles')
          .insert(profileData);
        if (error) throw error;
      } else {
        throw new Error(`Unknown role: ${role}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Email confirmation handling error:', error);
      throw error;
    }
  }
}
