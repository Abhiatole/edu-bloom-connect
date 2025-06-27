import { supabase } from '@/integrations/supabase/client';

export interface StudentRegistrationData {
  fullName: string;
  email: string;
  password: string;
  studentClass: string; // "11" or "12"
  batches: string[];    // ["NEET", "JEE", "CET"]
  subjects: string[];   // ["Physics", "Chemistry", "Biology", "Mathematics"]
  parentMobile?: string;
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  requiresEmailConfirmation?: boolean;
  enrollmentNumber?: string;
}

export class StudentRegistrationService {
  /**
   * Register a new student with email confirmation
   */
  static async registerStudent(data: StudentRegistrationData): Promise<RegistrationResult> {
    try {
      console.log('🚀 Starting student registration for:', data.email);

      // Step 1: Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'student',
            full_name: data.fullName,
            student_class: data.studentClass,
            batches: data.batches,
            subjects: data.subjects,
            parent_mobile: data.parentMobile
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        throw new Error(`Registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        console.error('❌ No user data returned from signup');
        throw new Error('Registration failed: No user data returned');
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Step 2: Check if email confirmation is required
      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;
      console.log('📧 Email confirmation required:', requiresConfirmation);

      // Step 3: If no email confirmation needed, create profile immediately
      if (!requiresConfirmation && authData.session) {
        console.log('🔄 Creating student profile immediately...');
        
        // Set the session to ensure proper authentication
        await supabase.auth.setSession(authData.session);
        
        const profileResult = await this.createStudentProfile(authData.user.id, data);
        
        return {
          success: true,
          message: 'Registration successful! Your account is pending approval.',
          requiresEmailConfirmation: false,
          enrollmentNumber: profileResult.enrollmentNumber
        };
      }

      // Step 4: Email confirmation required
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
   * Create student profile in the actual database schema
   */
  static async createStudentProfile(userId: string, data: Omit<StudentRegistrationData, 'password'>): Promise<{ enrollmentNumber: string }> {
    try {
      console.log('📝 Creating student profile for user:', userId);

      // Generate unique enrollment number
      const enrollmentNumber = await this.generateEnrollmentNumber();
      console.log('🎫 Generated enrollment number:', enrollmentNumber);

      // Create profile with the actual schema fields
      const profileData = {
        user_id: userId,
        enrollment_no: enrollmentNumber,
        class_level: parseInt(data.studentClass),
        parent_email: data.email, // Using student email as parent email for now
        parent_phone: data.parentMobile || '',
        status: 'PENDING' as const
      };

      console.log('📋 Inserting profile data:', profileData);

      const { data: profileResult, error: profileError } = await supabase
        .from('student_profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        
        // Retry once if it's an RLS/auth timing issue
        if (profileError.message.includes('policy') || profileError.message.includes('RLS')) {
          console.log('🔄 Retrying after auth delay...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: retryResult, error: retryError } = await supabase
            .from('student_profiles')
            .insert(profileData)
            .select()
            .single();
            
          if (retryError) {
            throw new Error(`Profile creation failed: ${retryError.message}`);
          }
          
          return { enrollmentNumber: retryResult.enrollment_no };
        }
        
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      console.log('✅ Profile created successfully:', profileResult.id);

      // TODO: Save batches and subjects when those tables are available
      await this.saveBatchesAndSubjects(profileResult.id, data.batches, data.subjects);

      return { enrollmentNumber: profileResult.enrollment_no };

    } catch (error: any) {
      console.error('💥 Profile creation error:', error);
      throw new Error(`Database error saving new user: ${error.message}`);
    }
  }

  /**
   * Generate unique enrollment number
   */
  static async generateEnrollmentNumber(): Promise<string> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      // Count existing students for unique number
      const { count, error } = await supabase
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
   * Save batches and subjects (placeholder for when tables exist)
   */
  static async saveBatchesAndSubjects(studentId: string, batches: string[], subjects: string[]): Promise<void> {
    try {
      console.log('📚 Saving batches and subjects for student:', studentId);
      console.log('🎯 Batches:', batches);
      console.log('📖 Subjects:', subjects);
      
      // TODO: Implement when student_batches and student_subjects tables are created
      // For now, we'll store this in the user metadata
      console.log('ℹ️ Batch and subject enrollment will be implemented after database migration');
      
    } catch (error) {
      console.warn('⚠️ Could not save batches/subjects:', error);
      // Don't fail the whole registration for this
    }
  }

  /**
   * Handle email confirmation callback
   */
  static async handleEmailConfirmation(user: any): Promise<RegistrationResult> {
    try {
      if (!user || !user.user_metadata) {
        throw new Error('Invalid user data for confirmation');
      }

      const userData = {
        fullName: user.user_metadata.full_name,
        email: user.email,
        studentClass: user.user_metadata.student_class,
        batches: user.user_metadata.batches || [],
        subjects: user.user_metadata.subjects || [],
        parentMobile: user.user_metadata.parent_mobile
      };

      const result = await this.createStudentProfile(user.id, userData);

      return {
        success: true,
        message: 'Email confirmed! Your account is pending approval.',
        enrollmentNumber: result.enrollmentNumber
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to complete registration after email confirmation.'
      };
    }
  }
}

export default StudentRegistrationService;
