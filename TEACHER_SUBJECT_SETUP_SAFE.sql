-- TEACHER SUBJECT SETUP - STEP BY STEP VERSION
-- Run each section separately to avoid errors

-- STEP 1: Create basic tables
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, subject_id)
);

CREATE TABLE IF NOT EXISTS public.teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(teacher_id, subject_id)
);

-- STEP 2: Add subject_id column to exams table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exams' AND column_name = 'subject_id'
    ) THEN
        ALTER TABLE public.exams ADD COLUMN subject_id UUID REFERENCES public.subjects(id);
    END IF;
END $$;

-- STEP 3: Insert default subjects
INSERT INTO public.subjects (name, description) VALUES
    ('Mathematics', 'Mathematical concepts and problem solving'),
    ('Physics', 'Physical sciences and natural phenomena'),
    ('Chemistry', 'Chemical reactions and molecular structures'),
    ('Biology', 'Life sciences and biological processes'),
    ('English', 'English language and literature'),
    ('Computer Science', 'Programming and computer applications'),
    ('Economics', 'Economic principles and market dynamics'),
    ('History', 'Historical events and civilizations'),
    ('Geography', 'Earth sciences and human geography'),
    ('Hindi', 'Hindi language and literature')
ON CONFLICT (name) DO NOTHING;

-- STEP 4: Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_student_subjects_student_id ON public.student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_subject_id ON public.student_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON public.teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON public.teacher_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON public.exams(subject_id);

-- STEP 6: Drop existing policies (run this step by step)
-- For subjects table
DROP POLICY IF EXISTS "Allow read access to subjects" ON public.subjects;

-- For student_subjects table
DROP POLICY IF EXISTS "Students can view their own subjects" ON public.student_subjects;
DROP POLICY IF EXISTS "Teachers can view students in their subjects" ON public.student_subjects;
DROP POLICY IF EXISTS "Admins can view all student subjects" ON public.student_subjects;
DROP POLICY IF EXISTS "Teachers can insert/update students in their subjects" ON public.student_subjects;

-- For teacher_subjects table
DROP POLICY IF EXISTS "Teachers can view their own subjects" ON public.teacher_subjects;
DROP POLICY IF EXISTS "Admins can view all teacher subjects" ON public.teacher_subjects;
DROP POLICY IF EXISTS "Admins can manage teacher subjects" ON public.teacher_subjects;

-- STEP 7: Create new policies
-- Subjects policies
CREATE POLICY "Allow read access to subjects" ON public.subjects
    FOR SELECT USING (true);

-- Student subjects policies
CREATE POLICY "Students can view their own subjects" ON public.student_subjects
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM public.student_profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can view students in their subjects" ON public.student_subjects
    FOR SELECT USING (
        subject_id IN (
            SELECT subject_id FROM public.teacher_subjects ts
            JOIN public.teacher_profiles tp ON ts.teacher_id = tp.id
            WHERE tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all student subjects" ON public.student_subjects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Teachers can insert/update students in their subjects" ON public.student_subjects
    FOR ALL USING (
        subject_id IN (
            SELECT subject_id FROM public.teacher_subjects ts
            JOIN public.teacher_profiles tp ON ts.teacher_id = tp.id
            WHERE tp.user_id = auth.uid()
        )
    );

-- Teacher subjects policies
CREATE POLICY "Teachers can view their own subjects" ON public.teacher_subjects
    FOR SELECT USING (
        teacher_id IN (
            SELECT id FROM public.teacher_profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all teacher subjects" ON public.teacher_subjects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
    );

CREATE POLICY "Admins can manage teacher subjects" ON public.teacher_subjects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
    );

-- STEP 8: Create helper functions
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
    RETURN QUERY    SELECT
        sp.id as student_id,
        sp.enrollment_no,
        sp.full_name,
        sp.class_level,
        sp.parent_email,
        sp.guardian_mobile as parent_phone,
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
END;
$$;

DROP FUNCTION IF EXISTS get_teacher_subjects(UUID);
CREATE OR REPLACE FUNCTION get_teacher_subjects(teacher_user_id UUID)
RETURNS TABLE (
    subject_id UUID,
    subject_name TEXT,
    subject_description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description
    FROM public.subjects s
    JOIN public.teacher_subjects ts ON s.id = ts.subject_id
    JOIN public.teacher_profiles tp ON ts.teacher_id = tp.id
    WHERE tp.user_id = teacher_user_id
    ORDER BY s.name;
END;
$$;

-- STEP 9: Verify setup
SELECT 'Setup completed successfully!' as status;
SELECT 'Subjects created: ' || count(*) as subjects_count FROM public.subjects;
SELECT 'Tables created successfully' as tables_status;
