-- ALTERNATIVE FIX: Create profiles using database functions
-- This bypasses RLS policies during registration

-- Create a secure function to handle teacher registration
CREATE OR REPLACE FUNCTION register_teacher_profile(
    p_user_id UUID,
    p_full_name TEXT,
    p_email TEXT,
    p_subject_expertise TEXT,
    p_experience_years INTEGER DEFAULT 0
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    -- Insert teacher profile
    INSERT INTO teacher_profiles (
        user_id,
        full_name,
        email,
        subject_expertise,
        experience_years,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_full_name,
        p_email,
        p_subject_expertise::subject_type,
        p_experience_years,
        'PENDING'::approval_status,
        NOW(),
        NOW()
    );
    
    result := json_build_object(
        'success', true,
        'message', 'Teacher profile created successfully',
        'user_id', p_user_id
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', 'Failed to create teacher profile',
            'error', SQLERRM
        );
        RETURN result;
END;
$$;

-- Create a secure function to handle student registration
CREATE OR REPLACE FUNCTION register_student_profile(
    p_user_id UUID,
    p_full_name TEXT,
    p_email TEXT,
    p_class_level INTEGER,
    p_guardian_name TEXT DEFAULT NULL,
    p_guardian_mobile TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
    enrollment_no TEXT;
BEGIN
    -- Generate enrollment number
    enrollment_no := 'ENR' || EXTRACT(EPOCH FROM NOW())::BIGINT;
    
    -- Insert student profile
    INSERT INTO student_profiles (
        user_id,
        full_name,
        email,
        enrollment_no,
        class_level,
        guardian_name,
        guardian_mobile,
        status,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_full_name,
        p_email,
        enrollment_no,
        p_class_level,
        p_guardian_name,
        p_guardian_mobile,
        'PENDING'::approval_status,
        NOW(),
        NOW()
    );
    
    result := json_build_object(
        'success', true,
        'message', 'Student profile created successfully',
        'user_id', p_user_id,
        'enrollment_no', enrollment_no
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', 'Failed to create student profile',
            'error', SQLERRM
        );
        RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION register_teacher_profile TO authenticated;
GRANT EXECUTE ON FUNCTION register_student_profile TO authenticated;
