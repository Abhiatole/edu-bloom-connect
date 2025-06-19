-- Create database trigger to handle profile creation after email confirmation
-- This trigger will create profiles automatically when users are confirmed

-- Function to handle user confirmation and profile creation
CREATE OR REPLACE FUNCTION public.handle_user_confirmation()
RETURNS trigger AS $$
BEGIN
  -- Only proceed if user is being confirmed (email_confirmed_at is being set)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    -- Check if user has a role in metadata and doesn't already have a profile
    IF NEW.raw_user_meta_data ? 'role' THEN
      -- Handle student profile creation
      IF NEW.raw_user_meta_data->>'role' = 'student' THEN
        -- Check if profile doesn't already exist
        IF NOT EXISTS (SELECT 1 FROM public.student_profiles WHERE user_id = NEW.id) THEN
          INSERT INTO public.student_profiles (
            user_id,
            full_name,
            email,
            class_level,
            guardian_name,
            guardian_mobile,
            status
          ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NEW.email,
            COALESCE((NEW.raw_user_meta_data->>'class_level')::integer, 11),
            NEW.raw_user_meta_data->>'guardian_name',
            NEW.raw_user_meta_data->>'guardian_mobile',
            'PENDING'
          );
        END IF;
      -- Handle teacher profile creation
      ELSIF NEW.raw_user_meta_data->>'role' = 'teacher' THEN
        -- Check if profile doesn't already exist
        IF NOT EXISTS (SELECT 1 FROM public.teacher_profiles WHERE user_id = NEW.id) THEN
          INSERT INTO public.teacher_profiles (
            user_id,
            full_name,
            email,
            subject_expertise,
            experience_years,
            status
          ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'subject_expertise', 'Other'),
            COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0),
            'PENDING'
          );
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user confirmation
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE PROCEDURE public.handle_user_confirmation();

-- Also create a trigger for immediate creation if email confirmation is disabled
CREATE OR REPLACE FUNCTION public.handle_new_user_immediate()
RETURNS trigger AS $$
BEGIN
  -- Only create profile if email confirmation is not required (confirmed_at is set immediately)
  IF NEW.email_confirmed_at IS NOT NULL AND NEW.raw_user_meta_data ? 'role' THEN
    -- Handle student profile creation
    IF NEW.raw_user_meta_data->>'role' = 'student' THEN
      INSERT INTO public.student_profiles (
        user_id,
        full_name,
        email,
        class_level,
        guardian_name,
        guardian_mobile,
        status
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'class_level')::integer, 11),
        NEW.raw_user_meta_data->>'guardian_name',
        NEW.raw_user_meta_data->>'guardian_mobile',
        'PENDING'
      );
    -- Handle teacher profile creation
    ELSIF NEW.raw_user_meta_data->>'role' = 'teacher' THEN
      INSERT INTO public.teacher_profiles (
        user_id,
        full_name,
        email,
        subject_expertise,
        experience_years,
        status
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'subject_expertise', 'Other'),
        COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0),
        'PENDING'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for immediate user creation (when email confirmation is disabled)
DROP TRIGGER IF EXISTS on_auth_user_created_immediate ON auth.users;
CREATE TRIGGER on_auth_user_created_immediate
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE PROCEDURE public.handle_new_user_immediate();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.student_profiles TO authenticated, anon;
GRANT ALL ON public.teacher_profiles TO authenticated, anon;
