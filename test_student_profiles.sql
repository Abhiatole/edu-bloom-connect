-- Simple test to check current student_profiles table state
-- Run this to see current records and permissions

-- Check existing student profiles
SELECT 
    id,
    user_id,
    enrollment_no,
    class_level,
    status,
    created_at
FROM public.student_profiles 
LIMIT 5;

-- Check RLS policies on student_profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'student_profiles';

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'student_profiles';

-- Try to count total records
SELECT COUNT(*) as total_student_profiles FROM public.student_profiles;
