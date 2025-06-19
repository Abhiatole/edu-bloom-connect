-- =====================================================
-- USER APPROVAL SYSTEM - SIMPLIFIED SETUP
-- =====================================================
-- Since approval_logs table already exists, this script focuses on
-- views, policies, and functions only

-- Step 1: Check that approval_logs table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_logs' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'approval_logs table does not exist. Please create it first.';
    END IF;
    RAISE NOTICE 'approval_logs table confirmed to exist.';
END $$;

-- Step 2: Ensure RLS is enabled and set up policies for approval_logs
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow authenticated users to read approval logs" ON approval_logs;
    DROP POLICY IF EXISTS "Allow authenticated users to insert approval logs" ON approval_logs;
    DROP POLICY IF EXISTS "approval_logs_select_policy" ON approval_logs;
    DROP POLICY IF EXISTS "approval_logs_insert_policy" ON approval_logs;
    RAISE NOTICE 'Existing policies dropped successfully.';
END $$;

-- Create RLS policies for approval_logs
CREATE POLICY "approval_logs_select_policy" ON approval_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "approval_logs_insert_policy" ON approval_logs
    FOR INSERT WITH CHECK (auth.uid() = approved_by);

-- Grant permissions
GRANT SELECT, INSERT ON approval_logs TO authenticated;
GRANT SELECT ON approval_logs TO anon;

-- Step 3: Check what columns exist in teacher_profiles and create views accordingly
DO $$
DECLARE
    has_employee_id BOOLEAN;
    teacher_identifier_expr TEXT;
BEGIN
    -- Check if employee_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' 
        AND column_name = 'employee_id'
        AND table_schema = 'public'
    ) INTO has_employee_id;
    
    -- Set the identifier expression based on available columns
    IF has_employee_id THEN
        teacher_identifier_expr := 'COALESCE(employee_id, id::text, ''unknown'')';
        RAISE NOTICE 'employee_id column found in teacher_profiles.';
    ELSE
        teacher_identifier_expr := 'COALESCE(id::text, ''unknown'')';
        RAISE NOTICE 'employee_id column NOT found in teacher_profiles, using id instead.';
    END IF;
    
    -- Drop existing views first
    DROP VIEW IF EXISTS user_profiles_combined;
    DROP VIEW IF EXISTS all_users_view;
    DROP VIEW IF EXISTS approval_history;
    DROP VIEW IF EXISTS approved_users;
    DROP VIEW IF EXISTS pending_users;
    
    RAISE NOTICE 'Creating views with dynamic column detection...';
    
    -- Create the combined view with dynamic identifier
    EXECUTE format('
        CREATE OR REPLACE VIEW all_users_view AS
        SELECT 
            id,
            user_id,
            ''STUDENT'' as role,
            COALESCE(id::text, ''unknown'') as identifier,
            class_level,
            CASE WHEN approval_date IS NOT NULL THEN ''APPROVED'' ELSE ''PENDING'' END as status,
            NULL as approved_by,
            approval_date,
            created_at,
            updated_at,
            ''student'' as user_type
        FROM student_profiles
        UNION ALL
        SELECT 
            id,
            user_id,
            ''TEACHER'' as role,
            %s as identifier,
            NULL as class_level,
            CASE WHEN approval_date IS NOT NULL THEN ''APPROVED'' ELSE ''PENDING'' END as status,
            NULL as approved_by,
            approval_date,
            created_at,
            updated_at,
            ''teacher'' as user_type
        FROM teacher_profiles
        ORDER BY created_at DESC;
    ', teacher_identifier_expr);
    
    -- Create approved users view
    EXECUTE format('
        CREATE OR REPLACE VIEW approved_users AS
        SELECT 
            ''student'' as user_type,
            id,
            user_id,
            COALESCE(id::text, ''unknown'') as identifier,
            class_level,
            NULL as approved_by,
            approval_date,
            created_at
        FROM student_profiles 
        WHERE approval_date IS NOT NULL
        UNION ALL
        SELECT 
            ''teacher'' as user_type,
            id,
            user_id,
            %s as identifier,
            NULL as class_level,
            NULL as approved_by,
            approval_date,
            created_at
        FROM teacher_profiles 
        WHERE approval_date IS NOT NULL
        ORDER BY approval_date DESC;
    ', teacher_identifier_expr);
    
    -- Create pending users view
    EXECUTE format('
        CREATE OR REPLACE VIEW pending_users AS
        SELECT 
            ''student'' as user_type,
            id,
            user_id,
            COALESCE(id::text, ''unknown'') as identifier,
            class_level,
            created_at
        FROM student_profiles 
        WHERE approval_date IS NULL
        UNION ALL
        SELECT 
            ''teacher'' as user_type,
            id,
            user_id,
            %s as identifier,
            NULL as class_level,
            created_at
        FROM teacher_profiles 
        WHERE approval_date IS NULL
        ORDER BY created_at DESC;
    ', teacher_identifier_expr);
    
    RAISE NOTICE 'All views created successfully with dynamic column detection.';
END $$;

-- Step 4: Create approval history view (this doesn't need dynamic columns)
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

-- Grant permissions on views
GRANT SELECT ON all_users_view TO authenticated;
GRANT SELECT ON all_users_view TO anon;
GRANT SELECT ON approval_history TO authenticated;
GRANT SELECT ON approved_users TO authenticated;
GRANT SELECT ON pending_users TO authenticated;

-- Step 5: Create function with column checking
DROP FUNCTION IF EXISTS handle_user_approval(UUID, TEXT, TEXT, UUID, TEXT);

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
    has_employee_id BOOLEAN;
BEGIN    
    -- Check if employee_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' 
        AND column_name = 'employee_id'
        AND table_schema = 'public'
    ) INTO has_employee_id;
    
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
          
        -- Update student profile
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
        -- Get identifier based on available columns
        IF has_employee_id THEN
            EXECUTE format('SELECT COALESCE(employee_id, id::text) FROM teacher_profiles WHERE user_id = $1')
            INTO user_identifier USING p_user_id;
        ELSE
            SELECT id::text INTO user_identifier
            FROM teacher_profiles WHERE user_id = p_user_id;
        END IF;
        
        user_name := 'Teacher ' || COALESCE(user_identifier, 'Unknown');
          
        -- Update teacher profile
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

-- Step 6: Final verification and statistics
SELECT 'Approval system setup completed successfully!' as result;

-- Show current statistics
SELECT 
    'APPROVAL STATISTICS' as section,
    (SELECT COUNT(*) FROM student_profiles WHERE approval_date IS NULL) as pending_students,
    (SELECT COUNT(*) FROM teacher_profiles WHERE approval_date IS NULL) as pending_teachers,
    (SELECT COUNT(*) FROM student_profiles WHERE approval_date IS NOT NULL) as approved_students,
    (SELECT COUNT(*) FROM teacher_profiles WHERE approval_date IS NOT NULL) as approved_teachers,
    (SELECT COUNT(*) FROM approval_logs) as total_approval_actions;

-- System verification
SELECT 
    'SYSTEM VERIFICATION' as section,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'approval_logs' AND table_schema = 'public') as approval_logs_table_exists,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'all_users_view' AND table_schema = 'public') as all_users_view_exists,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'pending_users' AND table_schema = 'public') as pending_users_view_exists,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'handle_user_approval' AND routine_schema = 'public') as approval_function_exists;

-- Show available columns in teacher_profiles for reference
SELECT 
    'TEACHER_PROFILES COLUMNS' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as available_columns
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
AND table_schema = 'public';
