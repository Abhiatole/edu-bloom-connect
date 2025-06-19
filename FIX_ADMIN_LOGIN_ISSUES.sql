-- COMPREHENSIVE FIX FOR ADMIN REGISTRATION AND LOGIN ISSUES
-- Run this in your Supabase SQL Editor

-- Step 1: Drop and recreate RLS policies with proper permissions

-- Fix student_profiles policies
DROP POLICY IF EXISTS "Students can view own profile" ON student_profiles;
DROP POLICY IF EXISTS "Allow student profile creation" ON student_profiles;
DROP POLICY IF EXISTS "Students can update own profile" ON student_profiles;

CREATE POLICY "Enable read access for own profile" ON student_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON student_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own profile" ON student_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Fix teacher_profiles policies
DROP POLICY IF EXISTS "Teachers can view own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Allow teacher profile creation" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;

CREATE POLICY "Enable read access for own profile" ON teacher_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON teacher_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own profile" ON teacher_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Fix user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Enable read access for own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Step 2: Create or fix the user creation trigger
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
    -- Handle teacher registration
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
    -- Handle admin registration
    ELSIF NEW.raw_user_meta_data->>'role' = 'admin' THEN
      INSERT INTO public.user_profiles (
        user_id,
        full_name,
        email,
        role,
        status
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        'ADMIN',
        'APPROVED'  -- Admins are auto-approved
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 4: Grant proper permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.student_profiles TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.teacher_profiles TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated, anon;

-- Step 5: Test the setup
SELECT 'Database policies and triggers updated successfully!' as status;

-- Check if any admin profiles exist
SELECT 
  'Current admin profiles:' as info,
  COUNT(*) as admin_count
FROM user_profiles 
WHERE role = 'ADMIN';
