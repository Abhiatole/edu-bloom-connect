-- ADMIN APPROVAL FIX - RLS Policies
-- This script fixes the admin approval functionality by adding proper RLS policies

-- Enable RLS on tables if not already enabled
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admins can view all student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Admins can view all teacher profiles" ON teacher_profiles;
DROP POLICY IF EXISTS "Admins can update student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Admins can update teacher profiles" ON teacher_profiles;
DROP POLICY IF EXISTS "Admin can view all student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Admin can view all teacher profiles" ON teacher_profiles;
DROP POLICY IF EXISTS "Admin can update student profiles" ON student_profiles;
DROP POLICY IF EXISTS "Admin can update teacher profiles" ON teacher_profiles;

-- Create policies for student_profiles
CREATE POLICY "Students can view own profile and admins can view all" ON student_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid() 
            AND u.raw_user_meta_data->>'role' IN ('admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Students can update own profile and admins can update all" ON student_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid() 
            AND u.raw_user_meta_data->>'role' IN ('admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN')
        )
    );

-- Create policies for teacher_profiles
CREATE POLICY "Teachers can view own profile and admins can view all" ON teacher_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid() 
            AND u.raw_user_meta_data->>'role' IN ('admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Teachers can update own profile and admins can update all" ON teacher_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM auth.users u
            WHERE u.id = auth.uid() 
            AND u.raw_user_meta_data->>'role' IN ('admin', 'ADMIN', 'super_admin', 'SUPER_ADMIN')
        )
    );

-- Add status column to both tables if it doesn't exist
DO $$ 
BEGIN
    -- Check and add status column to student_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_profiles' AND column_name = 'status') THEN
        ALTER TABLE student_profiles ADD COLUMN status TEXT DEFAULT 'PENDING';
    END IF;
    
    -- Check and add status column to teacher_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teacher_profiles' AND column_name = 'status') THEN
        ALTER TABLE teacher_profiles ADD COLUMN status TEXT DEFAULT 'PENDING';
    END IF;
    
    -- Check and add approved_by column to student_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_profiles' AND column_name = 'approved_by') THEN
        ALTER TABLE student_profiles ADD COLUMN approved_by UUID REFERENCES auth.users(id);
    END IF;
    
    -- Check and add approved_by column to teacher_profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teacher_profiles' AND column_name = 'approved_by') THEN
        ALTER TABLE teacher_profiles ADD COLUMN approved_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_status ON student_profiles(status);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_status ON teacher_profiles(status);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON teacher_profiles(user_id);

SELECT 'Admin approval RLS policies have been successfully updated!' as result;
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
