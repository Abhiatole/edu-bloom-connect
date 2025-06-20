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
   * Register a new student using secure database function
   */
  static async registerStudent(data: StudentRegistrationData) {
    try {
      // Create auth user
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
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Use secure database function to create profile
        const { data: profileResult, error: profileError } = await supabase.rpc(
          'register_student_profile',
          {
            p_user_id: authData.user.id,
            p_full_name: data.fullName,
            p_email: data.email,
            p_class_level: data.classLevel,
            p_guardian_name: data.guardianName,
            p_guardian_mobile: data.guardianMobile
          }
        );

        if (profileError) {
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        if (!profileResult.success) {
          throw new Error(`Profile creation failed: ${profileResult.message}`);
        }

        return {
          success: true,
          message: 'Student registered successfully. Please check your email for verification.',
          user: authData.user,
          enrollmentNo: profileResult.enrollment_no
        };
      }

      throw new Error('User creation failed - no user data returned');
    } catch (error: any) {
      console.error('Student registration error:', error);
      throw error;
    }
  }

  /**
   * Register a new teacher using secure database function
   */
  static async registerTeacher(data: TeacherRegistrationData) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'teacher',
            full_name: data.fullName,
            subject_expertise: data.subjectExpertise,
            experience_years: data.experienceYears
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Use secure database function to create profile
        const { data: profileResult, error: profileError } = await supabase.rpc(
          'register_teacher_profile',
          {
            p_user_id: authData.user.id,
            p_full_name: data.fullName,
            p_email: data.email,
            p_subject_expertise: data.subjectExpertise,
            p_experience_years: data.experienceYears
          }
        );

        if (profileError) {
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        if (!profileResult.success) {
          throw new Error(`Profile creation failed: ${profileResult.message}`);
        }

        return {
          success: true,
          message: 'Teacher registered successfully. Please check your email for verification.',
          user: authData.user
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
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'admin',
            full_name: data.fullName,
            department: data.department
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create admin profile directly (admins are auto-approved)
        const profileData = {
          user_id: authData.user.id,
          full_name: data.fullName,
          email: data.email,
          role: 'ADMIN' as const,
          status: 'APPROVED' as const
        };

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert(profileData);

        if (profileError) {
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        return {
          success: true,
          message: 'Admin registered successfully. Please check your email for verification.',
          user: authData.user
        };
      }

      throw new Error('User creation failed - no user data returned');
    } catch (error: any) {
      console.error('Admin registration error:', error);
      throw error;
    }
  }

  /**
   * Handle email confirmation and create profile if needed
   */
  static async handleEmailConfirmation(userMetadata: any) {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const role = userMetadata.role;
      const userId = currentUser.user.id;

      // Check if profile already exists
      if (role === 'student') {
        const { data: existingProfile } = await supabase
          .from('student_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!existingProfile) {
          // Use secure function to create profile
          const { data: profileResult, error: profileError } = await supabase.rpc(
            'register_student_profile',
            {
              p_user_id: userId,
              p_full_name: userMetadata.full_name || 'Student Name',
              p_email: currentUser.user.email || userMetadata.email,
              p_class_level: userMetadata.class_level || 11,
              p_guardian_name: userMetadata.guardian_name,
              p_guardian_mobile: userMetadata.guardian_mobile
            }
          );

          if (profileError || !profileResult.success) {
            throw new Error(`Profile creation failed: ${profileError?.message || profileResult.message}`);
          }
        }
      } else if (role === 'teacher') {
        const { data: existingProfile } = await supabase
          .from('teacher_profiles')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (!existingProfile) {
          // Use secure function to create profile
          const { data: profileResult, error: profileError } = await supabase.rpc(
            'register_teacher_profile',
            {
              p_user_id: userId,
              p_full_name: userMetadata.full_name || 'Teacher Name',
              p_email: currentUser.user.email || userMetadata.email,
              p_subject_expertise: userMetadata.subject_expertise || 'Other',
              p_experience_years: userMetadata.experience_years || 0
            }
          );

          if (profileError || !profileResult.success) {
            throw new Error(`Profile creation failed: ${profileError?.message || profileResult.message}`);
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Email confirmation error:', error);
      throw error;
    }
  }
}
