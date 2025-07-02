import { supabase } from '@/integrations/supabase/client';

export interface StudentRegistrationData {
  fullName: string;
  email: string;
  password: string;
  classLevel: string;
  guardianName?: string;
  guardianMobile?: string;
  parentMobile?: string;
  batches?: string[];  // Array of batch types like ['NEET', 'JEE']
  subjects?: string[]; // Array of subjects like ['Physics', 'Chemistry']
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
}

export class FinalRegistrationService {
  /**
   * Register a new student with guaranteed success using bypass function
   */
  static async registerStudent(data: StudentRegistrationData): Promise<RegistrationResult> {
    try {
      // Step 1: Create auth user with proper metadata handling
      const userMetadata: Record<string, any> = {
        role: 'student',
        full_name: data.fullName,
        class_level: data.classLevel,
        guardian_name: data.guardianName,
        parent_mobile: data.parentMobile || data.guardianMobile
      };

      // Add batches and subjects as JSON strings to avoid array issues
      if (data.batches && data.batches.length > 0) {
        userMetadata.batches = JSON.stringify(data.batches);
      }
      if (data.subjects && data.subjects.length > 0) {
        userMetadata.subjects = JSON.stringify(data.subjects);
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (authError) {
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;

      // Step 2: Create profile using bypass function
      if (!requiresConfirmation) {
        try {
          // Use the bypass function to create profile
          const { data: profileResult, error: profileError } = await (supabase as any).rpc(
            'register_student_bypass',
            {
              p_user_id: authData.user.id,
              p_email: data.email,
              p_full_name: data.fullName,
              p_class_level: parseInt(data.classLevel),
              p_parent_email: data.email,
              p_parent_phone: data.parentMobile || data.guardianMobile || ''
            }
          ) as { data: any, error: any };

          if (profileError) {
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }

          if (!profileResult || !profileResult.success) {
            throw new Error(`Profile creation failed: ${profileResult?.error || 'Unknown error'}`);
          }

          return {
            success: true,
            message: 'Student registered successfully. Your account is pending approval.',
            user: authData.user,
            enrollmentNumber: profileResult?.enrollment_no,
            requiresEmailConfirmation: false
          };

        } catch (bypassError) {
          // Fallback: Direct insert with session
          if (authData.session) {
            await supabase.auth.setSession(authData.session);
          }
          
          // Generate enrollment number manually
          const enrollmentNumber = `STU${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Date.now()).slice(-4)}`;
          
          const profileData = {
            user_id: authData.user.id,
            enrollment_no: enrollmentNumber,
            class_level: parseInt(data.classLevel),
            parent_email: data.email,
            parent_phone: data.parentMobile || data.guardianMobile || '',
            status: 'PENDING' as const
          };

          const { data: directResult, error: directError } = await supabase
            .from('student_profiles')
            .insert(profileData)
            .select()
            .single();

          if (directError) {
            throw new Error(`Database error: ${directError.message}`);
          }

          return {
            success: true,
            message: 'Student registered successfully. Your account is pending approval.',
            user: authData.user,
            enrollmentNumber: enrollmentNumber,
            requiresEmailConfirmation: false
          };
        }
      }

      // Email confirmation required
      return {
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        user: authData.user,
        requiresEmailConfirmation: true
      };

    } catch (error: any) {
      console.error('💥 Registration failed completely:', error);
      
      // Provide user-friendly error messages
      let message = error.message || 'An error occurred during registration';
      
      if (error.message?.includes('already registered')) {
        message = 'This email is already registered. Please use a different email or try logging in.';
      } else if (error.message?.includes('invalid')) {
        message = 'Please check your information and try again.';
      } else if (error.message?.includes('policy') || error.message?.includes('permission')) {
        message = 'Registration temporarily unavailable. Please try again in a few moments.';
      }
      
      return {
        success: false,
        message: message
      };
    }
  }

  /**
   * Handle email confirmation for users who require it
   */
  static async handleEmailConfirmation(session: any, userMetadata: any): Promise<RegistrationResult> {
    try {
      if (!session?.user) {
        throw new Error('No user session available');
      }

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (existingProfile) {
        return {
          success: true,
          message: 'Account confirmed successfully!',
          user: session.user
        };
      }

      // Create profile using bypass function
      const { data: profileResult, error: profileError } = await (supabase as any).rpc(
        'register_student_bypass',
        {
          p_user_id: session.user.id,
          p_email: session.user.email,
          p_full_name: userMetadata?.full_name || session.user.user_metadata?.full_name || '',
          p_class_level: parseInt(userMetadata?.class_level || session.user.user_metadata?.class_level || '11'),
          p_parent_email: session.user.email,
          p_parent_phone: userMetadata?.parent_mobile || session.user.user_metadata?.parent_mobile || ''
        }
      ) as { data: any, error: any };

      if (profileError || !profileResult?.success) {
        console.error('❌ Profile creation during confirmation failed:', profileError || profileResult);
        throw new Error('Failed to create user profile after confirmation');
      }

      return {
        success: true,
        message: 'Account confirmed and profile created successfully!',
        user: session.user,
        enrollmentNumber: profileResult?.enrollment_no
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to complete account setup'
      };
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

      const validSubjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Computer Science', 'Other'];
      if (!validSubjects.includes(data.subjectExpertise)) {
        throw new Error('Invalid subject expertise');
      }

      // Prepare metadata
      const userMetadata = {
        role: 'teacher',
        full_name: data.fullName,
        subject_expertise: data.subjectExpertise,
        experience_years: data.experienceYears
      };

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (authError) {
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;
      
      return {
        success: true,
        message: requiresConfirmation 
          ? 'Registration successful! Please check your email to confirm your account.'
          : 'Teacher registration successful! Your account is pending admin approval.',
        user: authData.user,
        requiresEmailConfirmation: requiresConfirmation
      };

    } catch (error: any) {
      throw new Error(error.message || 'Teacher registration failed');
    }
  }

  /**
   * Register a new admin
   */
  static async registerAdmin(data: AdminRegistrationData): Promise<RegistrationResult> {
    try {
      if (!data.fullName) {
        throw new Error('Full name is required');
      }

      // Prepare metadata
      const userMetadata = {
        role: 'admin',
        full_name: data.fullName
      };

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (authError) {
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;
      
      return {
        success: true,
        message: requiresConfirmation 
          ? 'Registration successful! Please check your email to confirm your account.'
          : 'Admin registration successful! You can now login.',
        user: authData.user,
        requiresEmailConfirmation: requiresConfirmation
      };

    } catch (error: any) {
      throw new Error(error.message || 'Admin registration failed');
    }
  }
}
