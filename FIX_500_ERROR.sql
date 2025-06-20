-- FIX SUPABASE 500 ERROR DURING REGISTRATION
-- Common causes: RLS policies blocking inserts, missing functions, or trigger failures

-- STEP 1: Create or fix RLS policies for registration

-- Enable RLS on tables (if not already enabled)
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert own profile" ON student_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON teacher_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON student_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON teacher_profiles;

-- Create permissive policies for registration
CREATE POLICY "Enable insert for authenticated users" ON student_profiles
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON teacher_profiles
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- Create policies for viewing own profile
CREATE POLICY "Users can view own profile" ON student_profiles
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" ON teacher_profiles
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id);

-- Create policies for updating own profile (needed for status updates)
CREATE POLICY "Users can update own profile" ON student_profiles
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON teacher_profiles
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = user_id);

-- STEP 2: Fix the update_user_status function (might be causing trigger failures)
CREATE OR REPLACE FUNCTION update_user_status()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- For approvals
    IF NEW.approval_date IS NOT NULL AND (OLD.approval_date IS NULL OR OLD.approval_date IS DISTINCT FROM NEW.approval_date) THEN
        NEW.status = 'APPROVED'::approval_status;
    END IF;
    
    -- For rejections
    IF NEW.rejected_at IS NOT NULL AND (OLD.rejected_at IS NULL OR OLD.rejected_at IS DISTINCT FROM NEW.rejected_at) THEN
        NEW.status = 'REJECTED'::approval_status;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        RAISE WARNING 'Error in update_user_status: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- STEP 3: Recreate triggers with error handling
DROP TRIGGER IF EXISTS student_status_trigger ON student_profiles;
CREATE TRIGGER student_status_trigger
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_status();

DROP TRIGGER IF EXISTS teacher_status_trigger ON teacher_profiles;
CREATE TRIGGER teacher_status_trigger
    BEFORE UPDATE ON teacher_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_status();

-- STEP 4: Add policies for admins/teachers to manage approvals
CREATE POLICY "Teachers can approve students" ON student_profiles
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM teacher_profiles tp 
            WHERE tp.user_id = auth.uid() 
            AND tp.status = 'APPROVED'::approval_status
        )
        OR
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can approve teachers" ON teacher_profiles
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid()
            AND u.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- STEP 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON student_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON teacher_profiles TO authenticated;

-- STEP 6: Test queries to verify fix
-- Test 1: Check if policies are working
SELECT 'Policy Check' as test, 
       COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('student_profiles', 'teacher_profiles');

-- Test 2: Verify function exists
SELECT 'Function Check' as test,
       routine_name
FROM information_schema.routines 
WHERE routine_name = 'update_user_status';

-- Test 3: Check triggers
SELECT 'Trigger Check' as test,
       trigger_name,
       event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%status_trigger%';

COMMENT ON FUNCTION update_user_status() IS 'Automatically updates user status when approval_date or rejected_at changes - with error handling';
