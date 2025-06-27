import { supabase } from '@/integrations/supabase/client';

export interface SimpleRegistrationData {
  fullName: string;
  email: string;
  password: string;
  classLevel: string;
}

export interface SimpleRegistrationResult {
  success: boolean;
  message: string;
  requiresEmailConfirmation?: boolean;
}

export class SimpleRegistrationService {
  /**
   * Test basic Supabase auth signup without profile creation
   */
  static async testBasicSignup(data: SimpleRegistrationData): Promise<SimpleRegistrationResult> {
    try {
      console.log('Testing basic signup for:', data.email);
      
      // Try basic auth signup first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'student',
            full_name: data.fullName,
            class_level: parseInt(data.classLevel)
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      console.log('Auth signup successful:', authData.user.email);

      // Check if email confirmation is required
      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;

      return {
        success: true,
        message: requiresConfirmation 
          ? 'Registration successful! Please check your email to confirm your account.'
          : 'Registration successful! You can now log in.',
        requiresEmailConfirmation: requiresConfirmation
      };

    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Test if we can create a student profile
   */
  static async testProfileCreation(userId: string, data: SimpleRegistrationData): Promise<SimpleRegistrationResult> {
    try {
      console.log('Testing profile creation for user:', userId);
      
      // Try to create a minimal student profile
      const profileData = {
        user_id: userId,
        full_name: data.fullName,
        email: data.email,
        class_level: parseInt(data.classLevel),
        status: 'PENDING' as const
      };

      const { data: profileResult, error: profileError } = await supabase
        .from('student_profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log('Profile creation successful:', profileResult);

      return {
        success: true,
        message: 'Profile created successfully!'
      };

    } catch (error: any) {
      console.error('Profile creation error:', error);
      return {
        success: false,
        message: error.message || 'Profile creation failed.'
      };
    }
  }
}
