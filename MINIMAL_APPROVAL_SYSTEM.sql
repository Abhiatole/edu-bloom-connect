-- =====================================================
-- MINIMAL WORKING APPROVAL SYSTEM
-- =====================================================
-- This script only creates what's absolutely necessary and uses minimal column references

-- Step 1: Create approval_logs table for history tracking
CREATE TABLE IF NOT EXISTS approval_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approved_user_id UUID NOT NULL,
    approved_by UUID REFERENCES auth.users(id) NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- 'student' or 'teacher'
    action VARCHAR(20) NOT NULL, -- 'approved' or 'rejected'
    reason TEXT,
    user_name VARCHAR(255),
    approved_by_name VARCHAR(255),
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
GRANT SELECT ON approval_logs TO anon;

-- Step 2: Create a minimal view for approval history
CREATE OR REPLACE VIEW approval_history AS
SELECT 
    al.id,
    al.approved_user_id,
    al.user_type,
    al.action,
    al.reason,
    al.user_name,
    al.approved_by_name,
    al.created_at as approval_date
FROM approval_logs al
ORDER BY al.created_at DESC;

-- Grant permissions on the view
GRANT SELECT ON approval_history TO authenticated;

-- Step 3: Create a simple function for approval processing
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
    user_name TEXT;
BEGIN
    -- Set basic user name
    user_name := p_user_type || ' ' || p_user_id::text;
    
    -- Update the appropriate table based on user role
    IF p_user_type = 'student' THEN
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
        user_name,
        approved_by_name
    ) VALUES (
        p_user_id,
        p_approved_by,
        p_user_type,
        p_action || 'd',
        COALESCE(p_reason, p_action || 'd by admin'),
        user_name,
        'Admin'
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

-- Step 4: Show what we've created
SELECT 'Minimal approval system setup completed!' as result;

-- Show current statistics using only basic columns
SELECT 
    'APPROVAL STATISTICS' as section,
    (SELECT COUNT(*) FROM student_profiles WHERE approval_date IS NULL) as pending_students,
    (SELECT COUNT(*) FROM teacher_profiles WHERE approval_date IS NULL) as pending_teachers,
    (SELECT COUNT(*) FROM student_profiles WHERE approval_date IS NOT NULL) as approved_students,
    (SELECT COUNT(*) FROM teacher_profiles WHERE approval_date IS NOT NULL) as approved_teachers,
    (SELECT COUNT(*) FROM approval_logs) as total_approval_actions;
