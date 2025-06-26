-- Robust RLS Policies for Enhanced Teacher Dashboard
-- This script creates RLS policies that work even if profile tables are missing or have different structures

-- Enable RLS on our tables
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies
DROP POLICY IF EXISTS "Teachers can manage their own exams" ON public.exams;
DROP POLICY IF EXISTS "Students can view published exams" ON public.exams;
DROP POLICY IF EXISTS "Teachers can manage exam results" ON public.exam_results;
DROP POLICY IF EXISTS "Students can view their own results" ON public.exam_results;
DROP POLICY IF EXISTS "Teachers can manage notifications" ON public.parent_notifications;

-- Create flexible RLS policies
DO $$
BEGIN
    -- Policy for exams - teachers can manage their own exams
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_profiles' AND table_schema = 'public') THEN
        -- If teacher_profiles table exists, use it for additional validation
        CREATE POLICY "Teachers can manage their own exams" ON public.exams
            FOR ALL USING (
                auth.uid() = created_by_teacher_id OR
                EXISTS (
                    SELECT 1 FROM public.teacher_profiles 
                    WHERE user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created exams policy with teacher_profiles validation';
    ELSE
        -- If no teacher_profiles table, just check created_by_teacher_id
        CREATE POLICY "Teachers can manage their own exams" ON public.exams
            FOR ALL USING (auth.uid() = created_by_teacher_id);
        RAISE NOTICE 'Created exams policy without teacher_profiles validation';
    END IF;

    -- Policy for students to view published exams
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_profiles' AND table_schema = 'public') THEN
        -- Check if status column exists in student_profiles
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'student_profiles' 
            AND column_name = 'status' 
            AND table_schema = 'public'
        ) THEN
            CREATE POLICY "Students can view published exams" ON public.exams
                FOR SELECT USING (
                    status = 'PUBLISHED' AND
                    EXISTS (
                        SELECT 1 FROM public.student_profiles 
                        WHERE user_id = auth.uid() 
                        AND (status = 'APPROVED' OR status IS NULL)
                    )
                );
            RAISE NOTICE 'Created student exam view policy with status check';
        ELSE
            CREATE POLICY "Students can view published exams" ON public.exams
                FOR SELECT USING (
                    status = 'PUBLISHED' AND
                    EXISTS (
                        SELECT 1 FROM public.student_profiles 
                        WHERE user_id = auth.uid()
                    )
                );
            RAISE NOTICE 'Created student exam view policy without status check';
        END IF;
    ELSE
        -- If no student_profiles table, allow all authenticated users to view published exams
        CREATE POLICY "Students can view published exams" ON public.exams
            FOR SELECT USING (status = 'PUBLISHED' AND auth.uid() IS NOT NULL);
        RAISE NOTICE 'Created student exam view policy without student_profiles validation';
    END IF;

    -- Policy for exam results - teachers can manage results for their exams
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_profiles' AND table_schema = 'public') THEN
        CREATE POLICY "Teachers can manage exam results" ON public.exam_results
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.exams 
                    WHERE id = exam_id AND created_by_teacher_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM public.teacher_profiles 
                    WHERE user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created exam results policy with teacher_profiles validation';
    ELSE
        CREATE POLICY "Teachers can manage exam results" ON public.exam_results
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.exams 
                    WHERE id = exam_id AND created_by_teacher_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created exam results policy without teacher_profiles validation';
    END IF;

    -- Policy for students to view their own results
    CREATE POLICY "Students can view their own results" ON public.exam_results
        FOR SELECT USING (student_id = auth.uid());
    RAISE NOTICE 'Created student results view policy';

    -- Policy for parent notifications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_profiles' AND table_schema = 'public') THEN
        CREATE POLICY "Teachers can manage notifications" ON public.parent_notifications
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.exam_results er
                    JOIN public.exams e ON er.id = exam_result_id
                    WHERE e.created_by_teacher_id = auth.uid()
                ) OR
                EXISTS (
                    SELECT 1 FROM public.teacher_profiles 
                    WHERE user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created notifications policy with teacher_profiles validation';
    ELSE
        CREATE POLICY "Teachers can manage notifications" ON public.parent_notifications
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.exam_results er
                    JOIN public.exams e ON er.id = exam_result_id
                    WHERE e.created_by_teacher_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created notifications policy without teacher_profiles validation';
    END IF;

END $$;

-- Grant permissions
GRANT ALL ON public.exams TO authenticated;
GRANT ALL ON public.exam_results TO authenticated;
GRANT ALL ON public.parent_notifications TO authenticated;

RAISE NOTICE '✅ RLS policies created successfully with flexibility for missing profile tables!';
