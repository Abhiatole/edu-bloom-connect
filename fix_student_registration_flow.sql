-- Fix Student Registration Flow - Complete Database Updates
-- This script adds missing fields and tables for the complete student registration flow

-- 1. Add missing columns to student_profiles table
DO $$
BEGIN
    -- Add student_mobile column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_profiles' 
        AND column_name = 'student_mobile'
    ) THEN
        ALTER TABLE public.student_profiles 
        ADD COLUMN student_mobile VARCHAR(15);
        RAISE NOTICE '✅ Added student_mobile column to student_profiles table';
    END IF;

    -- Add enrollment_no column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_profiles' 
        AND column_name = 'enrollment_no'
    ) THEN
        ALTER TABLE public.student_profiles 
        ADD COLUMN enrollment_no VARCHAR(20) UNIQUE;
        RAISE NOTICE '✅ Added enrollment_no column to student_profiles table';
    END IF;

    -- Add parent_email column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_profiles' 
        AND column_name = 'parent_email'
    ) THEN
        ALTER TABLE public.student_profiles 
        ADD COLUMN parent_email VARCHAR(255);
        RAISE NOTICE '✅ Added parent_email column to student_profiles table';
    END IF;
END $$;

-- 2. Create batches table for NEET/JEE/CET/Other
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default batches
INSERT INTO public.batches (name, description) VALUES
    ('NEET', 'National Eligibility cum Entrance Test - Medical entrance preparation'),
    ('JEE', 'Joint Entrance Examination - Engineering entrance preparation'),
    ('CET', 'Common Entrance Test - State level entrance preparation'),
    ('Other', 'Other specialized courses and general studies')
ON CONFLICT (name) DO NOTHING;

-- 3. Create student_batches relationship table
CREATE TABLE IF NOT EXISTS public.student_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, batch_id)
);

-- 4. Create subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default subjects
INSERT INTO public.subjects (name, description) VALUES
    ('Physics', 'Fundamental principles of matter, energy, and motion'),
    ('Chemistry', 'Study of matter, its properties, and chemical reactions'),
    ('Biology', 'Study of living organisms and life processes'),
    ('Mathematics', 'Mathematical concepts and problem-solving techniques')
ON CONFLICT (name) DO NOTHING;

-- 5. Create student_subjects relationship table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.student_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, subject_id)
);

-- 6. Enable RLS on new tables
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies

-- Batches policies (everyone can read)
DROP POLICY IF EXISTS "Allow read access to batches" ON public.batches;
CREATE POLICY "Allow read access to batches" ON public.batches
    FOR SELECT USING (true);

-- Subjects policies (everyone can read)
DROP POLICY IF EXISTS "Allow read access to subjects" ON public.subjects;
CREATE POLICY "Allow read access to subjects" ON public.subjects
    FOR SELECT USING (true);

-- Student batches policies
DROP POLICY IF EXISTS "Students can view their own batches" ON public.student_batches;
CREATE POLICY "Students can view their own batches" ON public.student_batches
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM public.student_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Teachers can view student batches" ON public.student_batches;
CREATE POLICY "Teachers can view student batches" ON public.student_batches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.teacher_profiles 
            WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.admin_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Student subjects policies
DROP POLICY IF EXISTS "Students can view their own subjects" ON public.student_subjects;
CREATE POLICY "Students can view their own subjects" ON public.student_subjects
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM public.student_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Teachers can view student subjects" ON public.student_subjects;
CREATE POLICY "Teachers can view student subjects" ON public.student_subjects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.teacher_profiles 
            WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.admin_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_batches_student_id ON public.student_batches(student_id);
CREATE INDEX IF NOT EXISTS idx_student_batches_batch_id ON public.student_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_student_id ON public.student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_subject_id ON public.student_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_enrollment_no ON public.student_profiles(enrollment_no);

-- 9. Create function to generate enrollment numbers
CREATE OR REPLACE FUNCTION generate_enrollment_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    new_enrollment_no TEXT;
    counter INTEGER;
BEGIN
    -- Get the current count of students + 1
    SELECT COUNT(*) + 1 INTO counter FROM public.student_profiles;
    
    -- Format as STU followed by 6-digit number
    new_enrollment_no := 'STU' || LPAD(counter::TEXT, 6, '0');
    
    -- Ensure uniqueness (in case of concurrent inserts)
    WHILE EXISTS (SELECT 1 FROM public.student_profiles WHERE enrollment_no = new_enrollment_no) LOOP
        counter := counter + 1;
        new_enrollment_no := 'STU' || LPAD(counter::TEXT, 6, '0');
    END LOOP;
    
    RETURN new_enrollment_no;
END;
$$;

-- 10. Create trigger to auto-generate enrollment numbers
CREATE OR REPLACE FUNCTION set_enrollment_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.enrollment_no IS NULL OR NEW.enrollment_no = '' THEN
        NEW.enrollment_no := generate_enrollment_number();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_enrollment_number ON public.student_profiles;
CREATE TRIGGER trigger_set_enrollment_number
    BEFORE INSERT ON public.student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_enrollment_number();

-- 11. Grant necessary permissions
GRANT ALL ON public.batches TO authenticated;
GRANT ALL ON public.student_batches TO authenticated;
GRANT ALL ON public.subjects TO authenticated;
GRANT ALL ON public.student_subjects TO authenticated;

-- 12. Create helper functions for student registration services

-- Function to enroll student in batches
CREATE OR REPLACE FUNCTION enroll_student_in_batches(
    p_student_id UUID,
    p_batch_names TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    batch_record RECORD;
    batch_name TEXT;
BEGIN
    -- Loop through each batch name
    FOREACH batch_name IN ARRAY p_batch_names
    LOOP
        -- Get batch ID
        SELECT id INTO batch_record FROM public.batches WHERE name = batch_name;
        
        IF batch_record.id IS NOT NULL THEN
            -- Insert into student_batches (ignore if already exists)
            INSERT INTO public.student_batches (student_id, batch_id)
            VALUES (p_student_id, batch_record.id)
            ON CONFLICT (student_id, batch_id) DO NOTHING;
        END IF;
    END LOOP;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Function to enroll student in subjects
CREATE OR REPLACE FUNCTION enroll_student_in_subjects(
    p_student_id UUID,
    p_subject_names TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subject_record RECORD;
    subject_name TEXT;
BEGIN
    -- Loop through each subject name
    FOREACH subject_name IN ARRAY p_subject_names
    LOOP
        -- Get subject ID
        SELECT id INTO subject_record FROM public.subjects WHERE name = subject_name;
        
        IF subject_record.id IS NOT NULL THEN
            -- Insert into student_subjects (ignore if already exists)
            INSERT INTO public.student_subjects (student_id, subject_id)
            VALUES (p_student_id, subject_record.id)
            ON CONFLICT (student_id, subject_id) DO NOTHING;
        END IF;
    END LOOP;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION enroll_student_in_batches(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION enroll_student_in_subjects(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_enrollment_number() TO authenticated;

RAISE NOTICE '🎉 Student Registration Flow Database Setup Complete!';
RAISE NOTICE 'Created tables: batches, student_batches, subjects, student_subjects';
RAISE NOTICE 'Added columns: student_mobile, enrollment_no, parent_email to student_profiles';
RAISE NOTICE 'Created helper functions for batch and subject enrollment';
RAISE NOTICE 'Set up automatic enrollment number generation';
