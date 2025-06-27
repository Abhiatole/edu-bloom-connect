import { supabase } from '@/integrations/supabase/client';

export interface SimpleRegistrationData {
  fullName: string;
  email: string;
  password: string;
  studentClass: string;
  parentMobile?: string;
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  requiresEmailConfirmation?: boolean;
  enrollmentNumber?: string;
}

export class BypassRegistrationService {
  /**
   * Register student using bypass function to avoid RLS issues
   */
  static async registerStudent(data: SimpleRegistrationData): Promise<RegistrationResult> {
    try {
      console.log('🚀 Starting bypass registration for:', data.email);

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'student',
            full_name: data.fullName,
            student_class: data.studentClass
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error(`Registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      console.log('✅ Auth user created:', authData.user.id);

      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;
      console.log('📧 Email confirmation required:', requiresConfirmation);

      if (!requiresConfirmation && authData.session) {
        // Create profile immediately using bypass function
        const enrollmentNumber = await this.generateEnrollmentNumber();
        
        console.log('📋 Using bypass function to create profile...');
        const { data: profileId, error: profileError } = await supabase.rpc(
          'create_student_profile_bypass',
          {
            p_user_id: authData.user.id,
            p_enrollment_no: enrollmentNumber,
            p_class_level: parseInt(data.studentClass),
            p_parent_email: data.email,
            p_parent_phone: data.parentMobile || ''
          }
        );

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        console.log('✅ Profile created with ID:', profileId);

        return {
          success: true,
          message: 'Registration successful! Your account is pending approval.',
          requiresEmailConfirmation: false,
          enrollmentNumber
        };
      }

      return {
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        requiresEmailConfirmation: true
      };

    } catch (error: any) {
      console.error('💥 Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Generate enrollment number
   */
  static async generateEnrollmentNumber(): Promise<string> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      // Try to get count for sequential numbering
      const { count } = await supabase
        .from('student_profiles')
        .select('*', { count: 'exact', head: true });
      
      const nextNumber = (count || 0) + 1;
      return `STU${year}${month}${String(nextNumber).padStart(4, '0')}`;
      
    } catch (error) {
      // Fallback to timestamp-based number
      const timestamp = Date.now().toString().slice(-4);
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      return `STU${year}${month}${timestamp}`;
    }
  }

  /**
   * Handle email confirmation using bypass function
   */
  static async handleEmailConfirmation(user: any): Promise<RegistrationResult> {
    try {
      if (!user || !user.user_metadata) {
        throw new Error('Invalid user data for confirmation');
      }

      const enrollmentNumber = await this.generateEnrollmentNumber();

      const { data: profileId, error: profileError } = await supabase.rpc(
        'create_student_profile_bypass',
        {
          p_user_id: user.id,
          p_enrollment_no: enrollmentNumber,
          p_class_level: parseInt(user.user_metadata.student_class || '11'),
          p_parent_email: user.email,
          p_parent_phone: user.user_metadata.parent_mobile || ''
        }
      );

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      return {
        success: true,
        message: 'Email confirmed! Your account is pending approval.',
        enrollmentNumber
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to complete registration after email confirmation.'
      };
    }
  }
}

export default BypassRegistrationService;
