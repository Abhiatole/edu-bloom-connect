```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  meta jsonb;
  role text;
  full_name text;
BEGIN
  meta := NEW.raw_user_meta_data;
  IF meta IS NULL THEN
    RAISE EXCEPTION 'Missing user metadata';
  END IF;

  role := meta->>'role';
  full_name := meta->>'full_name';

  -- Insert into user_profiles
  INSERT INTO public.user_profiles (user_id, email, full_name, role)
  VALUES (NEW.id, NEW.email, full_name, role);

  -- Insert into role-specific profile
  IF role = 'admin' THEN
    INSERT INTO public.admin_profiles (user_id) VALUES (NEW.id);
  ELSIF role = 'teacher' THEN
    INSERT INTO public.teacher_profiles (user_id) VALUES (NEW.id);
  ELSIF role = 'student' THEN
    INSERT INTO public.student_profiles (user_id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```