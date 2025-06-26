-- IMMEDIATE FIX FOR parent_phone ERROR
-- This script fixes the column reference error by updating the function

-- Update the get_teacher_students function to use the correct column name
DROP FUNCTION IF EXISTS get_teacher_students(UUID);

CREATE OR REPLACE FUNCTION get_teacher_students(teacher_user_id UUID)
RETURNS TABLE (
    student_id UUID,
    enrollment_no TEXT,
    full_name TEXT,
    class_level INTEGER,
    parent_email TEXT,
    parent_phone TEXT,
    status TEXT,
    subject_name TEXT,
    approval_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sp.id as student_id,
        sp.enrollment_no,
        sp.full_name,
        sp.class_level,
        sp.parent_email,
        sp.guardian_mobile as parent_phone,  -- Map guardian_mobile to parent_phone
        sp.status,
        s.name as subject_name,
        sp.approval_date
    FROM public.student_profiles sp
    JOIN public.student_subjects ss ON sp.id = ss.student_id
    JOIN public.subjects s ON ss.subject_id = s.id
    JOIN public.teacher_subjects ts ON s.id = ts.subject_id
    JOIN public.teacher_profiles tp ON ts.teacher_id = tp.id
    WHERE tp.user_id = teacher_user_id
    ORDER BY sp.created_at DESC;
END $$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_teacher_students(UUID) TO authenticated;
