-- APPROVE ALL PENDING USERS - Quick Bulk Approval
-- Since all users are now showing as PENDING, let's approve them

-- ═══════════════════════════════════════════════════════════════
-- STEP 1: VIEW ALL PENDING USERS
-- ═══════════════════════════════════════════════════════════════

-- Check current pending status
SELECT 'STUDENTS' as user_type, COUNT(*) as pending_count
FROM student_profiles WHERE status = 'PENDING'
UNION ALL
SELECT 'TEACHERS' as user_type, COUNT(*) as pending_count  
FROM teacher_profiles WHERE status = 'PENDING'
UNION ALL
SELECT 'TOTAL PENDING' as user_type, 
       (SELECT COUNT(*) FROM student_profiles WHERE status = 'PENDING') + 
       (SELECT COUNT(*) FROM teacher_profiles WHERE status = 'PENDING') as pending_count;

-- View pending users details
SELECT 
    'STUDENT' as user_type,
    sp.full_name,
    sp.email,
    sp.class_level,
    sp.status,
    sp.created_at
FROM student_profiles sp
WHERE sp.status = 'PENDING'

UNION ALL

SELECT 
    'TEACHER' as user_type,
    tp.full_name,
    tp.email,
    tp.subject_expertise::text as class_level,
    tp.status,
    tp.created_at
FROM teacher_profiles tp
WHERE tp.status = 'PENDING'

ORDER BY created_at DESC;

-- ═══════════════════════════════════════════════════════════════
-- STEP 2: BULK APPROVE ALL PENDING USERS
-- ═══════════════════════════════════════════════════════════════

-- Get admin user ID (update the email to match your admin)
-- Replace 'admin@edugrowhub.com' with your actual admin email
DO $$
DECLARE
    admin_user_id uuid;
    student_count int;
    teacher_count int;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@edugrowhub.com' -- ⚠️ CHANGE TO YOUR ADMIN EMAIL
    LIMIT 1;
    
    -- If no admin found, use a placeholder (you can update this later)
    IF admin_user_id IS NULL THEN
        admin_user_id := gen_random_uuid();
        RAISE NOTICE 'Warning: Admin user not found, using placeholder ID: %', admin_user_id;
    END IF;
    
    -- Count pending users before approval
    SELECT COUNT(*) INTO student_count FROM student_profiles WHERE status = 'PENDING';
    SELECT COUNT(*) INTO teacher_count FROM teacher_profiles WHERE status = 'PENDING';
    
    -- Approve all pending students
    UPDATE student_profiles 
    SET 
        status = 'APPROVED',
        approval_date = NOW(),
        approved_by = admin_user_id
    WHERE status = 'PENDING';
    
    -- Approve all pending teachers
    UPDATE teacher_profiles 
    SET 
        status = 'APPROVED', 
        approval_date = NOW(),
        approved_by = admin_user_id
    WHERE status = 'PENDING';
    
    -- Show results
    RAISE NOTICE '✅ BULK APPROVAL COMPLETE!';
    RAISE NOTICE 'Students approved: %', student_count;
    RAISE NOTICE 'Teachers approved: %', teacher_count;
    RAISE NOTICE 'Total users approved: %', student_count + teacher_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 All users can now login and access their dashboards!';
    
END $$;

-- ═══════════════════════════════════════════════════════════════
-- STEP 3: VERIFY ALL APPROVALS
-- ═══════════════════════════════════════════════════════════════

-- Check final status
SELECT 
    'VERIFICATION' as check_type,
    'STUDENTS' as user_type,
    status,
    COUNT(*) as count
FROM student_profiles 
GROUP BY status

UNION ALL

SELECT 
    'VERIFICATION' as check_type,
    'TEACHERS' as user_type,
    status,
    COUNT(*) as count
FROM teacher_profiles 
GROUP BY status

ORDER BY user_type, status;

-- Show approved users
SELECT 
    'APPROVED USERS' as result_type,
    'STUDENT' as user_type,
    sp.full_name,
    sp.email,
    sp.status,
    sp.approval_date
FROM student_profiles sp
WHERE sp.status = 'APPROVED'

UNION ALL

SELECT 
    'APPROVED USERS' as result_type,
    'TEACHER' as user_type,
    tp.full_name,
    tp.email,
    tp.status,
    tp.approval_date
FROM teacher_profiles tp
WHERE tp.status = 'APPROVED'

ORDER BY approval_date DESC;

-- ═══════════════════════════════════════════════════════════════
-- STEP 4: OPTIONAL - INDIVIDUAL APPROVAL COMMANDS
-- ═══════════════════════════════════════════════════════════════

-- If you prefer to approve users individually, use these templates:

-- Approve specific student by email:
-- UPDATE student_profiles SET status = 'APPROVED', approval_date = NOW() WHERE email = 'student@example.com';

-- Approve specific teacher by email:
-- UPDATE teacher_profiles SET status = 'APPROVED', approval_date = NOW() WHERE email = 'teacher@example.com';

-- Reject specific user (if needed):
-- UPDATE student_profiles SET status = 'REJECTED', approval_date = NOW() WHERE email = 'student@example.com';
-- UPDATE teacher_profiles SET status = 'REJECTED', approval_date = NOW() WHERE email = 'teacher@example.com';
