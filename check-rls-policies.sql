-- Check RLS policies for student_profiles and teacher_profiles
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
WHERE tablename IN ('student_profiles', 'teacher_profiles')
ORDER BY tablename, policyname;

-- Check table permissions
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name IN ('student_profiles', 'teacher_profiles')
ORDER BY table_name, grantee;

-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('student_profiles', 'teacher_profiles');

-- Show sample data from student_profiles
SELECT 
    id,
    user_id,
    full_name,
    approval_date,
    created_at
FROM student_profiles
LIMIT 5;
