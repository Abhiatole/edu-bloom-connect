-- Migration: Add missing columns for Enhanced Teacher Dashboard
-- This script safely adds missing columns to existing tables

-- Add status column to exams table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'COMPLETED'));
        
        -- Update existing exams to have a default status
        UPDATE public.exams SET status = 'PUBLISHED' WHERE status IS NULL;
        
        RAISE NOTICE 'Added status column to exams table';
    ELSE
        RAISE NOTICE 'Status column already exists in exams table';
    END IF;
END $$;

-- Add max_marks column to exams table if it doesn't exist (and total_marks doesn't exist)
DO $$ 
BEGIN 
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
        
        RAISE NOTICE 'Added max_marks column to exams table';
    ELSE
        RAISE NOTICE 'Marks column already exists in exams table';
    END IF;
END $$;

-- Add exam_time column to exams table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'exam_time'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN exam_time TIME DEFAULT '10:00:00';
        
        RAISE NOTICE 'Added exam_time column to exams table';
    ELSE
        RAISE NOTICE 'Exam_time column already exists in exams table';
    END IF;
END $$;

-- Add duration_minutes column to exams table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'duration_minutes'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN duration_minutes INTEGER DEFAULT 60;
        
        RAISE NOTICE 'Added duration_minutes column to exams table';
    ELSE
        RAISE NOTICE 'Duration_minutes column already exists in exams table';
    END IF;
END $$;

-- Add description column to exams table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN description TEXT;
        
        RAISE NOTICE 'Added description column to exams table';
    ELSE
        RAISE NOTICE 'Description column already exists in exams table';
    END IF;
END $$;

-- Add question_paper_url column to exams table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'question_paper_url'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN question_paper_url TEXT;
        
        RAISE NOTICE 'Added question_paper_url column to exams table';
    ELSE
        RAISE NOTICE 'Question_paper_url column already exists in exams table';
    END IF;
END $$;

-- Add updated_at column to exams table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exams' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.exams 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        
        RAISE NOTICE 'Added updated_at column to exams table';
    ELSE
        RAISE NOTICE 'Updated_at column already exists in exams table';
    END IF;
END $$;

-- Check if we need to create the enhanced exam_results table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'exam_results'
    ) THEN
        -- Create the full exam_results table
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
        
        RAISE NOTICE 'Created exam_results table';
    ELSE
        RAISE NOTICE 'Exam_results table already exists';
        
        -- Add missing columns to existing exam_results table
        -- Add enrollment_no if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'enrollment_no'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN enrollment_no TEXT DEFAULT 'ENR-000';
            
            RAISE NOTICE 'Added enrollment_no column to exam_results table';
        END IF;
        
        -- Add student_name if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'student_name'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN student_name TEXT DEFAULT 'Unknown Student';
            
            RAISE NOTICE 'Added student_name column to exam_results table';
        END IF;
        
        -- Add subject if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'subject'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN subject TEXT DEFAULT 'General';
            
            RAISE NOTICE 'Added subject column to exam_results table';
        END IF;
        
        -- Add exam_name if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'exam_name'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN exam_name TEXT DEFAULT 'Exam';
            
            RAISE NOTICE 'Added exam_name column to exam_results table';
        END IF;
        
        -- Add max_marks if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'max_marks'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN max_marks INTEGER DEFAULT 100;
            
            RAISE NOTICE 'Added max_marks column to exam_results table';
        END IF;
        
        -- Add percentage if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'percentage'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN percentage DECIMAL;
            
            RAISE NOTICE 'Added percentage column to exam_results table';
        END IF;
        
        -- Add feedback if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'feedback'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN feedback TEXT;
            
            RAISE NOTICE 'Added feedback column to exam_results table';
        END IF;
        
        -- Add updated_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE public.exam_results 
            ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
            
            RAISE NOTICE 'Added updated_at column to exam_results table';
        END IF;
    END IF;
END $$;

-- Create parent_notifications table if it doesn't exist
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
        
        RAISE NOTICE 'Created parent_notifications table';
    ELSE
        RAISE NOTICE 'Parent_notifications table already exists';
    END IF;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_teacher_id ON public.exams(created_by_teacher_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON public.exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON public.exam_results(student_id);

-- Add triggers for updated_at if they don't exist
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

-- Enable RLS if not already enabled
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;

-- Update RLS policies (safe to run multiple times)
DROP POLICY IF EXISTS "Teachers can manage their own exams" ON public.exams;
CREATE POLICY "Teachers can manage their own exams" ON public.exams
    FOR ALL USING (
        auth.uid() = created_by_teacher_id OR
        EXISTS (
            SELECT 1 FROM public.teacher_profiles 
            WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
    );

DROP POLICY IF EXISTS "Students can view published exams" ON public.exams;
CREATE POLICY "Students can view published exams" ON public.exams
    FOR SELECT USING (
        status = 'PUBLISHED' AND
        EXISTS (
            SELECT 1 FROM public.student_profiles 
            WHERE user_id = auth.uid() AND status = 'APPROVED'
        )
    );

-- Grant permissions
GRANT ALL ON public.exams TO authenticated;
GRANT ALL ON public.exam_results TO authenticated;
GRANT ALL ON public.parent_notifications TO authenticated;

RAISE NOTICE 'Migration completed successfully!';
