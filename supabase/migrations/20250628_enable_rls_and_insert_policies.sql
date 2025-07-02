-- Enable RLS and allow inserts for student_profiles and teacher_profiles

-- Enable RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated insert on student_profiles"
  ON public.student_profiles
  FOR INSERT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert on teacher_profiles"
  ON public.teacher_profiles
  FOR INSERT
  TO authenticated
  USING (true);

-- Allow service role to insert (for triggers/functions)
CREATE POLICY "Allow service role insert on student_profiles"
  ON public.student_profiles
  FOR INSERT
  TO service_role
  USING (true);

CREATE POLICY "Allow service role insert on teacher_profiles"
  ON public.teacher_profiles
  FOR INSERT
  TO service_role
  USING (true);
