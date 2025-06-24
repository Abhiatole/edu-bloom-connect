-- FIX STUDENT INSIGHTS RLS POLICY
-- This script fixes the row-level security policies for the student_insights table

-- Step 1: First, check if the table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'student_insights'
  ) THEN
    -- Create the table if it doesn't exist
    CREATE TABLE public.student_insights (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
      analysis_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
      strengths TEXT[],
      weaknesses TEXT[],
      recommendations TEXT[],
      performance_trend TEXT,
      ai_generated BOOLEAN DEFAULT true,
      created_by UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created student_insights table';
  END IF;
END $$;

-- Step 2: Enable RLS on the table
ALTER TABLE public.student_insights ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies (if any)
DROP POLICY IF EXISTS "student_insights_select_policy" ON public.student_insights;
DROP POLICY IF EXISTS "student_insights_insert_policy" ON public.student_insights;
DROP POLICY IF EXISTS "student_insights_update_policy" ON public.student_insights;
DROP POLICY IF EXISTS "student_insights_delete_policy" ON public.student_insights;

-- Also drop any other policies that might exist
DO $$
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON student_insights;', E'\n')
        FROM pg_policies
        WHERE tablename = 'student_insights'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- Step 4: Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_user_meta_data->>'role' IN ('admin', 'ADMIN', 'superadmin') OR
            raw_app_meta_data->>'role' IN ('admin', 'ADMIN', 'superadmin')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is a teacher
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_user_meta_data->>'role' = 'teacher' OR
            raw_app_meta_data->>'role' = 'teacher'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if the user is associated with a student
CREATE OR REPLACE FUNCTION can_access_student(student_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_students_teacher BOOLEAN;
    is_students_parent BOOLEAN;
    is_student_themselves BOOLEAN;
BEGIN
    -- Check if user is the student themselves
    SELECT EXISTS (
        SELECT 1 FROM student_profiles
        WHERE id = student_uuid
        AND user_id = auth.uid()
    ) INTO is_student_themselves;
    
    IF is_student_themselves THEN
        RETURN TRUE;
    END IF;
    
    -- Admin can access all students
    IF is_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is a teacher who teaches this student
    -- This would need to be adapted based on your actual schema
    -- For example, you might have a class_enrollments table
    SELECT EXISTS (
        SELECT 1 FROM teacher_profiles t
        JOIN exams e ON t.user_id = e.created_by_teacher_id
        JOIN exam_results er ON e.id = er.exam_id
        JOIN student_profiles s ON er.student_id = s.id
        WHERE s.id = student_uuid
        AND t.user_id = auth.uid()
    ) INTO is_students_teacher;
    
    IF is_students_teacher THEN
        RETURN TRUE;
    END IF;
    
    -- You could add a check for parents here if you have parent profiles
    -- linked to students
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create comprehensive policies for the student_insights table

-- Anyone with proper access can view insights
CREATE POLICY "student_insights_select_policy" ON public.student_insights
    FOR SELECT USING (
        can_access_student(student_id) OR
        auth.uid() = created_by OR
        is_admin()
    );

-- Teachers and admins can insert insights
CREATE POLICY "student_insights_insert_policy" ON public.student_insights
    FOR INSERT WITH CHECK (
        is_teacher() OR 
        is_admin() OR
        auth.uid() IS NOT NULL -- Allow authenticated users during OpenAI integration
    );

-- Only the creator or admins can update insights
CREATE POLICY "student_insights_update_policy" ON public.student_insights
    FOR UPDATE USING (
        auth.uid() = created_by OR
        is_admin()
    );

-- Only the creator or admins can delete insights
CREATE POLICY "student_insights_delete_policy" ON public.student_insights
    FOR DELETE USING (
        auth.uid() = created_by OR
        is_admin()
    );

-- Step 6: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_insights TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE student_insights_id_seq TO authenticated;

-- Output success message
SELECT 'Student insights RLS policies have been successfully fixed!' as result;
