-- CREATE DEBUG VIEW FOR USER PROFILES
-- This view helps debug the user profiles by combining information from auth.users and profiles tables

-- First, check if the debug_user_profiles view already exists and drop it if it does
DROP VIEW IF EXISTS debug_user_profiles;

-- Create the debug view
CREATE VIEW debug_user_profiles AS
SELECT 
    u.id AS auth_user_id,
    u.email AS auth_email,
    u.raw_user_meta_data->>'role' AS user_role,
    u.created_at AS user_created_at,
    u.last_sign_in_at AS last_login,
    sp.id AS student_profile_id,
    sp.user_id AS student_user_id,
    sp.full_name AS student_name,
    sp.email AS student_email,
    sp.class_level AS student_class,
    sp.enrollment_no AS enrollment_no,
    sp.parent_email AS parent_email,
    sp.status AS student_status,
    sp.approval_date AS student_approval_date,
    tp.id AS teacher_profile_id,
    tp.user_id AS teacher_user_id,
    tp.full_name AS teacher_name,
    tp.email AS teacher_email,
    tp.subject_expertise AS subject,
    tp.experience_years AS experience,
    tp.status AS teacher_status,
    tp.approval_date AS teacher_approval_date
FROM 
    auth.users u
LEFT JOIN 
    public.student_profiles sp ON u.id = sp.user_id
LEFT JOIN 
    public.teacher_profiles tp ON u.id = tp.user_id
ORDER BY 
    u.created_at DESC;

-- Create an RLS policy for the view to allow admins to access it
DROP POLICY IF EXISTS "debug_view_access_policy" ON debug_user_profiles;
ALTER VIEW debug_user_profiles OWNER TO postgres;

-- Grant access to authenticated users
GRANT SELECT ON debug_user_profiles TO authenticated;
GRANT SELECT ON debug_user_profiles TO anon;

-- Output a success message
SELECT 'Debug view created successfully' AS result;
