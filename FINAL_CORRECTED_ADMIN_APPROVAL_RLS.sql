-- FINAL CORRECTED ADMIN APPROVAL RLS FIX
-- This version uses the correct column name 'status' (not 'approval_status')

-- Allow admins to update student profiles
DROP POLICY IF EXISTS "Admins can update student profiles" ON student_profiles;
CREATE POLICY "Admins can update student profiles" ON student_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN'
            AND status = 'APPROVED'
        )
    );

-- Allow admins to update teacher profiles  
DROP POLICY IF EXISTS "Admins can update teacher profiles" ON teacher_profiles;
CREATE POLICY "Admins can update teacher profiles" ON teacher_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN'
            AND status = 'APPROVED'
        )
    );

-- Also add SELECT policies so admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all student profiles" ON student_profiles;
CREATE POLICY "Admins can view all student profiles" ON student_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN'
            AND status = 'APPROVED'
        )
    );

DROP POLICY IF EXISTS "Admins can view all teacher profiles" ON teacher_profiles;
CREATE POLICY "Admins can view all teacher profiles" ON teacher_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN'
            AND status = 'APPROVED'
        )
    );

-- Allow admins to view all user profiles for the dashboard
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
CREATE POLICY "Admins can view all user profiles" ON user_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'ADMIN'
            AND up.status = 'APPROVED'
        )
    );

SELECT 'FINAL CORRECTED: Admin approval RLS policies updated successfully with correct column name (status)!' as result;
