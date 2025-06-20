-- COMPREHENSIVE TEST FOR EMAIL CONFIRMATION AND PROFILE CREATION
-- This script tests the complete flow from email confirmation to profile creation

-- First, let's check the current state
SELECT 
    'CURRENT STATE CHECK:' as check_type,
    'Users' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_count
FROM auth.users
WHERE raw_user_meta_data ? 'role'

UNION ALL

SELECT 
    'CURRENT STATE CHECK:' as check_type,
    'Student Profiles' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count
FROM student_profiles

UNION ALL

SELECT 
    'CURRENT STATE CHECK:' as check_type,
    'Teacher Profiles' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_count
FROM teacher_profiles;

-- Check for users without profiles
SELECT 
    'USERS WITHOUT PROFILES:' as check_type,
    au.email,
    au.raw_user_meta_data->>'role' as role,
    CASE WHEN au.email_confirmed_at IS NOT NULL THEN 'CONFIRMED' ELSE 'UNCONFIRMED' END as email_status,
    CASE 
        WHEN au.raw_user_meta_data->>'role' = 'student' AND sp.user_id IS NULL THEN 'MISSING_STUDENT_PROFILE'
        WHEN au.raw_user_meta_data->>'role' = 'teacher' AND tp.user_id IS NULL THEN 'MISSING_TEACHER_PROFILE'
        ELSE 'HAS_PROFILE'
    END as profile_status
FROM auth.users au
LEFT JOIN student_profiles sp ON au.id = sp.user_id AND au.raw_user_meta_data->>'role' = 'student'
LEFT JOIN teacher_profiles tp ON au.id = tp.user_id AND au.raw_user_meta_data->>'role' = 'teacher'
WHERE au.raw_user_meta_data ? 'role'
AND (
    (au.raw_user_meta_data->>'role' = 'student' AND sp.user_id IS NULL) OR
    (au.raw_user_meta_data->>'role' = 'teacher' AND tp.user_id IS NULL)
);

-- Check enrollment numbers
SELECT 
    'ENROLLMENT NUMBERS:' as check_type,
    COUNT(*) as total_students,
    COUNT(CASE WHEN enrollment_no IS NOT NULL AND enrollment_no != '' THEN 1 END) as with_enrollment,
    COUNT(CASE WHEN enrollment_no IS NULL OR enrollment_no = '' THEN 1 END) as without_enrollment
FROM student_profiles;

-- Sample student profiles to verify structure
SELECT 
    'SAMPLE STUDENT PROFILES:' as check_type,
    sp.enrollment_no,
    sp.full_name,
    sp.email,
    sp.class_level,
    sp.guardian_name,
    sp.guardian_mobile,
    sp.status,
    sp.created_at
FROM student_profiles sp
ORDER BY sp.created_at DESC
LIMIT 5;

-- Sample teacher profiles to verify structure
SELECT 
    'SAMPLE TEACHER PROFILES:' as check_type,
    tp.full_name,
    tp.email,
    tp.subject_expertise,
    tp.experience_years,
    tp.status,
    tp.created_at
FROM teacher_profiles tp
ORDER BY tp.created_at DESC
LIMIT 5;
