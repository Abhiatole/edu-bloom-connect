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
      console.log('🚀 Starting student registration with bypass...');
      
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

      console.log('📋 Creating auth user with metadata:', userMetadata);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      console.log('✅ Auth user created successfully:', authData.user.id);
      console.log('📧 Email confirmed:', !!authData.user.email_confirmed_at);

      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;

      // Step 2: Create profile using bypass function
      if (!requiresConfirmation) {
        console.log('🔄 Creating profile using bypass function...');
        
        try {
          // Use the bypass function to create profile
          const { data: profileResult, error: profileError } = await supabase.rpc(
            'register_student_bypass' as any,
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
            console.error('❌ Bypass function error:', profileError);
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }

          if (!profileResult || !profileResult.success) {
            console.error('❌ Bypass function returned error:', profileResult);
            throw new Error(`Profile creation failed: ${profileResult?.error || 'Unknown error'}`);
          }

          console.log('✅ Profile created successfully with bypass:', profileResult);

          return {
            success: true,
            message: 'Student registered successfully. Your account is pending approval.',
            user: authData.user,
            enrollmentNumber: profileResult?.enrollment_no,
            requiresEmailConfirmation: false
          };

        } catch (bypassError) {
          console.error('❌ Bypass function failed, trying direct insert...', bypassError);
          
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

          console.log('📋 Attempting direct insert with data:', profileData);

          const { data: directResult, error: directError } = await supabase
            .from('student_profiles')
            .insert(profileData)
            .select()
            .single();

          if (directError) {
            console.error('❌ Direct insert also failed:', directError);
            throw new Error(`Database error: ${directError.message}`);
          }

          console.log('✅ Direct insert succeeded:', directResult);

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

      console.log('🔄 Handling email confirmation for user:', session.user.id);

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (existingProfile) {
        console.log('✅ Profile already exists');
        return {
          success: true,
          message: 'Account confirmed successfully!',
          user: session.user
        };
      }

      // Create profile using bypass function
      const { data: profileResult, error: profileError } = await supabase.rpc(
        'register_student_bypass' as any,
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

      console.log('✅ Profile created after email confirmation:', profileResult);

      return {
        success: true,
        message: 'Account confirmed and profile created successfully!',
        user: session.user,
        enrollmentNumber: profileResult?.enrollment_no
      };

    } catch (error: any) {
      console.error('💥 Email confirmation handling failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to complete account setup'
      };
    }
  }
}
