import { supabase } from '@/integrations/supabase/client';

export interface RegistrationData {
  fullName: string;
  email: string;
  password: string;
  studentMobile: string;
  parentMobile: string;
  classLevel: string;
  guardianName: string;
  guardianMobile: string;
  selectedSubjects: string[];
  selectedBatches: string[];
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  requiresEmailConfirmation?: boolean;
  enrollmentNumber?: string;
}

export class StudentRegistrationService {
  /**
   * Register a new student with complete data
   */
  static async registerStudent(data: RegistrationData): Promise<RegistrationResult> {
    try {
      // Validate required fields
      if (!data.fullName || !data.email || !data.password) {
        throw new Error('Full name, email, and password are required');
      }

      if (!data.studentMobile || !data.parentMobile) {
        throw new Error('Student mobile and parent mobile numbers are required');
      }

      if (data.selectedSubjects.length === 0) {
        throw new Error('Please select at least one subject');
      }

      if (data.selectedBatches.length === 0) {
        throw new Error('Please select at least one batch');
      }

      // Create auth user
      console.log('Starting user registration for:', data.email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'student',
            full_name: data.fullName,
            class_level: parseInt(data.classLevel),
            guardian_name: data.guardianName,
            guardian_mobile: data.guardianMobile,
            student_mobile: data.studentMobile,
            parent_mobile: data.parentMobile,
            selected_subjects: data.selectedSubjects,
            selected_batches: data.selectedBatches
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        console.error('No user data returned from auth signup');
        throw new Error('User creation failed - no user data returned');
      }

      console.log('Auth user created successfully:', authData.user.id);
      const requiresConfirmation = !authData.session && !authData.user.email_confirmed_at;
      console.log('Email confirmation required:', requiresConfirmation);

      // If email confirmation is disabled or user is immediately confirmed
      if (!requiresConfirmation) {
        console.log('Creating student profile immediately...');
        
        // Set the session if available to ensure proper authentication
        if (authData.session) {
          console.log('Setting session for immediate profile creation');
          await supabase.auth.setSession(authData.session);
        }
        
        const result = await this.createStudentProfile(authData.user.id, data);
        return {
          success: true,
          message: 'Registration successful! Your account is pending approval.',
          requiresEmailConfirmation: false,
          enrollmentNumber: result.enrollmentNumber
        };
      }

      // Email confirmation required
      return {
        success: true,
        message: 'Registration successful! Please check your email to confirm your account.',
        requiresEmailConfirmation: true
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  }

  /**
   * Create student profile after email confirmation
   */
  static async createStudentProfile(userId: string, data: RegistrationData): Promise<{ enrollmentNumber: string }> {
    try {
      console.log('Creating student profile for user:', userId);
      
      // Verify current authentication state
      const { data: currentUser } = await supabase.auth.getUser();
      console.log('Current auth user:', currentUser.user?.id);
      
      // Generate enrollment number first
      const enrollmentNumber = await this.generateEnrollmentNumber();
      console.log('Generated enrollment number:', enrollmentNumber);
      
      // Create student profile with only the fields that exist in the current schema
      const profileData = {
        user_id: userId,
        enrollment_no: enrollmentNumber,
        class_level: parseInt(data.classLevel),
        parent_email: data.email, // Use student email as parent email for now
        parent_phone: data.parentMobile,
        status: 'PENDING' as const
      };

      console.log('Inserting profile data:', profileData);

      const { data: profileResult, error: profileError } = await supabase
        .from('student_profiles')
        .insert(profileData)
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // If it's an RLS error, try with a slight delay to allow auth to settle
        if (profileError.message.includes('policy') || profileError.message.includes('RLS')) {
          console.log('RLS error detected, retrying after delay...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: retryResult, error: retryError } = await supabase
            .from('student_profiles')
            .insert(profileData)
            .select()
            .single();
            
          if (retryError) {
            throw new Error(`Profile creation failed after retry: ${retryError.message}`);
          }
          
          console.log('Profile created successfully on retry:', retryResult);
          return {
            enrollmentNumber: retryResult.enrollment_no || enrollmentNumber
          };
        }
        
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      if (!profileResult) {
        console.error('No profile data returned');
        throw new Error('Profile creation failed - no profile data returned');
      }

      console.log('Profile created successfully:', profileResult);

      // The subject and batch enrollment will be skipped for now since the tables don't exist
      // This will be handled once the database migration is applied

      return {
        enrollmentNumber: profileResult.enrollment_no || enrollmentNumber
      };

    } catch (error: any) {
      console.error('createStudentProfile error:', error);
      throw new Error(`Database error saving new user: ${error.message}`);
    }
  }

  /**
   * Handle email confirmation and create profile from user metadata
   */
  static async handleEmailConfirmation(user: any): Promise<RegistrationResult> {
    try {
      if (!user || !user.user_metadata) {
        throw new Error('Invalid user data for confirmation');
      }

      const metadata = user.user_metadata;
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('student_profiles')
        .select('id, enrollment_no')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        return {
          success: true,
          message: 'Email confirmed! Your account is ready.',
          enrollmentNumber: existingProfile.enrollment_no
        };
      }

      // Create profile from metadata
      const data: RegistrationData = {
        fullName: metadata.full_name || '',
        email: user.email || '',
        password: '', // Not needed for profile creation
        classLevel: (metadata.class_level || 11).toString(),
        guardianName: metadata.guardian_name || '',
        guardianMobile: metadata.guardian_mobile || '',
        studentMobile: metadata.student_mobile || '',
        parentMobile: metadata.parent_mobile || metadata.guardian_mobile || '',
        selectedSubjects: metadata.selected_subjects || [],
        selectedBatches: metadata.selected_batches || []
      };

      const result = await this.createStudentProfile(user.id, data);
      
      return {
        success: true,
        message: 'Email confirmed! Your account is pending approval.',
        enrollmentNumber: result.enrollmentNumber
      };

    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to complete registration after email confirmation'
      };
    }
  }

  /**
   * Get student's enrolled subjects and batches
   */
  static async getStudentEnrollments(studentId: string) {
    try {
      // Get enrolled subjects
      const { data: subjectEnrollments, error: subjectsError } = await supabase
        .from('student_subjects')
        .select(`
          id,
          enrolled_at,
          subjects (
            id,
            name,
            description
          )
        `)
        .eq('student_id', studentId);

      if (subjectsError) {
        console.error('Error fetching subject enrollments:', subjectsError);
      }

      // Get enrolled batches
      const { data: batchEnrollments, error: batchesError } = await supabase
        .from('student_batches')
        .select(`
          id,
          enrolled_at,
          batches (
            id,
            name,
            description
          )
        `)
        .eq('student_id', studentId);

      if (batchesError) {
        console.error('Error fetching batch enrollments:', batchesError);
      }

      return {
        subjects: subjectEnrollments?.map(enrollment => ({
          ...enrollment.subjects,
          enrolledAt: enrollment.enrolled_at
        })) || [],
        batches: batchEnrollments?.map(enrollment => ({
          ...enrollment.batches,
          enrolledAt: enrollment.enrolled_at
        })) || []
      };
    } catch (error) {
      console.error('Error in getStudentEnrollments:', error);
      return {
        subjects: [],
        batches: []
      };
    }
  }

  /**
   * Generate a unique enrollment number
   */
  static async generateEnrollmentNumber(): Promise<string> {
    try {
      // Generate enrollment number in format: STU{YYYY}{MM}{NNNN}
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      
      // Get count of existing students to generate unique number
      const { count, error } = await supabase
        .from('student_profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        // If we can't get count, use random number
        const randomNum = Math.floor(Math.random() * 9999) + 1;
        return `STU${year}${month}${String(randomNum).padStart(4, '0')}`;
      }
      
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
}

export default StudentRegistrationService;
