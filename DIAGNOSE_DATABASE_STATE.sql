-- DIAGNOSTIC: Check Current Database State
-- Run this in Supabase SQL Editor to diagnose registration issues

-- 1. Check if required tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('user_profiles', 'student_profiles', 'teacher_profiles', 'admin_profiles')
ORDER BY table_name;

-- 2. Check user_profiles structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check student_profiles structure  
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check teacher_profiles structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check for foreign key constraints
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'f'
    AND (conrelid::regclass::text LIKE '%_profiles' OR confrelid::regclass::text LIKE '%_profiles')
ORDER BY table_name;

-- 6. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename LIKE '%_profiles';

-- 7. Check for triggers on auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
    AND event_object_schema = 'auth';

-- 8. Test user_profiles table accessibility
SELECT COUNT(*) as user_profiles_count FROM user_profiles;
SELECT COUNT(*) as student_profiles_count FROM student_profiles;
SELECT COUNT(*) as teacher_profiles_count FROM teacher_profiles;
