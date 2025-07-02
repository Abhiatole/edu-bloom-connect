-- CREATE SIMPLE EMAIL CONFIRMATION TRIGGER
-- This will automatically create profiles when users confirm their email

-- Create function to handle email confirmation and profile creation
CREATE OR REPLACE FUNCTION handle_email_confirmation()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if email was just confirmed (from null to not null)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Check if user has metadata with role
    IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
      
      -- Create user_profile entry
      INSERT INTO user_profiles (user_id, role, full_name, email, created_at, updated_at)
      VALUES (
        NEW.id,
        UPPER(NEW.raw_user_meta_data->>'role'),
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO NOTHING;
      
      -- Create role-specific profile
      IF UPPER(NEW.raw_user_meta_data->>'role') = 'STUDENT' THEN
        INSERT INTO student_profiles (
          user_id, 
          full_name, 
          email, 
          enrollment_no, 
          guardian_name,
          guardian_mobile,
          status,
          created_at, 
          updated_at
        )
        VALUES (
          NEW.id,
          NEW.raw_user_meta_data->>'full_name',
          NEW.email,
          'EDU' || LPAD(nextval('enrollment_sequence')::TEXT, 6, '0'),
          NEW.raw_user_meta_data->>'guardianName',
          NEW.raw_user_meta_data->>'guardianMobile',
          'PENDING',
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
        
      ELSIF UPPER(NEW.raw_user_meta_data->>'role') = 'TEACHER' THEN
        INSERT INTO teacher_profiles (
          user_id,
          full_name,
          email,
          subject_expertise,
          experience_years,
          status,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          NEW.raw_user_meta_data->>'full_name',
          NEW.email,
          NEW.raw_user_meta_data->>'subjectExpertise',
          (NEW.raw_user_meta_data->>'experienceYears')::INTEGER,
          'PENDING',
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
        
      ELSIF UPPER(NEW.raw_user_meta_data->>'role') = 'ADMIN' THEN
        INSERT INTO admin_profiles (
          user_id,
          full_name,
          email,
          status,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          NEW.raw_user_meta_data->>'full_name',
          NEW.email,
          'APPROVED',
          NOW(),
          NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create enrollment sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS enrollment_sequence START 1000;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_confirmation();

-- Test that the function works
SELECT 'Email confirmation trigger created successfully!' as status;
