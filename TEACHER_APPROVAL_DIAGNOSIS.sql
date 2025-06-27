-- TEACHER REGISTRATION & APPROVAL FLOW DIAGNOSIS
-- Run this script in Supabase SQL Editor to diagnose and fix issues

-- Step 1: Check current teacher profiles table structure
SELECT 
    'TEACHER PROFILES TABLE STRUCTURE' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check if RLS is enabled
SELECT 
    'ROW LEVEL SECURITY STATUS' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('teacher_profiles', 'student_profiles')
AND schemaname = 'public';

-- Step 3: List current RLS policies 
SELECT 
    'CURRENT RLS POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    cmd as policy_type,
    qual as condition
FROM pg_policies 
WHERE tablename IN ('teacher_profiles', 'student_profiles')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Step 4: Check for existing teacher registrations
SELECT 
    'EXISTING TEACHER REGISTRATIONS' as section,
    COUNT(*) as total_teachers,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_teachers,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_teachers,
    COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_teachers,
    COUNT(CASE WHEN approval_date IS NULL THEN 1 END) as no_approval_date
FROM teacher_profiles;

-- Step 5: Check auth.users for teacher role assignments
SELECT 
    'AUTH USERS WITH TEACHER ROLE' as section,
    COUNT(*) as total_teacher_auth_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_teachers,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_teachers
FROM auth.users 
WHERE raw_user_meta_data->>'role' IN ('teacher', 'TEACHER');

-- Step 6: Check for teachers without profiles
SELECT 
    'TEACHERS WITHOUT PROFILES' as section,
    au.id as user_id,
    au.email,
    au.email_confirmed_at,
    au.created_at,
    au.raw_user_meta_data->>'full_name' as full_name,
    au.raw_user_meta_data->>'subject_expertise' as subject_expertise
FROM auth.users au
LEFT JOIN teacher_profiles tp ON au.id = tp.user_id
WHERE au.raw_user_meta_data->>'role' IN ('teacher', 'TEACHER')
AND tp.user_id IS NULL
ORDER BY au.created_at DESC;

-- Step 7: Check database triggers for profile creation
SELECT 
    'DATABASE TRIGGERS' as section,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users'
AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- Step 8: Test admin function
SELECT 
    'ADMIN FUNCTION TEST' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'is_admin'
        ) THEN 'is_admin function exists'
        ELSE 'is_admin function missing'
    END as admin_function_status;

-- Step 9: Create missing teacher profiles (SAFE)
-- This will create profiles for confirmed teachers that don't have them
DO $$
DECLARE
    teacher_record RECORD;
    created_count INTEGER := 0;
BEGIN
    -- Only process confirmed users without existing profiles
    FOR teacher_record IN 
        SELECT 
            au.id,
            au.email,
            COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
            COALESCE(au.raw_user_meta_data->>'subject_expertise', 'Other') as subject_expertise,
            COALESCE((au.raw_user_meta_data->>'experience_years')::integer, 0) as experience_years
        FROM auth.users au
        LEFT JOIN teacher_profiles tp ON au.id = tp.user_id
        WHERE au.raw_user_meta_data->>'role' IN ('teacher', 'TEACHER')
        AND au.email_confirmed_at IS NOT NULL
        AND tp.user_id IS NULL
    LOOP
        INSERT INTO teacher_profiles (
            user_id,
            full_name,
            email,
            subject_expertise,
            experience_years,
            status,
            created_at,
            updated_at
        ) VALUES (
            teacher_record.id,
            teacher_record.full_name,
            teacher_record.email,
            teacher_record.subject_expertise,
            teacher_record.experience_years,
            'PENDING',
            NOW(),
            NOW()
        );
        created_count := created_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Created % teacher profiles', created_count;
END $$;

-- Step 10: Ensure required columns exist
DO $$
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE teacher_profiles ADD COLUMN status TEXT DEFAULT 'PENDING';
        RAISE NOTICE 'Added status column to teacher_profiles';
    END IF;
    
    -- Add approval_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' 
        AND column_name = 'approval_date'
    ) THEN
        ALTER TABLE teacher_profiles ADD COLUMN approval_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added approval_date column to teacher_profiles';
    END IF;
    
    -- Add approved_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' 
        AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE teacher_profiles ADD COLUMN approved_by UUID;
        RAISE NOTICE 'Added approved_by column to teacher_profiles';
    END IF;
END $$;

-- Step 11: Create/Update is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has admin role in metadata
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_user_meta_data->>'role' IN ('admin', 'ADMIN', 'superadmin', 'SUPERADMIN')
            OR email IN ('admin@edugrowthub.com', 'superadmin@edugrowthub.com')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Apply proper RLS policies for admin approval
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "admin_approval_teacher_read" ON teacher_profiles;
DROP POLICY IF EXISTS "admin_approval_teacher_update" ON teacher_profiles;
DROP POLICY IF EXISTS "admin_approval_teacher_insert" ON teacher_profiles;

-- Create new admin-friendly policies
CREATE POLICY "teacher_profiles_admin_read" ON teacher_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "teacher_profiles_admin_update" ON teacher_profiles
    FOR UPDATE USING (
        is_admin() OR user_id = auth.uid()
    ) WITH CHECK (
        is_admin() OR user_id = auth.uid()
    );

CREATE POLICY "teacher_profiles_admin_insert" ON teacher_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

-- Ensure RLS is enabled
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Step 13: Final verification
SELECT 
    'FINAL VERIFICATION' as section,
    'Teacher profiles count' as metric,
    COUNT(*) as value
FROM teacher_profiles;

SELECT 
    'FINAL VERIFICATION' as section,
    'Pending teachers for approval' as metric,
    COUNT(*) as value
FROM teacher_profiles
WHERE status = 'PENDING';

-- Step 14: Test query that admin dashboard uses
SELECT 
    'ADMIN DASHBOARD TEST QUERY' as section,
    id,
    user_id,
    full_name,
    email,
    subject_expertise,
    experience_years,
    status,
    approval_date,
    created_at
FROM teacher_profiles
WHERE status = 'PENDING'
ORDER BY created_at DESC
LIMIT 5;

SELECT 'Teacher approval diagnosis complete!' as result;
SELECT 'Check the results above to identify any issues.' as next_step;
