-- DATABASE_SETUP_AND_STATUS.sql
-- Complete database setup and status check for Edu Bloom Connect
-- Run this in Supabase SQL Editor

-- ============================================================================
-- SECTION 1: CREATE MISSING TABLES (if needed)
-- ============================================================================

-- Create user_role enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER', 'ADMIN', 'SUPER_ADMIN', 'PARENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create unified user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    approval_status approval_status DEFAULT 'PENDING',
    class_level INTEGER,
    guardian_name VARCHAR(100),
    guardian_mobile VARCHAR(15),
    subject_expertise subject_type,
    experience_years INTEGER,
    profile_picture TEXT,
    approved_by UUID REFERENCES auth.users(id),
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super Admins can manage all" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON user_profiles;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Super Admins can manage all" ON user_profiles
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'SUPER_ADMIN' 
            AND approval_status = 'APPROVED'
        )
    );

CREATE POLICY "Allow profile creation" ON user_profiles
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- SECTION 2: SYSTEM STATUS CHECK
-- ============================================================================

SELECT '=== EDU BLOOM CONNECT - SYSTEM STATUS ===' as header;

-- Check table existence
SELECT 
    'TABLES STATUS:' as section,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles') 
         THEN '✅ user_profiles exists' 
         ELSE '❌ user_profiles missing' END as user_profiles_status,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'student_profiles') 
         THEN '✅ student_profiles exists' 
         ELSE '❌ student_profiles missing' END as student_profiles_status,
    CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'teacher_profiles') 
         THEN '✅ teacher_profiles exists' 
         ELSE '❌ teacher_profiles missing' END as teacher_profiles_status;

-- Admin status check
SELECT 'ADMIN STATUS:' as section;
SELECT 
    COALESCE(COUNT(*), 0) as total_admins,
    COALESCE(COUNT(*) FILTER (WHERE approval_status = 'APPROVED'), 0) as approved_admins,
    CASE 
        WHEN EXISTS (SELECT 1 FROM user_profiles WHERE role = 'SUPER_ADMIN' AND approval_status = 'APPROVED') 
        THEN '✅ System Ready - Admin exists'
        ELSE '❌ No approved admin - Create admin needed'
    END as system_status
FROM user_profiles WHERE role IN ('ADMIN', 'SUPER_ADMIN');

-- User summary by role and status
SELECT 'USER SUMMARY:' as section;
SELECT 
    role,
    approval_status,
    COUNT(*) as count
FROM user_profiles
GROUP BY role, approval_status
ORDER BY role, approval_status;

-- ============================================================================
-- SECTION 3: LOGIN INFORMATION
-- ============================================================================

SELECT 'READY-TO-LOGIN ACCOUNTS:' as section;

-- Show all users who can login (email confirmed + approved)
SELECT 
    u.email as login_email,
    COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', 'Unknown') as name,
    COALESCE(p.role::text, u.raw_user_meta_data->>'role', 'No Role') as role,
    CASE 
        WHEN p.role = 'SUPER_ADMIN' OR p.role = 'ADMIN' THEN 'Admin Dashboard'
        WHEN p.role = 'TEACHER' THEN 'Teacher Dashboard'
        WHEN p.role = 'STUDENT' THEN 'Student Dashboard'
        ELSE 'Login Issues Possible'
    END as dashboard_access
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.email_confirmed_at IS NOT NULL 
    AND (p.approval_status = 'APPROVED' OR p.role IN ('ADMIN', 'SUPER_ADMIN'))
ORDER BY p.role DESC NULLS LAST, u.created_at;

-- Show pending users who need approval
SELECT 'PENDING APPROVAL:' as section;
SELECT 
    u.email,
    p.full_name,
    p.role,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    p.created_at
FROM user_profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.approval_status = 'PENDING'
ORDER BY p.created_at;

-- ============================================================================
-- SECTION 4: SYSTEM ACCESS URLS
-- ============================================================================

SELECT 'SYSTEM ACCESS:' as section;
SELECT 
    'Main App' as service,
    'http://localhost:8082' as url,
    'Main application' as description
UNION ALL
SELECT 'Login', 'http://localhost:8082/login', 'User login page'
UNION ALL
SELECT 'Admin Setup', 'http://localhost:8082/setup-admin', 'Create admin accounts'
UNION ALL
SELECT 'Quick Approvals', 'http://localhost:8082/quick-approvals', 'Bulk approve users (admin only)'
UNION ALL
SELECT 'User Management', 'http://localhost:8082/admin/approvals', 'Individual approvals (admin only)';

-- ============================================================================
-- SECTION 5: QUICK ACTIONS
-- ============================================================================

-- Function to approve all pending users
CREATE OR REPLACE FUNCTION approve_all_pending_users()
RETURNS TEXT AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE user_profiles 
    SET approval_status = 'APPROVED', 
        approval_date = NOW()
    WHERE approval_status = 'PENDING';
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RETURN 'Approved ' || updated_count || ' pending users';
END;
$$ LANGUAGE plpgsql;

-- Function to create a super admin
CREATE OR REPLACE FUNCTION create_super_admin(
    admin_email TEXT,
    admin_password TEXT,
    admin_name TEXT
)
RETURNS TEXT AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- This would typically be done through Supabase Auth API
    -- For now, just return instructions
    RETURN 'Use the web interface at /setup-admin to create: ' || admin_email;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 6: RECOMMENDATIONS
-- ============================================================================

SELECT 'NEXT STEPS:' as recommendations;

DO $$
DECLARE
    admin_count INTEGER := 0;
    pending_count INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO admin_count 
    FROM user_profiles 
    WHERE role IN ('ADMIN', 'SUPER_ADMIN') AND approval_status = 'APPROVED';
    
    SELECT COUNT(*) INTO pending_count
    FROM user_profiles 
    WHERE approval_status = 'PENDING';
    
    IF admin_count = 0 THEN
        RAISE NOTICE '1. 🚨 CREATE ADMIN: Visit http://localhost:8082/setup-admin';
    ELSE
        RAISE NOTICE '1. ✅ ADMIN READY: % admin(s) available', admin_count;
    END IF;
    
    IF pending_count > 0 THEN
        RAISE NOTICE '2. ⏳ APPROVE USERS: Run SELECT approve_all_pending_users(); or use web interface';
    ELSE
        RAISE NOTICE '2. ✅ NO PENDING: All users approved';
    END IF;
    
    RAISE NOTICE '3. 🔗 LOGIN: Visit http://localhost:8082/login with approved credentials';
END $$;

SELECT 'Database setup and status check completed!' as result;
