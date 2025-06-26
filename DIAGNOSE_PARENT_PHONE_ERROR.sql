-- DIAGNOSTIC SCRIPT - Check current database state
-- Run this in Supabase SQL editor to see what's causing the parent_phone error

-- 1. Check if student_profiles table exists and its columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'student_profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if the get_teacher_students function exists
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_teacher_students' 
    AND routine_schema = 'public';

-- 3. Check for any views that might reference parent_phone
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE view_definition LIKE '%parent_phone%' 
    AND table_schema = 'public';

-- 4. Check for any functions that reference parent_phone
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%parent_phone%' 
    AND routine_schema = 'public';

-- 5. Test if we can select from student_profiles with the correct column
SELECT 
    id, 
    enrollment_no, 
    full_name, 
    guardian_mobile,
    parent_email,
    status
FROM public.student_profiles 
LIMIT 5;
