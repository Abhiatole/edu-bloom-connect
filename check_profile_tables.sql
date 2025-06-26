-- Check existing table structures to create compatible RLS policies
-- Run this to understand your current database schema

-- Check teacher_profiles table structure
SELECT 
    'TEACHER_PROFILES_COLUMNS' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'teacher_profiles'
ORDER BY ordinal_position;

-- Check student_profiles table structure  
SELECT 
    'STUDENT_PROFILES_COLUMNS' as table_info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'student_profiles'
ORDER BY ordinal_position;

-- Check if these tables exist at all
SELECT 
    'TABLE_EXISTENCE' as check_type,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    SELECT 'teacher_profiles' as expected_table
    UNION SELECT 'student_profiles'
) expected
LEFT JOIN information_schema.tables t ON t.table_name = expected.expected_table 
    AND t.table_schema = 'public'
ORDER BY expected.expected_table;

-- Sample data check
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_profiles') THEN
        RAISE NOTICE 'Teacher profiles count: %', (SELECT COUNT(*) FROM public.teacher_profiles);
    ELSE
        RAISE NOTICE 'Teacher profiles table does not exist';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_profiles') THEN
        RAISE NOTICE 'Student profiles count: %', (SELECT COUNT(*) FROM public.student_profiles);
    ELSE
        RAISE NOTICE 'Student profiles table does not exist';
    END IF;
END $$;
