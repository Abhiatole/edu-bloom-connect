-- Teacher Dashboard Subject-Specific Enhancement
-- Run this script to set up required tables and relationships

-- 1. Create subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create student_subjects relationship table
CREATE TABLE IF NOT EXISTS public.student_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, subject_id)
);

-- 3. Create teacher_subjects relationship table
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(teacher_id, subject_id)
);

-- 4. Update exams table to include subject_id
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id);

-- 5. Insert default subjects if none exist
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

-- 6. Enable RLS on new tables
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for subjects (drop existing first)
DROP POLICY IF EXISTS "Allow read access to subjects" ON public.subjects;
CREATE POLICY "Allow read access to subjects" ON public.subjects
    FOR SELECT USING (true);

-- 8. Create RLS policies for student_subjects (drop existing first)
DROP POLICY IF EXISTS "Students can view their own subjects" ON public.student_subjects;
CREATE POLICY "Students can view their own subjects" ON public.student_subjects
    FOR SELECT USING (
        student_id IN (
            SELECT id FROM public.student_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Teachers can view students in their subjects" ON public.student_subjects;
CREATE POLICY "Teachers can view students in their subjects" ON public.student_subjects
    FOR SELECT USING (
        subject_id IN (
            SELECT subject_id FROM public.teacher_subjects ts
            JOIN public.teacher_profiles tp ON ts.teacher_id = tp.id
            WHERE tp.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all student subjects" ON public.student_subjects;
CREATE POLICY "Admins can view all student subjects" ON public.student_subjects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
    );

DROP POLICY IF EXISTS "Teachers can insert/update students in their subjects" ON public.student_subjects;
CREATE POLICY "Teachers can insert/update students in their subjects" ON public.student_subjects
    FOR ALL USING (
        subject_id IN (
            SELECT subject_id FROM public.teacher_subjects ts
            JOIN public.teacher_profiles tp ON ts.teacher_id = tp.id
            WHERE tp.user_id = auth.uid()
        )
    );

-- 9. Create RLS policies for teacher_subjects (drop existing first)
DROP POLICY IF EXISTS "Teachers can view their own subjects" ON public.teacher_subjects;
CREATE POLICY "Teachers can view their own subjects" ON public.teacher_subjects
    FOR SELECT USING (
        teacher_id IN (
            SELECT id FROM public.teacher_profiles 
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all teacher subjects" ON public.teacher_subjects;
CREATE POLICY "Admins can view all teacher subjects" ON public.teacher_subjects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
    );

DROP POLICY IF EXISTS "Admins can manage teacher subjects" ON public.teacher_subjects;
CREATE POLICY "Admins can manage teacher subjects" ON public.teacher_subjects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
    );

-- 10. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_subjects_student_id ON public.student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_subject_id ON public.student_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON public.teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON public.teacher_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON public.exams(subject_id);

-- 11. Create helper functions (drop existing first)
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
        sp.id,
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
