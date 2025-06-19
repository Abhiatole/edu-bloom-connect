-- Alternative approach: Use database triggers for automatic profile creation
-- This ensures profile creation happens within the same transaction as user creation

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Check if user has a role in metadata
  IF NEW.raw_user_meta_data ? 'role' THEN
    -- Handle student registration
    IF NEW.raw_user_meta_data->>'role' = 'student' THEN
      INSERT INTO public.student_profiles (
        user_id,
        full_name,
        email,
        status
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        'PENDING'
      );
    -- Handle teacher registration
    ELSIF NEW.raw_user_meta_data->>'role' = 'teacher' THEN
      INSERT INTO public.teacher_profiles (
        user_id,
        full_name,
        email,
        status
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        'PENDING'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.student_profiles TO authenticated, anon;
GRANT ALL ON public.teacher_profiles TO authenticated, anon;
