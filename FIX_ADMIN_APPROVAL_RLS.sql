-- FIX ADMIN APPROVAL - Add UPDATE policies for admins
-- This script adds the missing RLS policies to allow admins to approve/reject users

-- First, let's add policies to allow admins to view all profiles (needed for the dashboard)
DROP POLICY IF EXISTS "Admins can view all student profiles" ON student_profiles;
CREATE POLICY "Admins can view all student profiles" ON student_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('ADMIN', 'SUPER_ADMIN') 
            AND approval_status = 'APPROVED'
        )
    );

DROP POLICY IF EXISTS "Admins can view all teacher profiles" ON teacher_profiles;
CREATE POLICY "Admins can view all teacher profiles" ON teacher_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('ADMIN', 'SUPER_ADMIN') 
            AND approval_status = 'APPROVED'
        )
    );

-- Now add the critical UPDATE policies for admins to approve/reject users
DROP POLICY IF EXISTS "Admins can update student profiles" ON student_profiles;
CREATE POLICY "Admins can update student profiles" ON student_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('ADMIN', 'SUPER_ADMIN') 
            AND approval_status = 'APPROVED'
        )
    );

DROP POLICY IF EXISTS "Admins can update teacher profiles" ON teacher_profiles;
CREATE POLICY "Admins can update teacher profiles" ON teacher_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('ADMIN', 'SUPER_ADMIN') 
            AND approval_status = 'APPROVED'
        )
    );

-- Also add policies to allow admins to view all user profiles
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
CREATE POLICY "Admins can view all user profiles" ON user_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('ADMIN', 'SUPER_ADMIN') 
            AND up.approval_status = 'APPROVED'
        )
    );

-- Update policies for user_profiles (in case needed)
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;
CREATE POLICY "Admins can update user profiles" ON user_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('ADMIN', 'SUPER_ADMIN') 
            AND up.approval_status = 'APPROVED'
        )
    );

-- Test the fix
SELECT 'Admin RLS policies added successfully!' as status;

-- Show current admin user for verification
SELECT 
    'Current Admin User:' as section,
    email,
    role,
    approval_status
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE up.role IN ('ADMIN', 'SUPER_ADMIN')
ORDER BY up.created_at;

-- Show pending users that can now be approved
SELECT 
    'Pending Users Available for Approval:' as section,
    COUNT(*) as pending_count
FROM (
    SELECT user_id FROM student_profiles WHERE approval_date IS NULL
    UNION ALL
    SELECT user_id FROM teacher_profiles WHERE approval_date IS NULL
) pending;
