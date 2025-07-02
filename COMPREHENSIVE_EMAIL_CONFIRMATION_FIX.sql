-- COMPREHENSIVE EMAIL CONFIRMATION FIX
-- This fixes all email confirmation issues and ensures proper profile creation

-- Step 1: Create improved email confirmation trigger
CREATE OR REPLACE FUNCTION handle_email_confirmation_v2()
RETURNS trigger AS $$
DECLARE
    user_role TEXT;
    enrollment_num TEXT;
BEGIN
  -- Only proceed if email was just confirmed
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Get the role from user metadata
    user_role := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', ''));
    
    -- Log the confirmation for debugging
    RAISE NOTICE 'Email confirmed for user %, role: %', NEW.id, user_role;
    
    -- Create user_profiles entry first
    INSERT INTO user_profiles (user_id, role, full_name, email, created_at, updated_at)
    VALUES (
      NEW.id,
      user_role,
      NEW.raw_user_meta_data->>'full_name',
      NEW.email,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      role = EXCLUDED.role,
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      updated_at = NOW();
    
    -- Create role-specific profiles
    IF user_role = 'STUDENT' THEN
      -- Generate enrollment number
      enrollment_num := 'EDU' || LPAD(nextval('enrollment_sequence')::TEXT, 6, '0');
      
      INSERT INTO student_profiles (
        user_id, 
        full_name, 
        email, 
        enrollment_no, 
        guardian_name,
        guardian_mobile,
        parent_email,
        parent_phone,
        grade,
        batch,
        status,
        created_at, 
        updated_at
      )
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        enrollment_num,
        NEW.raw_user_meta_data->>'guardianName',
        NEW.raw_user_meta_data->>'guardianMobile',
        NEW.raw_user_meta_data->>'parentEmail',
        NEW.raw_user_meta_data->>'parentMobile',
        NEW.raw_user_meta_data->>'classLevel',
        NEW.raw_user_meta_data->>'batch',
        'PENDING',
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = NOW();
        
    ELSIF user_role = 'TEACHER' THEN
      INSERT INTO teacher_profiles (
        user_id,
        full_name,
        email,
        subject_expertise,
        experience_years,
        qualification,
        status,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NEW.raw_user_meta_data->>'subjectExpertise',
        COALESCE((NEW.raw_user_meta_data->>'experienceYears')::INTEGER, 0),
        NEW.raw_user_meta_data->>'qualification',
        'PENDING',
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = NOW();
        
    ELSIF user_role = 'ADMIN' THEN
      -- Admins are approved immediately and stored in user_profiles only
      UPDATE user_profiles 
      SET status = 'APPROVED'
      WHERE user_id = NEW.id;
      
    END IF;
    
    RAISE NOTICE 'Profile created for user % with role %', NEW.id, user_role;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;

CREATE TRIGGER handle_email_confirmation_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_confirmation_v2();

-- Ensure sequence exists
CREATE SEQUENCE IF NOT EXISTS enrollment_sequence START 1000;

-- Add status column to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'status') THEN
        ALTER TABLE user_profiles ADD COLUMN status TEXT DEFAULT 'PENDING';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id_role ON user_profiles(user_id, role);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id_status ON student_profiles(user_id, status);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id_status ON teacher_profiles(user_id, status);

-- Grant necessary permissions
GRANT USAGE ON SEQUENCE enrollment_sequence TO authenticated, anon;

SELECT 'Email confirmation trigger v2 installed successfully!' as status;
