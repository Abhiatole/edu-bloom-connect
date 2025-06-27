-- Temporary fix for student registration RLS issue
-- This allows newly registered users to create their profiles immediately after signup

-- Drop existing student insert policy
DROP POLICY IF EXISTS "Students can create own profile" ON student_profiles;

-- Create a more permissive policy for registration
-- This allows both authenticated users AND anonymous users who have the correct user_id
CREATE POLICY "Allow student profile creation during registration" ON student_profiles
  FOR INSERT 
  WITH CHECK (
    -- Allow if the user is authenticated and matches the user_id
    (auth.uid() = user_id) OR
    -- Allow if user_id exists in auth.users (recently created user)
    (EXISTS (SELECT 1 FROM auth.users WHERE id = user_id))
  );

-- Also ensure we grant the necessary permissions
GRANT INSERT ON public.student_profiles TO authenticated, anon;

-- Create a function to check if a user was recently created (within last 5 minutes)
CREATE OR REPLACE FUNCTION is_recent_user(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_uuid 
    AND created_at > NOW() - INTERVAL '5 minutes'
  );
END;
$$;

-- Alternative policy using the function (more secure)
DROP POLICY IF EXISTS "Allow student profile creation during registration" ON student_profiles;

CREATE POLICY "Allow student profile creation during registration" ON student_profiles
  FOR INSERT 
  WITH CHECK (
    -- Allow authenticated users with matching user_id
    (auth.uid() = user_id) OR
    -- Allow recently created users (within 5 minutes)
    is_recent_user(user_id)
  );

-- Make sure RLS is enabled
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
