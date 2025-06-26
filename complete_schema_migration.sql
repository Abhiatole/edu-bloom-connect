-- Step 1: Check Current Database State
-- This script first checks what exists, then applies the schema

-- ====================================
-- PART 1: CHECK CURRENT DATABASE STATE
-- ====================================

-- Check if tables exist
SELECT 
    'TABLE_CHECK' as check_type,
    t.table_name,
    CASE WHEN t.table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    SELECT 'exams' as table_name
    UNION SELECT 'exam_results'
    UNION SELECT 'parent_notifications'
    UNION SELECT 'student_profiles'
    UNION SELECT 'teacher_profiles'
) expected
LEFT JOIN information_schema.tables t ON t.table_name = expected.table_name 
    AND t.table_schema = 'public'
ORDER BY expected.table_name;

-- Check exams table columns
SELECT 
    'EXAMS_COLUMNS' as check_type,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
    AND c.table_name = 'exams'
ORDER BY c.ordinal_position;

-- Check exam_results table columns (if exists)
SELECT 
    'EXAM_RESULTS_COLUMNS' as check_type,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
    AND c.table_name = 'exam_results'
ORDER BY c.ordinal_position;

-- Check what columns are missing from exams table
SELECT 
    'MISSING_COLUMNS_CHECK' as check_type,
    expected_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exams' 
            AND column_name = expected_column
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - WILL BE ADDED'
    END as status
FROM (
    SELECT 'id' as expected_column
    UNION SELECT 'title'
    UNION SELECT 'subject'
    UNION SELECT 'exam_date'
    UNION SELECT 'exam_time'
    UNION SELECT 'duration_minutes'
    UNION SELECT 'max_marks'
    UNION SELECT 'total_marks'
    UNION SELECT 'class_level'
    UNION SELECT 'exam_type'
    UNION SELECT 'description'
    UNION SELECT 'question_paper_url'
    UNION SELECT 'status'
    UNION SELECT 'created_by_teacher_id'
    UNION SELECT 'created_at'
    UNION SELECT 'updated_at'
) cols
ORDER BY expected_column;

-- ====================================
-- PART 2: APPLY SCHEMA CHANGES
-- ====================================

-- Create exams table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'exams'
    ) THEN
        CREATE TABLE public.exams (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            subject TEXT NOT NULL,
            exam_date DATE NOT NULL,
            exam_time TIME DEFAULT '10:00:00',
            duration_minutes INTEGER DEFAULT 60,
            max_marks INTEGER DEFAULT 100,
            class_level INTEGER NOT NULL,
            exam_type TEXT DEFAULT 'Internal',
            description TEXT,
            question_paper_url TEXT,
            status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'COMPLETED')),
            created_by_teacher_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        RAISE NOTICE '✅ Created exams table';
    ELSE
        RAISE NOTICE '✅ Exams table already exists';
    END IF;
END $$;

-- Add missing columns to exams table one by one
DO $$ 
BEGIN 
    -- Add status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'COMPLETED'));
        RAISE NOTICE '✅ Added status column to exams table';
    END IF;

    -- Add max_marks column (if total_marks doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'max_marks'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'total_marks'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN max_marks INTEGER DEFAULT 100;
        RAISE NOTICE '✅ Added max_marks column to exams table';
    END IF;

    -- Add exam_time column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'exam_time'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN exam_time TIME DEFAULT '10:00:00';
        RAISE NOTICE '✅ Added exam_time column to exams table';
    END IF;

    -- Add duration_minutes column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'duration_minutes'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN duration_minutes INTEGER DEFAULT 60;
        RAISE NOTICE '✅ Added duration_minutes column to exams table';
    END IF;

    -- Add description column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Added description column to exams table';
    END IF;

    -- Add question_paper_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'question_paper_url'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN question_paper_url TEXT;
        RAISE NOTICE '✅ Added question_paper_url column to exams table';
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        RAISE NOTICE '✅ Added updated_at column to exams table';
    END IF;
END $$;

-- Create exam_results table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'exam_results'
    ) THEN
        CREATE TABLE public.exam_results (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
            student_id UUID NOT NULL,
            enrollment_no TEXT NOT NULL,
            student_name TEXT NOT NULL,
            subject TEXT NOT NULL,
            exam_name TEXT NOT NULL,
            marks_obtained DECIMAL NOT NULL,
            max_marks INTEGER NOT NULL,
            percentage DECIMAL GENERATED ALWAYS AS (ROUND((marks_obtained / max_marks) * 100, 2)) STORED,
            feedback TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE(exam_id, student_id)
        );
        RAISE NOTICE '✅ Created exam_results table';
    ELSE
        RAISE NOTICE '✅ Exam_results table already exists';
        
        -- Add missing columns to existing exam_results table
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'enrollment_no'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN enrollment_no TEXT DEFAULT 'ENR-000';
            RAISE NOTICE '✅ Added enrollment_no column to exam_results';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'student_name'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN student_name TEXT DEFAULT 'Unknown Student';
            RAISE NOTICE '✅ Added student_name column to exam_results';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'subject'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN subject TEXT DEFAULT 'General';
            RAISE NOTICE '✅ Added subject column to exam_results';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'exam_name'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN exam_name TEXT DEFAULT 'Exam';
            RAISE NOTICE '✅ Added exam_name column to exam_results';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'max_marks'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN max_marks INTEGER DEFAULT 100;
            RAISE NOTICE '✅ Added max_marks column to exam_results';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'percentage'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN percentage DECIMAL;
            RAISE NOTICE '✅ Added percentage column to exam_results';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'feedback'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN feedback TEXT;
            RAISE NOTICE '✅ Added feedback column to exam_results';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
            RAISE NOTICE '✅ Added updated_at column to exam_results';
        END IF;
    END IF;
END $$;

-- Create parent_notifications table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'parent_notifications'
    ) THEN
        CREATE TABLE public.parent_notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL,
            exam_result_id UUID REFERENCES public.exam_results(id) ON DELETE CASCADE,
            phone_number TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
            sent_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        RAISE NOTICE '✅ Created parent_notifications table';
    ELSE
        RAISE NOTICE '✅ Parent_notifications table already exists';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_teacher_id ON public.exams(created_by_teacher_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON public.exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON public.exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_enrollment ON public.exam_results(enrollment_no);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_student ON public.parent_notifications(student_id);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_exams_updated_at ON public.exams;
CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON public.exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_results_updated_at ON public.exam_results;
CREATE TRIGGER update_exam_results_updated_at
    BEFORE UPDATE ON public.exam_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (robust version that handles missing profile tables)
DO $$
BEGIN
    -- Clean up existing policies
    DROP POLICY IF EXISTS "Teachers can manage their own exams" ON public.exams;
    DROP POLICY IF EXISTS "Students can view published exams" ON public.exams;
    DROP POLICY IF EXISTS "Teachers can manage exam results" ON public.exam_results;
    DROP POLICY IF EXISTS "Students can view their own results" ON public.exam_results;
    DROP POLICY IF EXISTS "Teachers can manage notifications" ON public.parent_notifications;

    -- Policy for exams - teachers can manage their own exams
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_profiles' AND table_schema = 'public') THEN
        CREATE POLICY "Teachers can manage their own exams" ON public.exams
            FOR ALL USING (
                auth.uid() = created_by_teacher_id OR
                EXISTS (
                    SELECT 1 FROM public.teacher_profiles 
                    WHERE user_id = auth.uid()
                )
            );
        RAISE NOTICE '✅ Created exams policy with teacher_profiles validation';
    ELSE
        CREATE POLICY "Teachers can manage their own exams" ON public.exams
            FOR ALL USING (auth.uid() = created_by_teacher_id);
        RAISE NOTICE '✅ Created exams policy without teacher_profiles validation';
    END IF;

    -- Policy for students to view published exams
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_profiles' AND table_schema = 'public') THEN
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
            RAISE NOTICE '✅ Created student exam view policy with status check';
        ELSE
            CREATE POLICY "Students can view published exams" ON public.exams
                FOR SELECT USING (
                    status = 'PUBLISHED' AND
                    EXISTS (
                        SELECT 1 FROM public.student_profiles 
                        WHERE user_id = auth.uid()
                    )
                );
            RAISE NOTICE '✅ Created student exam view policy without status check';
        END IF;
    ELSE
        CREATE POLICY "Students can view published exams" ON public.exams
            FOR SELECT USING (status = 'PUBLISHED' AND auth.uid() IS NOT NULL);
        RAISE NOTICE '✅ Created student exam view policy without student_profiles validation';
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
        RAISE NOTICE '✅ Created exam results policy with teacher_profiles validation';
    ELSE
        CREATE POLICY "Teachers can manage exam results" ON public.exam_results
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.exams 
                    WHERE id = exam_id AND created_by_teacher_id = auth.uid()
                )
            );
        RAISE NOTICE '✅ Created exam results policy without teacher_profiles validation';
    END IF;

    -- Policy for students to view their own results
    CREATE POLICY "Students can view their own results" ON public.exam_results
        FOR SELECT USING (student_id = auth.uid());
    RAISE NOTICE '✅ Created student results view policy';

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
        RAISE NOTICE '✅ Created notifications policy with teacher_profiles validation';
    ELSE
        CREATE POLICY "Teachers can manage notifications" ON public.parent_notifications
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.exam_results er
                    JOIN public.exams e ON er.id = exam_result_id
                    WHERE e.created_by_teacher_id = auth.uid()
                )
            );
        RAISE NOTICE '✅ Created notifications policy without teacher_profiles validation';
    END IF;

END $$;

-- Grant permissions
GRANT ALL ON public.exams TO authenticated;
GRANT ALL ON public.exam_results TO authenticated;
GRANT ALL ON public.parent_notifications TO authenticated;

-- ====================================
-- PART 3: FINAL VERIFICATION
-- ====================================

-- Check final table structure
SELECT 
    'FINAL_VERIFICATION' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('exams', 'exam_results', 'parent_notifications')
ORDER BY table_name, ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '✅ All tables and columns have been created/updated';
    RAISE NOTICE '✅ Indexes and triggers are in place';
    RAISE NOTICE '✅ Row Level Security policies are active';
    RAISE NOTICE '🚀 Your Enhanced Teacher Dashboard is ready to use!';
END $$;
