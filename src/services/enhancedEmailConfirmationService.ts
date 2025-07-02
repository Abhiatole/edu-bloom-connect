import { supabase } from '@/integrations/supabase/client';
import { FinalRegistrationService } from './finalRegistrationService';

export interface EmailConfirmationResult {
  success: boolean;
  message: string;
  user?: any;
  redirectPath?: string;
}

export class EnhancedEmailConfirmationService {
  /**
   * Get the confirmation URL for email redirects
   */
  static getConfirmationUrl(): string {
    return `${window.location.origin}/auth/confirm`;
  }

  /**
   * Handle email confirmation from URL parameters
   */
  static async handleConfirmation(): Promise<EmailConfirmationResult> {
    try {
      console.log('🔄 Processing email confirmation...');
      
      // Get URL parameters
      const url = new URL(window.location.href);
      const hashParams = url.hash.substring(1).split('&');
      
      // Check for error
      const errorParam = hashParams.find(param => param.startsWith('error='));
      if (errorParam) {
        const errorMessage = decodeURIComponent(errorParam.split('=')[1]);
        return {
          success: false,
          message: `Email confirmation failed: ${errorMessage}`
        };
      }
      
      // Extract tokens
      const accessTokenParam = hashParams.find(param => param.startsWith('access_token='));
      const refreshTokenParam = hashParams.find(param => param.startsWith('refresh_token='));
      
      if (!accessTokenParam || !refreshTokenParam) {
        return {
          success: false,
          message: 'Invalid confirmation link. Please request a new confirmation email.'
        };
      }
      
      const accessToken = accessTokenParam.split('=')[1];
      const refreshToken = refreshTokenParam.split('=')[1];
      
      // Set session
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      // Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error(`User verification failed: ${userError?.message || 'User not found'}`);
      }
      
      if (!user.email_confirmed_at) {
        throw new Error('Email verification incomplete');
      }
      
      console.log('✅ Email confirmed for user:', user.id);
      
      // Create profile if needed using unified service
      try {
        const profileResult = await FinalRegistrationService.handleEmailConfirmation(null, user.user_metadata);
        
        // Determine redirect path
        const userRole = user.user_metadata?.role?.toLowerCase();
        let redirectPath = '/dashboard';
        
        if (userRole === 'student') {
          redirectPath = '/student/dashboard';
        } else if (userRole === 'teacher') {
          redirectPath = '/teacher/dashboard';
        } else if (userRole === 'admin') {
          redirectPath = '/admin/dashboard';
        }
        
        return {
          success: true,
          message: profileResult.message || 'Email confirmed and profile created successfully!',
          user,
          redirectPath
        };
        
      } catch (profileError: any) {
        console.warn('⚠️ Profile creation failed but email is confirmed:', profileError);
        
        return {
          success: true,
          message: 'Email confirmed! Please complete your registration or contact support.',
          user,
          redirectPath: '/login'
        };
      }
      
    } catch (error: any) {
      console.error('💥 Email confirmation failed:', error);
      
      return {
        success: false,
        message: error.message || 'Email confirmation failed. Please try again or contact support.'
      };
    }
  }

  /**
   * Resend confirmation email
   */
  static async resendConfirmation(email: string): Promise<EmailConfirmationResult> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: this.getConfirmationUrl()
        }
      });
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        message: 'Confirmation email sent! Please check your inbox.'
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to resend confirmation email'
      };
    }
  }

  /**
   * Check if user needs email confirmation
   */
  static async checkConfirmationStatus(): Promise<{
    needsConfirmation: boolean;
    user?: any;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { needsConfirmation: false };
      }
      
      const needsConfirmation = !user.email_confirmed_at;
      
      return {
        needsConfirmation,
        user
      };
      
    } catch (error) {
      console.error('Error checking confirmation status:', error);
      return { needsConfirmation: false };
    }
  }
}
