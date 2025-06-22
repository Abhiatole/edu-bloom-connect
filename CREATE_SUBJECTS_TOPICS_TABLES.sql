-- Create subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    class_level INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Subjects accessible by authenticated users" ON public.subjects;
DROP POLICY IF EXISTS "Subjects manageable by teachers and admins" ON public.subjects;

-- Create policies
CREATE POLICY "Subjects accessible by authenticated users" 
ON public.subjects
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Subjects manageable by teachers and admins" 
ON public.subjects
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND (user_profiles.role = 'teacher' OR user_profiles.role = 'admin')
    )
);

-- Create topics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    subject_id UUID REFERENCES public.subjects(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Topics accessible by authenticated users" ON public.topics;
DROP POLICY IF EXISTS "Topics manageable by teachers and admins" ON public.topics;

-- Create policies
CREATE POLICY "Topics accessible by authenticated users" 
ON public.topics
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Topics manageable by teachers and admins" 
ON public.topics
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND (user_profiles.role = 'teacher' OR user_profiles.role = 'admin')
    )
);
