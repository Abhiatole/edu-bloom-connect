-- =====================================================
-- USER APPROVAL SYSTEM SETUP WITH HISTORY TRACKING - FIXED VERSION
-- =====================================================
-- Run this script in your Supabase SQL Editor to fix approval issues
-- This version handles existing policies and objects safely

-- Step 1: Create approval_logs table for history tracking
CREATE TABLE IF NOT EXISTS approval_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approved_user_id UUID NOT NULL,
    approved_by UUID REFERENCES auth.users(id) NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'student' or 'teacher'
    action VARCHAR(20) NOT NULL, -- 'approved' or 'rejected'
    reason TEXT,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    approved_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on approval_logs
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Drop approval_logs policies if they exist
    DROP POLICY IF EXISTS "Allow authenticated users to read approval logs" ON approval_logs;
    DROP POLICY IF EXISTS "Allow authenticated users to insert approval logs" ON approval_logs;
    DROP POLICY IF EXISTS "approval_logs_select_policy" ON approval_logs;
    DROP POLICY IF EXISTS "approval_logs_insert_policy" ON approval_logs;
END $$;

-- Create RLS policies for approval_logs
CREATE POLICY "approval_logs_select_policy" ON approval_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "approval_logs_insert_policy" ON approval_logs
    FOR INSERT WITH CHECK (auth.uid() = approved_by);

-- Grant permissions
GRANT SELECT, INSERT ON approval_logs TO authenticated;
GRANT SELECT ON approval_logs TO anon;

-- Step 2: Drop any existing views first to avoid conflicts
DROP VIEW IF EXISTS user_profiles_combined;
DROP VIEW IF EXISTS all_users_view;
DROP VIEW IF EXISTS approval_history;
DROP VIEW IF EXISTS approved_users;
DROP VIEW IF EXISTS pending_users;

-- Create a combined view with only the basic columns that definitely exist
CREATE OR REPLACE VIEW all_users_view AS
SELECT 
    id,
    user_id,
    'STUDENT' as role,
    COALESCE(id::text, 'unknown') as identifier,
    class_level,
    CASE WHEN approval_date IS NOT NULL THEN 'APPROVED' ELSE 'PENDING' END as status,
    NULL as approved_by,  -- Column doesn't exist
    approval_date,
    created_at,
    updated_at,
    'student' as user_type
FROM student_profiles
UNION ALL
SELECT 
    id,
    user_id,
    'TEACHER' as role,
    COALESCE(id::text, 'unknown') as identifier,  -- Remove employee_id reference
    NULL as class_level,
    CASE WHEN approval_date IS NOT NULL THEN 'APPROVED' ELSE 'PENDING' END as status,
    NULL as approved_by,  -- Column doesn't exist
    approval_date,
    created_at,
    updated_at,
    'teacher' as user_type
FROM teacher_profiles
ORDER BY created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON all_users_view TO authenticated;
GRANT SELECT ON all_users_view TO anon;

-- Step 3: Create views for easy access to approval history
CREATE OR REPLACE VIEW approval_history AS
SELECT 
    al.id,
    al.approved_user_id,
    al.user_type,
    al.action,
    al.reason,
    al.user_email,
    al.user_name,
    al.approved_by_name,
    al.created_at as approval_date
FROM approval_logs al
ORDER BY al.created_at DESC;

-- Step 4: Create view for approved users (based on approval_date being set)
CREATE OR REPLACE VIEW approved_users AS
SELECT 
    'student' as user_type,
    id,
    user_id,
    COALESCE(id::text, 'unknown') as identifier,
    class_level,
    NULL as approved_by,  -- Column doesn't exist
    approval_date,
    created_at
FROM student_profiles 
WHERE approval_date IS NOT NULL
UNION ALL
SELECT 
    'teacher' as user_type,
    id,
    user_id,
    COALESCE(id::text, 'unknown') as identifier,  -- Remove employee_id reference
    NULL as class_level,
    NULL as approved_by,  -- Column doesn't exist
    approval_date,
    created_at
FROM teacher_profiles 
WHERE approval_date IS NOT NULL
ORDER BY approval_date DESC;

-- Step 5: Create view for pending users (approval_date is null)
CREATE OR REPLACE VIEW pending_users AS
SELECT 
    'student' as user_type,
    id,
    user_id,
    COALESCE(id::text, 'unknown') as identifier,
    class_level,
    created_at
FROM student_profiles 
WHERE approval_date IS NULL
UNION ALL
SELECT 
    'teacher' as user_type,
    id,
    user_id,
    COALESCE(id::text, 'unknown') as identifier,  -- Remove employee_id reference
    NULL as class_level,
    created_at
FROM teacher_profiles 
WHERE approval_date IS NULL
ORDER BY created_at DESC;

-- Grant permissions on views
GRANT SELECT ON approval_history TO authenticated;
GRANT SELECT ON approved_users TO authenticated;
GRANT SELECT ON pending_users TO authenticated;

-- Step 6: Drop existing function if it exists and create new one
DROP FUNCTION IF EXISTS handle_user_approval(UUID, TEXT, TEXT, UUID, TEXT);

-- Create a function to handle approvals with logging
CREATE OR REPLACE FUNCTION handle_user_approval(
    p_user_id UUID,
    p_user_type TEXT,
    p_action TEXT,
    p_approved_by UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_identifier TEXT;
    user_name TEXT;
    approver_name TEXT;
BEGIN    
    -- Get approver name from all_users_view or set default
    SELECT identifier INTO approver_name
    FROM all_users_view WHERE user_id = p_approved_by LIMIT 1;
    
    IF approver_name IS NULL THEN
        approver_name := 'Admin';
    END IF;
      
    -- Get user details for logging and update the appropriate table
    IF p_user_type = 'student' THEN
        SELECT id::text INTO user_identifier
        FROM student_profiles WHERE user_id = p_user_id;
        
        user_name := 'Student ' || COALESCE(user_identifier, 'Unknown');
          
        -- Update student profile (only approval_date column exists)
        IF p_action = 'approve' THEN
            UPDATE student_profiles 
            SET approval_date = NOW(),
                updated_at = NOW()
            WHERE user_id = p_user_id;
        ELSE
            UPDATE student_profiles 
            SET approval_date = NULL,
                updated_at = NOW()
            WHERE user_id = p_user_id;
        END IF;
          ELSIF p_user_type = 'teacher' THEN
        SELECT COALESCE(id::text) INTO user_identifier  -- Remove employee_id reference
        FROM teacher_profiles WHERE user_id = p_user_id;
        
        user_name := 'Teacher ' || COALESCE(user_identifier, 'Unknown');
          
        -- Update teacher profile (only approval_date column exists)
        IF p_action = 'approve' THEN
            UPDATE teacher_profiles 
            SET approval_date = NOW(),
                updated_at = NOW()
            WHERE user_id = p_user_id;
        ELSE
            UPDATE teacher_profiles 
            SET approval_date = NULL,
                updated_at = NOW()
            WHERE user_id = p_user_id;
        END IF;
    END IF;
    
    -- Log the approval action
    INSERT INTO approval_logs (
        approved_user_id, 
        approved_by, 
        user_type, 
        action, 
        reason,
        user_email,
        user_name,
        approved_by_name
    ) VALUES (
        p_user_id,
        p_approved_by,
        p_user_type,
        p_action || 'd',
        COALESCE(p_reason, p_action || 'd by admin'),
        'Email not available',
        user_name,
        approver_name
    );
    
    result := json_build_object(
        'success', true,
        'action', p_action,
        'user_type', p_user_type,
        'user_name', user_name
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION handle_user_approval TO authenticated;

-- Step 7: Test the setup
SELECT 'Approval system with history tracking setup completed successfully!' as result;

-- Show current statistics (using approval_date instead of non-existent columns)
SELECT 
    'APPROVAL STATISTICS' as section,
    (SELECT COUNT(*) FROM student_profiles WHERE approval_date IS NULL) as pending_students,
    (SELECT COUNT(*) FROM teacher_profiles WHERE approval_date IS NULL) as pending_teachers,
    (SELECT COUNT(*) FROM student_profiles WHERE approval_date IS NOT NULL) as approved_students,
    (SELECT COUNT(*) FROM teacher_profiles WHERE approval_date IS NOT NULL) as approved_teachers,
    (SELECT COUNT(*) FROM approval_logs) as total_approval_actions;

-- Final verification - show that all components are working
SELECT 
    'SYSTEM VERIFICATION' as section,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'approval_logs') as approval_logs_table_exists,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'all_users_view') as all_users_view_exists,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'pending_users') as pending_users_view_exists,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'handle_user_approval') as approval_function_exists;
