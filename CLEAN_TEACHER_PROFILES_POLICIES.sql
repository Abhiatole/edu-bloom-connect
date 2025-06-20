-- CLEAN UP CONFLICTING RLS POLICIES FOR TEACHER_PROFILES
-- You have too many overlapping policies that might be conflicting

-- STEP 1: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can update any teacher profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Admins can view all teacher profiles" ON teacher_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read teacher profiles" ON teacher_profiles;
DROP POLICY IF EXISTS "Allow teacher profile creation" ON teacher_profiles;
DROP POLICY IF EXISTS "Allow users to insert their own teacher profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Allow users to update their own teacher profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Enable read own teacher profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Enable teacher registration" ON teacher_profiles;
DROP POLICY IF EXISTS "Enable update own teacher profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can update own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can view own profile" ON teacher_profiles;

-- STEP 2: Create clean, simple policies that work

-- Policy 1: Allow authenticated users to register (insert their own profile)
CREATE POLICY "authenticated_users_can_register" ON teacher_profiles
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can view their own profile
CREATE POLICY "users_can_view_own_profile" ON teacher_profiles
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

-- Policy 3: Users can update their own profile
CREATE POLICY "users_can_update_own_profile" ON teacher_profiles
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- Policy 4: Admins can view all profiles
CREATE POLICY "admins_can_view_all" ON teacher_profiles
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' = 'admin'
        )
        OR auth.uid() = user_id  -- Users can still see their own
    );

-- Policy 5: Admins can update any profile (for approvals)
CREATE POLICY "admins_can_update_any" ON teacher_profiles
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' = 'admin'
        )
        OR auth.uid() = user_id  -- Users can still update their own
    );

-- STEP 3: Ensure RLS is enabled
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON teacher_profiles TO authenticated;

-- STEP 5: Verification - Check what policies exist now
SELECT 'Current Policies' as info, 
       policyname, 
       cmd as operation,
       roles,
       CASE 
           WHEN cmd = 'INSERT' THEN with_check 
           ELSE qual 
       END as condition
FROM pg_policies 
WHERE tablename = 'teacher_profiles'
ORDER BY cmd, policyname;
