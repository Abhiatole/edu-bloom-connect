// Email Confirmation Service
// Handles email confirmation, resending, and user guidance
import { supabase } from '@/integrations/supabase/client';
import { FinalRegistrationService } from './finalRegistrationService';
export interface EmailConfirmationResult {
  success: boolean;
  message: string;
  requiresConfirmation?: boolean;
  user?: any;
}
export class EmailConfirmationService {
  /**
   * Get the current domain for email redirects
   */
  static getCurrentDomain(): string {
    return window.location.origin;
  }
  /**
   * Get the confirmation redirect URL
   */
  static getConfirmationUrl(): string {
    const currentDomain = this.getCurrentDomain();
    // Use a consistent path for all email confirmations
    return `${currentDomain}/email-confirmed`;
  }
  /**
   * Resend confirmation email with proper redirect
   */
  static async resendConfirmationEmail(email: string): Promise<EmailConfirmationResult> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: this.getConfirmationUrl()
        }
      });
      if (error) throw error;
      return {
        success: true,
        message: 'Confirmation email sent successfully!'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send confirmation email'
      };
    }
  }
  /**
   * Verify email confirmation token and create profiles if needed
   */
  static async verifyEmailConfirmation(token: string, type: string): Promise<EmailConfirmationResult> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as 'signup' | 'email'
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Check if user has metadata and create profile if needed
        const userMetadata = data.user.user_metadata || {};
        
        if (userMetadata.role) {
          try {
            const profileResult = await FinalRegistrationService.handleEmailConfirmation(data.session, userMetadata);
            return {
              success: true,
              message: profileResult.message || 'Email confirmed successfully!',
              user: data.user
            };
          } catch (profileError: any) {
            // Profile creation failed, but email is confirmed
            return {
              success: true,
              message: 'Email confirmed successfully! Please contact support if you have trouble accessing your account.',
              user: data.user
            };
          }
        }
      }
      
      return {
        success: true,
        message: 'Email confirmed successfully!',
        user: data.user
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to confirm email'
      };
    }
  }
  /**
   * Check if user needs email confirmation
   */
  static async checkConfirmationStatus(userId: string): Promise<{
    isConfirmed: boolean;
    requiresConfirmation: boolean;
  }> {
    try {
      const { data: user, error } = await supabase.auth.getUser();
      
      if (error || !user.user) {
        return { isConfirmed: false, requiresConfirmation: true };
      }
      const isConfirmed = !!user.user.email_confirmed_at;
      const requiresConfirmation = !isConfirmed;
      return { isConfirmed, requiresConfirmation };
    } catch (error) {
      return { isConfirmed: false, requiresConfirmation: true };
    }
  }
  /**
   * Sign up with proper email confirmation setup
   */
  static async signUpWithEmailConfirmation(
    email: string,
    password: string,
    metadata: Record<string, any>
  ): Promise<EmailConfirmationResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: this.getConfirmationUrl()
        }
      });
      if (error) throw error;
      if (data.user) {
        const requiresConfirmation = !data.session && !data.user.email_confirmed_at;
        
        return {
          success: true,
          message: requiresConfirmation 
            ? 'Registration successful! Please check your email to confirm your account.'
            : 'Registration successful! You can now log in.',
          requiresConfirmation,
          user: data.user
        };
      }
      throw new Error('User creation failed');
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  }
  /**
   * Get email confirmation instructions
   */
  static getConfirmationInstructions(email: string): {
    title: string;
    message: string;
    steps: string[];
  } {
    return {
      title: 'Email Confirmation Required',
      message: `We've sent a confirmation email to ${email}`,
      steps: [
        'Check your email inbox (and spam folder)',
        'Click the confirmation link in the email',
        'You\'ll be redirected back to complete your registration',
        'Wait for admin approval to access your account'
      ]
    };
  }
  /**
   * Handle email confirmation callback
   */
  static async handleEmailConfirmationCallback(
    searchParams: URLSearchParams
  ): Promise<EmailConfirmationResult> {
    try {
      // Check for all possible token parameter names from Supabase
      const token = searchParams.get('token') || 
                   searchParams.get('access_token') || 
                   searchParams.get('confirmation_token') ||
                   searchParams.get('token_hash');
      
      const type = searchParams.get('type') || 'signup';
      
      // Check for refresh token as well
      const refreshToken = searchParams.get('refresh_token');
      
      console.log('Email confirmation parameters:', {
        token: token ? '***present***' : 'missing',
        type,
        refreshToken: refreshToken ? '***present***' : 'missing',
        allParams: Object.fromEntries(searchParams.entries())
      });
      
      if (!token) {
        // Try to handle the confirmation using session-based approach
        return await this.handleSessionBasedConfirmation(searchParams);
      }
      
      // Validate type parameter
      if (type !== 'signup' && type !== 'email' && type !== 'recovery') {
        console.warn('Unexpected type parameter:', type);
        // Don't fail, just use 'signup' as default
      }
      
      return await this.verifyEmailConfirmation(token, type);
    } catch (error: any) {
      console.error('Email confirmation callback error:', error);
      return {
        success: false,
        message: error.message || 'Invalid confirmation link. Please try again or contact support.'
      };
    }
  }

  /**
   * Handle confirmation when no token is present (session-based)
   */
  static async handleSessionBasedConfirmation(
    searchParams: URLSearchParams
  ): Promise<EmailConfirmationResult> {
    try {
      // Get current session and user separately
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (sessionError || userError) throw sessionError || userError;
      
      if (user && user.email_confirmed_at) {
        // User is already confirmed, just create profile if needed
        const userMetadata = user.user_metadata || {};
        
        if (userMetadata.role) {
          try {
            await FinalRegistrationService.handleEmailConfirmation(session, userMetadata);
          } catch (profileError) {
            console.warn('Profile creation failed but email is confirmed:', profileError);
          }
        }
        
        return {
          success: true,
          message: 'Email already confirmed! You can now log in.',
          user
        };
      }
      
      throw new Error('No valid confirmation token found and user is not authenticated');
    } catch (error: any) {
      return {
        success: false,
        message: 'Unable to confirm email. Please try clicking the link in your email again.'
      };
    }
  }
}
// Export for use in components
export default EmailConfirmationService;
