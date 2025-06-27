import { supabase } from '@/integrations/supabase/client';

export interface StudentRegistrationData {
  fullName: string;
  email: string;
  password: string;
  classLevel: string;
  guardianName?: string;
  guardianMobile?: string;
  parentMobile?: string;
  batches?: string[];
  subjects?: string[];
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
  employeeId?: string;
}

export class UnifiedRegistrationService {
  
  /**
   * Generate unique enrollment number for students
   */
  private static generateEnrollmentNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const timestamp = String(Date.now()).slice(-4);
    return `STU${year}${month}${timestamp}`;
  }

  /**
   * Generate unique employee ID for teachers
   */
  private static generateEmployeeId(): string {
    const year = new Date().getFullYear();
    const timestamp = String(Date.now()).slice(-4);
    return `TCH${year}${timestamp}`;
  }

  /**
   * Get confirmation URL for email redirects
   */
  private static getConfirmationUrl(): string {
    return `${window.location.origin}/auth/confirm`;
  }

  /**
   * Utility to sanitize and validate user metadata for Supabase auth
   */
  private static sanitizeMetadata(role: 'student' | 'teacher' | 'admin', data: any): Record<string, any> {
    if (role === 'student') {
      if (!data.fullName || !data.classLevel) throw new Error('Full name and class level are required');
      const meta: Record<string, any> = {
        role: 'student',
        full_name: data.fullName,
        class_level: data.classLevel,
        guardian_name: data.guardianName || '',
        guardian_mobile: data.guardianMobile || '',
        parent_mobile: data.parentMobile || ''
      };
      if (Array.isArray(data.batches)) meta.batches = JSON.stringify(data.batches);
      if (Array.isArray(data.subjects)) meta.subjects = JSON.stringify(data.subjects);
      return meta;
    }
    if (role === 'teacher') {
      if (!data.fullName || !data.subjectExpertise || typeof data.experienceYears !== 'number') throw new Error('All fields are required and experience years must be a number');
      return {
        role: 'teacher',
        full_name: data.fullName,
        subject_expertise: data.subjectExpertise,
        experience_years: data.experienceYears
      };
    }
    if (role === 'admin') {
      if (!data.fullName) throw new Error('Full name is required');
      return {
        role: 'admin',
        full_name: data.fullName
      };
    }
    throw new Error('Invalid role for metadata');
  }

  /**
   * Register a new student with comprehensive error handling and fallback strategies
   */
  static async registerStudent(data: StudentRegistrationData): Promise<RegistrationResult> {
    try {
      console.log('🚀 Starting unified student registration...');
      
      // Validation
      if (!data.fullName || !data.email || !data.password) {
        throw new Error('Full name, email, and password are required');
      }
      
      if (data.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Prepare metadata (convert arrays to JSON strings to avoid metadata issues)
      const userMetadata = this.sanitizeMetadata('student', data);

      console.log('📋 Creating auth user with safe metadata:', userMetadata);

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: this.getConfirmationUrl()
        }
      });

      if (authError) {
        console.error('❌ Auth signup error:', authError);
        throw new Error(`Registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      console.log('✅ Auth user created:', authData.user.id);
      console.log('📧 Email confirmation required:', !authData.session && !authData.user.email_confirmed_at);

      // Step 2: Create profile if user is immediately confirmed
      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;
      
      if (!requiresConfirmation) {
        console.log('🔄 Creating student profile immediately...');
        
        const profileResult = await this.createStudentProfile(authData.user.id, data);
        
        return {
          success: true,
          message: 'Registration successful! Your account is pending approval.',
          user: authData.user,
          requiresEmailConfirmation: false,
          enrollmentNumber: profileResult.enrollmentNumber
        };
      }

      // Email confirmation required
      return {
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        user: authData.user,
        requiresEmailConfirmation: true
      };

    } catch (error: any) {
      console.error('💥 Student registration failed:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Create student profile with multiple fallback strategies
   */
  private static async createStudentProfile(userId: string, data: StudentRegistrationData): Promise<{ enrollmentNumber: string }> {
    const enrollmentNumber = this.generateEnrollmentNumber();
    
    console.log('📝 Creating student profile for user:', userId);
    console.log('🎫 Generated enrollment number:', enrollmentNumber);

    // Strategy 1: Try bypass function first (most reliable)
    try {
      console.log('🔄 Attempting bypass function...');
      
      const { data: bypassResult, error: bypassError } = await supabase.rpc(
        'register_student_bypass',
        {
          p_user_id: userId,
          p_email: data.email,
          p_full_name: data.fullName,
          p_class_level: parseInt(data.classLevel),
          p_parent_email: data.email,
          p_parent_phone: data.parentMobile || data.guardianMobile || ''
        }
      );

      if (bypassError) {
        console.warn('⚠️ Bypass function failed:', bypassError);
        throw bypassError;
      }

      if (bypassResult && bypassResult.success) {
        console.log('✅ Bypass function succeeded');
        return { enrollmentNumber: bypassResult.enrollment_no };
      }
      
      console.warn('⚠️ Bypass function returned unsuccessful result');
      throw new Error('Bypass function failed');
      
    } catch (bypassError) {
      console.warn('⚠️ Bypass function failed, trying direct insert...', bypassError);
    }

    // Strategy 2: Direct insert with session management
    try {
      console.log('🔄 Attempting direct profile insert...');
      
      // Get current session
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        await supabase.auth.setSession(session.session);
      }

      const profileData = {
        user_id: userId,
        enrollment_no: enrollmentNumber,
        class_level: parseInt(data.classLevel),
        parent_email: data.email,
        parent_phone: data.parentMobile || data.guardianMobile || '',
        status: 'PENDING' as const
      };

      console.log('📋 Inserting profile data:', profileData);

      const { data: profileResult, error: profileError } = await supabase
        .from('student_profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('❌ Direct insert failed:', profileError);
        
        // Strategy 3: Retry after delay (for auth timing issues)
        console.log('🔄 Retrying after delay...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: retryResult, error: retryError } = await supabase
          .from('student_profiles')
          .insert(profileData)
          .select()
          .single();
          
        if (retryError) {
          throw new Error(`Profile creation failed: ${retryError.message}`);
        }
        
        console.log('✅ Retry succeeded');
        return { enrollmentNumber: retryResult.enrollment_no };
      }

      console.log('✅ Direct insert succeeded');
      return { enrollmentNumber: profileResult.enrollment_no };

    } catch (error: any) {
      console.error('💥 All profile creation strategies failed:', error);
      throw new Error(`Database error saving new user: ${error.message}`);
    }
  }

  /**
   * Register a new teacher
   */
  static async registerTeacher(data: TeacherRegistrationData): Promise<RegistrationResult> {
    try {
      console.log('🚀 Starting teacher registration...');
      
      // Validation
      if (!data.fullName || !data.subjectExpertise || typeof data.experienceYears !== 'number') {
        throw new Error('All fields are required and experience years must be a number');
      }

      const validSubjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other'];
      if (!validSubjects.includes(data.subjectExpertise)) {
        throw new Error('Invalid subject expertise');
      }

      // Prepare metadata
      const userMetadata = this.sanitizeMetadata('teacher', data);
      console.log('📋 Creating auth user with safe metadata:', userMetadata);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: this.getConfirmationUrl()
        }
      });

      if (authError) {
        throw new Error(`Registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Create teacher profile if user is immediately confirmed
      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;
      
      if (!requiresConfirmation) {
        console.log('🔄 Creating teacher profile...');
        
        const employeeId = this.generateEmployeeId();
        
        const profileData = {
          user_id: authData.user.id,
          employee_id: employeeId,
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
          console.error('❌ Teacher profile creation failed:', profileError);
          // Continue anyway - profile can be created later via email confirmation
        }

        return {
          success: true,
          message: 'Teacher registration successful! Your account is pending admin approval.',
          user: authData.user,
          requiresEmailConfirmation: false,
          employeeId
        };
      }

      return {
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        user: authData.user,
        requiresEmailConfirmation: true
      };

    } catch (error: any) {
      console.error('💥 Teacher registration failed:', error);
      throw new Error(error.message || 'Teacher registration failed');
    }
  }

  /**
   * Register a new admin
   */
  static async registerAdmin(data: AdminRegistrationData): Promise<RegistrationResult> {
    try {
      console.log('🚀 Starting admin registration...');
      
      if (!data.fullName) {
        throw new Error('Full name is required');
      }

      // Prepare metadata
      const userMetadata = this.sanitizeMetadata('admin', data);
      console.log('📋 Creating auth user with safe metadata:', userMetadata);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: userMetadata,
          emailRedirectTo: this.getConfirmationUrl()
        }
      });

      if (authError) {
        throw new Error(`Registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Create admin profile if user is immediately confirmed
      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;
      
      if (!requiresConfirmation) {
        console.log('🔄 Creating admin profile...');
        
        const profileData = {
          user_id: authData.user.id,
          full_name: data.fullName,
          email: data.email,
          role: 'ADMIN' as const,
          status: 'APPROVED' as const  // Auto-approve admins
        };

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert(profileData);

        if (profileError) {
          console.error('❌ Admin profile creation failed:', profileError);
          // Continue anyway - profile can be created later
        }

        return {
          success: true,
          message: 'Admin registration successful! You can now login.',
          user: authData.user,
          requiresEmailConfirmation: false
        };
      }

      return {
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        user: authData.user,
        requiresEmailConfirmation: true
      };

    } catch (error: any) {
      console.error('💥 Admin registration failed:', error);
      throw new Error(error.message || 'Admin registration failed');
    }
  }

  /**
   * Handle email confirmation and create profiles if needed
   */
  static async handleEmailConfirmation(userMetadata: any): Promise<RegistrationResult> {
    try {
      console.log('🔄 Handling email confirmation...');
      
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }

      const role = (userMetadata.role || '').toLowerCase();
      const userId = currentUser.user.id;

      console.log('📋 Creating profile for role:', role);

      if (role === 'student') {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          console.log('✅ Student profile already exists');
          return {
            success: true,
            message: 'Account confirmed successfully!',
            user: currentUser.user,
            enrollmentNumber: existingProfile.enrollment_no
          };
        }

        // Create student profile
        const enrollmentNumber = this.generateEnrollmentNumber();
        
        const profileData = {
          user_id: userId,
          enrollment_no: enrollmentNumber,
          class_level: parseInt(userMetadata.class_level) || 11,
          parent_email: currentUser.user.email,
          parent_phone: userMetadata.guardian_mobile || userMetadata.parent_mobile || '',
          status: 'PENDING' as const
        };

        const { error: profileError } = await supabase
          .from('student_profiles')
          .insert(profileData);

        if (profileError) {
          console.error('❌ Student profile creation failed:', profileError);
          // Try bypass function
          const { data: bypassResult } = await supabase.rpc(
            'register_student_bypass',
            {
              p_user_id: userId,
              p_email: currentUser.user.email,
              p_full_name: userMetadata.full_name || 'Student',
              p_class_level: parseInt(userMetadata.class_level) || 11,
              p_parent_email: currentUser.user.email,
              p_parent_phone: userMetadata.guardian_mobile || ''
            }
          );
          
          if (bypassResult && bypassResult.success) {
            return {
              success: true,
              message: 'Account confirmed successfully! Your enrollment is pending approval.',
              user: currentUser.user,
              enrollmentNumber: bypassResult.enrollment_no
            };
          }
          
          throw profileError;
        }

        return {
          success: true,
          message: 'Account confirmed successfully! Your enrollment is pending approval.',
          user: currentUser.user,
          enrollmentNumber
        };

      } else if (role === 'teacher') {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          console.log('✅ Teacher profile already exists');
          return {
            success: true,
            message: 'Account confirmed successfully!',
            user: currentUser.user,
            employeeId: existingProfile.employee_id
          };
        }

        // Create teacher profile
        const employeeId = this.generateEmployeeId();
        
        const profileData = {
          user_id: userId,
          employee_id: employeeId,
          full_name: userMetadata.full_name || 'Teacher',
          email: currentUser.user.email,
          subject_expertise: userMetadata.subject_expertise || 'Other',
          experience_years: userMetadata.experience_years || 0,
          status: 'PENDING' as const
        };

        const { error: profileError } = await supabase
          .from('teacher_profiles')
          .insert(profileData);

        if (profileError) {
          throw profileError;
        }

        return {
          success: true,
          message: 'Account confirmed successfully! Your registration is pending admin approval.',
          user: currentUser.user,
          employeeId
        };

      } else if (role === 'admin') {
        // Check if profile already exists
        const { data: existingProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (existingProfile) {
          console.log('✅ Admin profile already exists');
          return {
            success: true,
            message: 'Account confirmed successfully!',
            user: currentUser.user
          };
        }

        // Create admin profile
        const profileData = {
          user_id: userId,
          full_name: userMetadata.full_name || 'Admin',
          email: currentUser.user.email,
          role: 'ADMIN' as const,
          status: 'APPROVED' as const  // Auto-approve admins
        };

        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert(profileData);

        if (profileError) {
          throw profileError;
        }

        return {
          success: true,
          message: 'Account confirmed successfully! You can now access the admin dashboard.',
          user: currentUser.user
        };
      }

      throw new Error(`Unknown role: ${role}`);

    } catch (error: any) {
      console.error('💥 Email confirmation failed:', error);
      throw new Error(error.message || 'Email confirmation failed');
    }
  }
}
