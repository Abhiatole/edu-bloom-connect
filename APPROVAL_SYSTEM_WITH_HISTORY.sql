-- =====================================================
-- USER APPROVAL SYSTEM WITH HISTORY TRACKING
-- =====================================================
-- Run this script in your Supabase SQL Editor to fix approval issues

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on approval_logs
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for approval_logs
CREATE POLICY "Allow authenticated users to read approval logs" ON approval_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to insert approval logs" ON approval_logs
    FOR INSERT WITH CHECK (auth.uid() = approved_by);

-- Grant permissions
GRANT SELECT, INSERT ON approval_logs TO authenticated;

-- Step 2: Ensure student_profiles table has all required columns
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;

-- Step 3: Ensure teacher_profiles table has all required columns
ALTER TABLE teacher_profiles 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;

-- Step 4: Create a function to handle approvals with logging
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
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Get user details for logging
    IF p_user_type = 'student' THEN
        SELECT email, full_name INTO user_email, user_name
        FROM student_profiles WHERE id = p_user_id;
        
        -- Update student profile
        UPDATE student_profiles 
        SET status = CASE WHEN p_action = 'approve' THEN 'APPROVED' ELSE 'REJECTED' END,
            approved_by = p_approved_by,
            approval_date = NOW()
        WHERE id = p_user_id;
        
    ELSIF p_user_type = 'teacher' THEN
        SELECT email, full_name INTO user_email, user_name
        FROM teacher_profiles WHERE id = p_user_id;
        
        -- Update teacher profile
        UPDATE teacher_profiles 
        SET status = CASE WHEN p_action = 'approve' THEN 'APPROVED' ELSE 'REJECTED' END,
            approved_by = p_approved_by,
            approval_date = NOW()
        WHERE id = p_user_id;
    END IF;
    
    -- Log the approval action
    INSERT INTO approval_logs (
        approved_user_id, 
        approved_by, 
        user_type, 
        action, 
        reason,
        user_email,
        user_name
    ) VALUES (
        p_user_id,
        p_approved_by,
        p_user_type,
        p_action || 'd',
        COALESCE(p_reason, p_action || 'd by admin'),
        user_email,
        user_name
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

-- Step 5: Create views for easy access to approval history
CREATE OR REPLACE VIEW approval_history AS
SELECT 
    al.id,
    al.approved_user_id,
    al.user_type,
    al.action,
    al.reason,
    al.user_email,
    al.user_name,
    al.created_at as approval_date,
    approver.email as approved_by_email,
    COALESCE(approver_profile.full_name, 'Admin') as approved_by_name
FROM approval_logs al
LEFT JOIN auth.users approver ON al.approved_by = approver.id
LEFT JOIN user_profiles approver_profile ON approver.id = approver_profile.user_id
ORDER BY al.created_at DESC;

-- Step 6: Create view for approved users
CREATE OR REPLACE VIEW approved_users AS
SELECT 
    'student' as user_type,
    id,
    full_name,
    email,
    status,
    approved_by,
    approval_date,
    created_at
FROM student_profiles 
WHERE status = 'APPROVED'
UNION ALL
SELECT 
    'teacher' as user_type,
    id,
    full_name,
    email,
    status,
    approved_by,
    approval_date,
    created_at
FROM teacher_profiles 
WHERE status = 'APPROVED'
ORDER BY approval_date DESC;

-- Step 7: Create view for rejected users
CREATE OR REPLACE VIEW rejected_users AS
SELECT 
    'student' as user_type,
    id,
    full_name,
    email,
    status,
    approved_by,
    approval_date,
    created_at
FROM student_profiles 
WHERE status = 'REJECTED'
UNION ALL
SELECT 
    'teacher' as user_type,
    id,
    full_name,
    email,
    status,
    approved_by,
    approval_date,
    created_at
FROM teacher_profiles 
WHERE status = 'REJECTED'
ORDER BY approval_date DESC;

-- Grant permissions on views
GRANT SELECT ON approval_history TO authenticated;
GRANT SELECT ON approved_users TO authenticated;
GRANT SELECT ON rejected_users TO authenticated;

-- Step 8: Test the setup
SELECT 'Approval system with history tracking setup completed!' as result;

-- Show current statistics
SELECT 
    'APPROVAL STATISTICS' as section,
    (SELECT COUNT(*) FROM student_profiles WHERE status = 'PENDING') as pending_students,
    (SELECT COUNT(*) FROM teacher_profiles WHERE status = 'PENDING') as pending_teachers,
    (SELECT COUNT(*) FROM student_profiles WHERE status = 'APPROVED') as approved_students,
    (SELECT COUNT(*) FROM teacher_profiles WHERE status = 'APPROVED') as approved_teachers,
    (SELECT COUNT(*) FROM student_profiles WHERE status = 'REJECTED') as rejected_students,
    (SELECT COUNT(*) FROM teacher_profiles WHERE status = 'REJECTED') as rejected_teachers,
    (SELECT COUNT(*) FROM approval_logs) as total_approval_actions;
