-- Re-apply trigger and RLS policies for robust registration

-- 1. Ensure handle_new_user() function exists and is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role TEXT;
  v_full_name TEXT;
BEGIN
  IF NEW.raw_user_meta_data IS NULL THEN
    RETURN NEW;
  END IF;
  v_role := NEW.raw_user_meta_data->>'role';
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  IF v_role IS NULL OR v_role = '' THEN
    RETURN NEW;
  END IF;
  -- Insert into user_profiles for all roles
  INSERT INTO public.user_profiles (
    user_id, full_name, email, role, status
  ) VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    v_role,
    'PENDING'
  );
  -- Insert into role-specific table
  IF v_role = 'student' THEN
    INSERT INTO public.student_profiles (
      user_id, full_name, email, status
    ) VALUES (
      NEW.id,
      v_full_name,
      NEW.email,
      'PENDING'
    );
  ELSIF v_role = 'teacher' THEN
    INSERT INTO public.teacher_profiles (
      user_id, full_name, email, status
    ) VALUES (
      NEW.id,
      v_full_name,
      NEW.email,
      'PENDING'
    );
  ELSIF v_role = 'admin' THEN
    INSERT INTO public.admin_profiles (
      user_id, full_name, email
    ) VALUES (
      NEW.id,
      v_full_name,
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. RLS policies for student_profiles, teacher_profiles, user_profiles
-- (Allow INSERT/SELECT for authenticated)
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own profile" ON student_profiles;
CREATE POLICY "Students can view own profile" ON student_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can create own profile" ON student_profiles;
CREATE POLICY "Students can create own profile" ON student_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Teachers can view own profile" ON teacher_profiles;
CREATE POLICY "Teachers can view own profile" ON teacher_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can create own profile" ON teacher_profiles;
CREATE POLICY "Teachers can create own profile" ON teacher_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own profile" ON user_profiles;
CREATE POLICY "Users can create own profile" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert for authenticated" ON admin_profiles;
CREATE POLICY "Allow insert for authenticated" ON admin_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.student_profiles TO authenticated, anon;
GRANT ALL ON public.teacher_profiles TO authenticated, anon;
GRANT ALL ON public.user_profiles TO authenticated, anon;
GRANT ALL ON public.admin_profiles TO authenticated, anon;
