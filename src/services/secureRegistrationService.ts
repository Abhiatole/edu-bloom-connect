import { supabase } from '@/integrations/supabase/client';
export interface TeacherRegistrationData {
  fullName: string;
  email: string;
  password: string;
  subjectExpertise: string;
  experienceYears: number;
}
export class SecureRegistrationService {
  /**
   * Register a new teacher using secure database function
   * This bypasses RLS policy conflicts
   */
  static async registerTeacher(data: TeacherRegistrationData) {
    try {
      // Call the secure registration function via SQL query
      const { data: result, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .limit(0); // This won't work, let's use direct approach
      // Alternative: Direct call with any typing
      const { data: rpcResult, error: rpcError } = await (supabase as any).rpc('register_teacher', {
        p_email: data.email,
        p_password: data.password,
        p_full_name: data.fullName,
        p_subject_expertise: data.subjectExpertise,
        p_experience_years: data.experienceYears
      });
      if (rpcError) {
        throw rpcError;
      }
      if (!rpcResult || !rpcResult.success) {
        throw new Error(rpcResult?.error || 'Registration failed');
      }
      return {
        success: true,
        userId: rpcResult.user_id,
        message: rpcResult.message,
        requiresEmailConfirmation: rpcResult.requires_confirmation || false
      };
    } catch (error: any) {
      throw error;
    }
  }
  /**
   * Fallback: Use standard Supabase auth with improved error handling
   */
  static async registerTeacherFallback(data: TeacherRegistrationData) {
    try {
      // Create auth user first
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
      if (authError) {
        throw authError;
      }
      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }
      // If user is confirmed, create profile immediately
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
          
          // Clean up auth user if profile creation fails
          try {
            await supabase.auth.admin.deleteUser(authData.user.id);
          } catch (cleanupError) {
          }
          
          throw new Error(`Profile creation failed: ${profileError.message}`);
        }
      }
      return {
        success: true,
        user: authData.user,
        requiresEmailConfirmation: !authData.session && !authData.user.email_confirmed_at
      };
    } catch (error: any) {
      throw error;
    }
  }
  /**
   * Main registration method with automatic fallback
   */
  static async registerTeacherWithFallback(data: TeacherRegistrationData) {
    try {
      // Try secure function first
      return await this.registerTeacher(data);
    } catch (error: any) {
      
      // If secure function fails, use fallback method
      return await this.registerTeacherFallback(data);
    }
  }
}
