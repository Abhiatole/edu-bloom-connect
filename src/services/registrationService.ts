import { supabase } from '@/integrations/supabase/client';

export interface RegistrationData {
  fullName: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  additionalData?: any;
}

export interface StudentRegistrationData extends RegistrationData {
  classLevel: number;
  guardianName: string;
  guardianMobile: string;
}

export interface TeacherRegistrationData extends RegistrationData {
  subjectExpertise: string;
  experienceYears: number;
}

export interface AdminRegistrationData extends RegistrationData {
  department?: string;
}

export class RegistrationService {
  /**
   * Register a new student
   */
  static async registerStudent(data: StudentRegistrationData) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'student',
            full_name: data.fullName,
            class_level: data.classLevel,
            guardian_name: data.guardianName,
            guardian_mobile: data.guardianMobile
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {        // Create student profile if user is immediately confirmed
        if (authData.session || authData.user.email_confirmed_at) {
          // Generate enrollment number
          const enrollmentNo = `ENR${Date.now()}`;
            const profileData = {
            user_id: authData.user.id,
            enrollment_no: enrollmentNo,
            class_level: data.classLevel,
            parent_email: data.email,
            parent_phone: data.guardianMobile,
            address: `Guardian: ${data.guardianName}`,
            status: 'PENDING' as const
          };

          const { error: profileError } = await supabase
            .from('student_profiles')
            .insert(profileData);

          if (profileError) {
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }
        }

        return {
          success: true,
          user: authData.user,
          requiresEmailConfirmation: !authData.session && !authData.user.email_confirmed_at
        };
      }

      throw new Error('User creation failed - no user data returned');
    } catch (error: any) {
      console.error('Student registration error:', error);
      throw error;
    }
  }

  /**
   * Register a new teacher
   */
  static async registerTeacher(data: TeacherRegistrationData) {
    try {
      // Create auth user
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

      if (authError) throw authError;

      if (authData.user) {        // Create teacher profile if user is immediately confirmed
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
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }
        }

        return {
          success: true,
          user: authData.user,
          requiresEmailConfirmation: !authData.session && !authData.user.email_confirmed_at
        };
      }

      throw new Error('User creation failed - no user data returned');
    } catch (error: any) {
      console.error('Teacher registration error:', error);
      throw error;
    }
  }

  /**
   * Register a new admin
   */
  static async registerAdmin(data: AdminRegistrationData) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'admin',
            full_name: data.fullName,
            department: data.department
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {        // Create admin profile if user is immediately confirmed
        if (authData.session || authData.user.email_confirmed_at) {          const profileData = {
            user_id: authData.user.id,
            full_name: data.fullName,
            email: data.email,
            role: 'ADMIN' as const,
            status: 'PENDING' as const
          };

          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert(profileData);

          if (profileError) {
            throw new Error(`Profile creation failed: ${profileError.message}`);
          }
        }

        return {
          success: true,
          user: authData.user,
          requiresEmailConfirmation: !authData.session && !authData.user.email_confirmed_at
        };
      }

      throw new Error('User creation failed - no user data returned');
    } catch (error: any) {
      console.error('Admin registration error:', error);
      throw error;
    }
  }

  /**
   * Handle email confirmation and create profile
   */
  static async handleEmailConfirmation(userMetadata: any) {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      const role = userMetadata.role;
      const userId = currentUser.user.id;      if (role === 'student') {
        // Generate enrollment number
        const enrollmentNo = `ENR${Date.now()}`;
          const profileData = {
          user_id: userId,
          enrollment_no: enrollmentNo,
          class_level: userMetadata.class_level,
          parent_email: currentUser.user.email,
          parent_phone: userMetadata.guardian_mobile,
          address: `Guardian: ${userMetadata.guardian_name}`,
          status: 'PENDING' as const
        };

        const { error } = await supabase
          .from('student_profiles')
          .insert(profileData);

        if (error) throw error;      } else if (role === 'teacher') {
        const profileData = {
          user_id: userId,
          full_name: userMetadata.full_name || 'Teacher Name',
          email: userMetadata.email || currentUser.user.email,
          subject_expertise: userMetadata.subject_expertise,
          experience_years: userMetadata.experience_years,
          status: 'PENDING' as const
        };

        const { error } = await supabase
          .from('teacher_profiles')
          .insert(profileData);

        if (error) throw error;
      } else if (role === 'admin') {
        const profileData = {
          user_id: userId,
          full_name: userMetadata.full_name,
          email: currentUser.user.email,
          role: 'ADMIN' as const
        };

        const { error } = await supabase
          .from('user_profiles')
          .insert(profileData);

        if (error) throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Email confirmation handling error:', error);
      throw error;
    }
  }
}
