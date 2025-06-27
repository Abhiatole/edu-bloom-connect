import { supabase } from '@/integrations/supabase/client';

export interface SimpleRegistrationData {
  fullName: string;
  email: string;
  password: string;
  classLevel: string;
  guardianName: string;
  guardianMobile: string;
  parentMobile: string;
  batches?: string[];
  subjects?: string[];
}

export interface SimpleRegistrationResult {
  success: boolean;
  message: string;
  user?: any;
  requiresEmailConfirmation?: boolean;
}

export class SimpleRegistrationService {
  /**
   * Simple student registration without complex enrollment logic
   */
  static async registerStudent(data: SimpleRegistrationData): Promise<SimpleRegistrationResult> {
    console.log('🚀 Starting simple student registration...');
    
    try {
      // Basic validation
      if (!data.email || !data.password || !data.fullName) {
        throw new Error('Email, password, and full name are required');
      }
      
      if (data.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Prepare metadata with subject and batch selections
      const userMetadata = {
        full_name: data.fullName,
        user_type: 'student',
        class_level: data.classLevel || '11',
        guardian_name: data.guardianName || '',
        guardian_mobile: data.guardianMobile || '',
        parent_mobile: data.parentMobile || '',
        // Store subjects and batches for later processing
        selected_subjects: data.subjects || [],
        selected_batches: data.batches || []
      };
      
      console.log('📝 Registering with data:', { ...data, password: '[HIDDEN]' });
      console.log('📋 Using metadata:', userMetadata);
      console.log('🌐 Redirect URL:', `${window.location.origin}/auth/confirm`);
      
      // Try registration with email confirmation first
      console.log('🔐 Attempting signup with email confirmation...');
      let { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });
      
      // If that fails, try without email redirect
      if (authError && authError.message.includes('Database error saving new user')) {
        console.log('⚠️ First attempt failed, trying without email redirect...');
        const result = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: userMetadata
          }
        });
        authData = result.data;
        authError = result.error;
      }
      
      // If still failing, try with minimal metadata
      if (authError && authError.message.includes('Database error saving new user')) {
        console.log('⚠️ Second attempt failed, trying with minimal metadata...');
        const result = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              user_type: 'student'
            }
          }
        });
        authData = result.data;
        authError = result.error;
      }
      
      // If still failing, try with no metadata at all
      if (authError && authError.message.includes('Database error saving new user')) {
        console.log('⚠️ Third attempt failed, trying with no metadata...');
        const result = await supabase.auth.signUp({
          email: data.email,
          password: data.password
        });
        authData = result.data;
        authError = result.error;
      }
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error(`Registration failed: ${authError.message}`);
      }
      
      if (!authData.user) {
        throw new Error('Registration failed: No user data returned');
      }
      
      console.log('✅ Registration successful!');
      console.log('User ID:', authData.user.id);
      console.log('Email confirmed:', !!authData.user.email_confirmed_at);
      
      return {
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        user: authData.user,
        requiresEmailConfirmation: !authData.user.email_confirmed_at
      };
      
    } catch (error: any) {
      console.error('💥 Registration failed:', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  }
}
