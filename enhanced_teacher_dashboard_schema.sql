-- Enhanced Teacher Dashboard Database Schema
-- This script creates all necessary tables and columns for the enhanced teacher dashboard

-- Create exams table if not exists with all required fields
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    exam_date DATE NOT NULL,
    exam_time TIME NOT NULL,
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

-- Create exam_results table if not exists with all required fields
CREATE TABLE IF NOT EXISTS public.exam_results (
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

-- Create parent_notifications table for tracking sent messages
CREATE TABLE IF NOT EXISTS public.parent_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    exam_result_id UUID REFERENCES public.exam_results(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exams_teacher_id ON public.exams(created_by_teacher_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON public.exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON public.exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_enrollment ON public.exam_results(enrollment_no);
CREATE INDEX IF NOT EXISTS idx_parent_notifications_student ON public.parent_notifications(student_id);

-- Enable Row Level Security
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exams table
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

-- RLS Policies for exam_results table
DROP POLICY IF EXISTS "Teachers can manage exam results" ON public.exam_results;
CREATE POLICY "Teachers can manage exam results" ON public.exam_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.exams 
            WHERE id = exam_id AND created_by_teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.teacher_profiles 
            WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
    );

DROP POLICY IF EXISTS "Students can view their own results" ON public.exam_results;
CREATE POLICY "Students can view their own results" ON public.exam_results
    FOR SELECT USING (
        student_id = auth.uid()
    );

-- RLS Policies for parent_notifications table
DROP POLICY IF EXISTS "Teachers can manage notifications" ON public.parent_notifications;
CREATE POLICY "Teachers can manage notifications" ON public.parent_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.exam_results er
            JOIN public.exams e ON er.id = exam_result_id
            WHERE e.created_by_teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.teacher_profiles 
            WHERE user_id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Update triggers for updated_at fields
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

-- Grant necessary permissions
GRANT ALL ON public.exams TO authenticated;
GRANT ALL ON public.exam_results TO authenticated;
GRANT ALL ON public.parent_notifications TO authenticated;

-- Insert some sample data for testing (optional)
DO $$
BEGIN
    -- Check if we have any teacher profiles to use for sample data
    IF EXISTS (SELECT 1 FROM public.teacher_profiles LIMIT 1) THEN
        -- Insert sample exam data only if tables are empty
        IF NOT EXISTS (SELECT 1 FROM public.exams LIMIT 1) THEN
            INSERT INTO public.exams (
                title, subject, exam_date, exam_time, duration_minutes, 
                max_marks, class_level, exam_type, description, status, 
                created_by_teacher_id
            ) 
            SELECT 
                'Mathematics Mid-term Exam',
                'Mathematics',
                CURRENT_DATE + INTERVAL '7 days',
                '10:00:00',
                90,
                100,
                11,
                'Internal',
                'Mid-term examination covering algebra and trigonometry',
                'PUBLISHED',
                user_id
            FROM public.teacher_profiles 
            LIMIT 1;
        END IF;
    END IF;
END $$;

-- Create a view for easy exam results with student details
CREATE OR REPLACE VIEW public.exam_results_with_details AS
SELECT 
    er.*,
    e.title as exam_title,
    e.subject as exam_subject,
    e.exam_date,
    e.created_by_teacher_id,
    sp.full_name as student_full_name,
    sp.class_level as student_class,
    sp.enrollment_no as student_enrollment
FROM public.exam_results er
JOIN public.exams e ON er.exam_id = e.id
LEFT JOIN public.student_profiles sp ON er.student_id = sp.user_id;

-- Grant access to the view
GRANT SELECT ON public.exam_results_with_details TO authenticated;
