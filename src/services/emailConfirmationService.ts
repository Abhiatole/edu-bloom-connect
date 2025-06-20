// Email Confirmation Service
// Handles email confirmation, resending, and user guidance

import { supabase } from '@/integrations/supabase/client';

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
    return `${this.getCurrentDomain()}/email-confirmed`;
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
   * Verify email confirmation token
   */
  static async verifyEmailConfirmation(token: string, type: string): Promise<EmailConfirmationResult> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as 'signup' | 'email'
      });
      if (error) throw error;
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
      const token = searchParams.get('token') || searchParams.get('access_token');
      const type = searchParams.get('type');
      if (!token || (type !== 'signup' && type !== 'email')) {
        throw new Error('Invalid confirmation link');
      }
      return await this.verifyEmailConfirmation(token, type);
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Invalid confirmation link'
      };
    }
  }
}

// Export for use in components
export default EmailConfirmationService;
