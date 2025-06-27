-- Complete Student Approval System Database Schema
-- This script sets up the complete approval workflow for both Admin and Teacher dashboards

-- 1. Ensure student_profiles has all required columns for approval
DO $$
BEGIN
    -- Add is_approved column if using boolean approach
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_profiles' 
        AND column_name = 'is_approved'
    ) THEN
        ALTER TABLE public.student_profiles 
        ADD COLUMN is_approved BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Added is_approved column to student_profiles table';
    END IF;

    -- Add subjects array column for student subject selections
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_profiles' 
        AND column_name = 'selected_subjects'
    ) THEN
        ALTER TABLE public.student_profiles 
        ADD COLUMN selected_subjects TEXT[];
        RAISE NOTICE '✅ Added selected_subjects column to student_profiles table';
    END IF;

    -- Add batches array column for student batch selections
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_profiles' 
        AND column_name = 'selected_batches'
    ) THEN
        ALTER TABLE public.student_profiles 
        ADD COLUMN selected_batches TEXT[];
        RAISE NOTICE '✅ Added selected_batches column to student_profiles table';
    END IF;
END $$;

-- 2. Add subject_specialization to teacher_profiles for teacher-subject filtering
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'teacher_profiles' 
        AND column_name = 'subject_specialization'
    ) THEN
        ALTER TABLE public.teacher_profiles 
        ADD COLUMN subject_specialization TEXT[];
        RAISE NOTICE '✅ Added subject_specialization column to teacher_profiles table';
    END IF;
END $$;

-- 3. Create approval_actions table to track approval history
CREATE TABLE IF NOT EXISTS public.approval_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL, -- References auth.users.id
    approver_type TEXT NOT NULL CHECK (approver_type IN ('admin', 'teacher')),
    action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Create student_teacher_assignments for teacher-specific student viewing
CREATE TABLE IF NOT EXISTS public.student_teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    subject_name TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, teacher_id, subject_name)
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_approval ON public.student_profiles (is_approved, status);
CREATE INDEX IF NOT EXISTS idx_student_profiles_subjects ON public.student_profiles USING GIN (selected_subjects);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_subjects ON public.teacher_profiles USING GIN (subject_specialization);
CREATE INDEX IF NOT EXISTS idx_approval_actions_student ON public.approval_actions (student_id);
CREATE INDEX IF NOT EXISTS idx_student_teacher_assignments_teacher ON public.student_teacher_assignments (teacher_id);

-- 6. Enable RLS on new tables
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_teacher_assignments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for Admin Dashboard (can see all students)
DROP POLICY IF EXISTS "Admins can view all students" ON public.student_profiles;
CREATE POLICY "Admins can view all students" 
ON public.student_profiles FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
            auth.users.raw_user_meta_data->>'user_type' = 'superadmin' OR
            auth.users.raw_user_meta_data->>'user_type' = 'admin'
        )
    )
);

DROP POLICY IF EXISTS "Admins can update all students" ON public.student_profiles;
CREATE POLICY "Admins can update all students" 
ON public.student_profiles FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
            auth.users.raw_user_meta_data->>'user_type' = 'superadmin' OR
            auth.users.raw_user_meta_data->>'user_type' = 'admin'
        )
    )
);

-- 8. RLS Policies for Teacher Dashboard (can see students with their subjects)
DROP POLICY IF EXISTS "Teachers can view students with their subjects" ON public.student_profiles;
CREATE POLICY "Teachers can view students with their subjects" 
ON public.student_profiles FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'user_type' = 'teacher'
        AND (
            -- Teacher can see students who selected any of teacher's subjects
            EXISTS (
                SELECT 1 FROM public.teacher_profiles tp
                WHERE tp.user_id = auth.uid()
                AND tp.subject_specialization && student_profiles.selected_subjects
            )
        )
    )
);

DROP POLICY IF EXISTS "Teachers can update students with their subjects" ON public.student_profiles;
CREATE POLICY "Teachers can update students with their subjects" 
ON public.student_profiles FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'user_type' = 'teacher'
        AND (
            -- Teacher can update students who selected any of teacher's subjects
            EXISTS (
                SELECT 1 FROM public.teacher_profiles tp
                WHERE tp.user_id = auth.uid()
                AND tp.subject_specialization && student_profiles.selected_subjects
            )
        )
    )
);

-- 9. RLS Policies for approval_actions table
DROP POLICY IF EXISTS "Authenticated users can view approval actions" ON public.approval_actions;
CREATE POLICY "Authenticated users can view approval actions" 
ON public.approval_actions FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Admins and teachers can create approval actions" ON public.approval_actions;
CREATE POLICY "Admins and teachers can create approval actions" 
ON public.approval_actions FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() = approver_id AND
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'user_type' IN ('superadmin', 'admin', 'teacher')
    )
);

-- 10. Functions for approval workflow
CREATE OR REPLACE FUNCTION approve_student(
    p_student_id UUID,
    p_approver_id UUID,
    p_approver_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update student approval status
    UPDATE public.student_profiles 
    SET 
        is_approved = true,
        status = 'APPROVED',
        approved_by = p_approver_id,
        approval_date = NOW(),
        updated_at = NOW()
    WHERE id = p_student_id;
    
    -- Log the approval action
    INSERT INTO public.approval_actions (student_id, approver_id, approver_type, action)
    VALUES (p_student_id, p_approver_id, p_approver_type, 'approve');
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION reject_student(
    p_student_id UUID,
    p_approver_id UUID,
    p_approver_type TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update student rejection status
    UPDATE public.student_profiles 
    SET 
        is_approved = false,
        status = 'REJECTED',
        rejected_by = p_approver_id,
        rejected_at = NOW(),
        rejection_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_student_id;
    
    -- Log the rejection action
    INSERT INTO public.approval_actions (student_id, approver_id, approver_type, action, reason)
    VALUES (p_student_id, p_approver_id, p_approver_type, 'reject', p_reason);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- 11. Grant execute permissions
GRANT EXECUTE ON FUNCTION approve_student(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_student(UUID, UUID, TEXT, TEXT) TO authenticated;

-- 12. Create view for pending students with subject info
CREATE OR REPLACE VIEW pending_students_view AS
SELECT 
    sp.*,
    array_to_string(sp.selected_subjects, ', ') as subjects_display,
    array_to_string(sp.selected_batches, ', ') as batches_display
FROM public.student_profiles sp
WHERE sp.is_approved = false AND sp.status IN ('PENDING', 'pending');

RAISE NOTICE '🎉 Student Approval System Database Setup Complete!';
RAISE NOTICE 'Created:';
RAISE NOTICE '- Added approval columns to student_profiles';
RAISE NOTICE '- Added subject_specialization to teacher_profiles';
RAISE NOTICE '- Created approval_actions tracking table';
RAISE NOTICE '- Set up RLS policies for admin and teacher access';
RAISE NOTICE '- Created approval/rejection functions';
RAISE NOTICE '- Created pending_students_view for easy querying';
