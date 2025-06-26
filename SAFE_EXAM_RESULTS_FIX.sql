-- SAFE FIX: Add missing 'created_at' column to exam_results table
-- This script only adds the missing column without modifying existing structure

DO $$
BEGIN
    -- Check if created_at column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exam_results' 
        AND column_name = 'created_at'
    ) THEN
        -- Add created_at column
        ALTER TABLE public.exam_results 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        
        -- Update existing records to use submitted_at if available, otherwise now()
        UPDATE public.exam_results 
        SET created_at = COALESCE(submitted_at, now()) 
        WHERE created_at IS NULL;
        
        RAISE NOTICE '✅ Added created_at column to exam_results table';
    ELSE
        RAISE NOTICE '✅ created_at column already exists in exam_results table';
    END IF;
    
    -- Ensure updated_at column exists as well
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exam_results' 
        AND column_name = 'updated_at'
    ) THEN
        -- Add updated_at column
        ALTER TABLE public.exam_results 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
        
        -- Update existing records
        UPDATE public.exam_results 
        SET updated_at = COALESCE(created_at, submitted_at, now()) 
        WHERE updated_at IS NULL;
        
        RAISE NOTICE '✅ Added updated_at column to exam_results table';
    ELSE
        RAISE NOTICE '✅ updated_at column already exists in exam_results table';
    END IF;
    
    -- Add other missing columns if needed (without data type changes)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exam_results' 
        AND column_name = 'enrollment_no'
    ) THEN
        ALTER TABLE public.exam_results 
        ADD COLUMN enrollment_no TEXT DEFAULT 'ENR-000';
        RAISE NOTICE '✅ Added enrollment_no column to exam_results table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exam_results' 
        AND column_name = 'student_name'
    ) THEN
        ALTER TABLE public.exam_results 
        ADD COLUMN student_name TEXT DEFAULT 'Unknown Student';
        RAISE NOTICE '✅ Added student_name column to exam_results table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exam_results' 
        AND column_name = 'subject'
    ) THEN
        ALTER TABLE public.exam_results 
        ADD COLUMN subject TEXT DEFAULT 'General';
        RAISE NOTICE '✅ Added subject column to exam_results table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exam_results' 
        AND column_name = 'exam_name'
    ) THEN
        ALTER TABLE public.exam_results 
        ADD COLUMN exam_name TEXT DEFAULT 'Exam';
        RAISE NOTICE '✅ Added exam_name column to exam_results table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exam_results' 
        AND column_name = 'max_marks'
    ) THEN
        ALTER TABLE public.exam_results 
        ADD COLUMN max_marks INTEGER DEFAULT 100;
        RAISE NOTICE '✅ Added max_marks column to exam_results table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exam_results' 
        AND column_name = 'feedback'
    ) THEN
        ALTER TABLE public.exam_results 
        ADD COLUMN feedback TEXT;
        RAISE NOTICE '✅ Added feedback column to exam_results table';
    END IF;
    
END $$;

-- Check the final structure
SELECT 
    'EXAM_RESULTS_STRUCTURE_AFTER_FIX' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'exam_results'
ORDER BY ordinal_position;
