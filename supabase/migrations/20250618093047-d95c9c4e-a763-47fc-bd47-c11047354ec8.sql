
-- Create approval_status enum
CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create exam_type enum
CREATE TYPE exam_type AS ENUM ('JEE', 'NEET', 'CET', 'Boards');

-- Create subject_type enum  
CREATE TYPE subject_type AS ENUM ('Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other');

-- Create student_profiles table
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  class_level INTEGER DEFAULT 11,
  guardian_name VARCHAR(100),
  guardian_mobile VARCHAR(15),
  profile_picture TEXT,
  status approval_status DEFAULT 'PENDING',
  approved_by UUID REFERENCES auth.users(id),
  approval_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create teacher_profiles table
CREATE TABLE teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  subject_expertise subject_type NOT NULL,
  experience_years INTEGER DEFAULT 0,
  profile_picture TEXT,
  status approval_status DEFAULT 'PENDING',
  approved_by UUID REFERENCES auth.users(id),
  approval_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin_profiles table
CREATE TABLE admin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  profile_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name subject_type NOT NULL,
  class_level INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  chapter_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create exams table
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  subject_id UUID REFERENCES subjects(id),
  topic_id UUID REFERENCES topics(id),
  exam_type exam_type NOT NULL,
  class_level INTEGER NOT NULL,
  max_marks INTEGER NOT NULL DEFAULT 100,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create exam_results table
CREATE TABLE exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  marks_obtained INTEGER NOT NULL,
  percentage DECIMAL(5,2),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

-- Create student_insights table for AI analysis
CREATE TABLE student_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  strength_level INTEGER CHECK (strength_level BETWEEN 1 AND 5),
  weak_areas TEXT[],
  strong_areas TEXT[],
  focus_topics TEXT[],
  performance_trend VARCHAR(20) DEFAULT 'stable',
  ai_recommendations TEXT,
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, subject_id)
);

-- Create approval_logs table
CREATE TABLE approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approved_user_id UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  user_type VARCHAR(20) NOT NULL,
  action VARCHAR(20) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default subjects
INSERT INTO subjects (name, class_level) VALUES 
('Physics', 11), ('Chemistry', 11), ('Mathematics', 11), ('Biology', 11), ('English', 11),
('Physics', 12), ('Chemistry', 12), ('Mathematics', 12), ('Biology', 12), ('English', 12);

-- Insert sample topics for Physics Class 11
INSERT INTO topics (subject_id, name, chapter_number) 
SELECT s.id, t.name, t.chapter_number
FROM subjects s,
(VALUES 
  ('Units and Measurements', 1),
  ('Motion in a Straight Line', 2),
  ('Motion in a Plane', 3),
  ('Laws of Motion', 4),
  ('Work, Energy and Power', 5),
  ('System of Particles', 6),
  ('Rotational Motion', 7),
  ('Gravitation', 8),
  ('Mechanical Properties of Solids', 9),
  ('Thermal Properties of Matter', 10)
) AS t(name, chapter_number)
WHERE s.name = 'Physics' AND s.class_level = 11;

-- Enable RLS on all tables
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_profiles
CREATE POLICY "Students can view own profile" ON student_profiles
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all student profiles" ON student_profiles
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Teachers can view approved student profiles" ON teacher_profiles
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid() AND status = 'APPROVED'));

-- RLS Policies for teacher_profiles
CREATE POLICY "Teachers can view own profile" ON teacher_profiles
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage teacher profiles" ON teacher_profiles
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()));

-- RLS Policies for admin_profiles
CREATE POLICY "Admins can manage admin profiles" ON admin_profiles
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()));

-- RLS Policies for subjects (readable by all authenticated users)
CREATE POLICY "All authenticated users can view subjects" ON subjects
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for topics (readable by all authenticated users)
CREATE POLICY "All authenticated users can view topics" ON topics
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for exams
CREATE POLICY "Teachers and admins can manage exams" ON exams
  FOR ALL TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid() AND status = 'APPROVED')
  );

CREATE POLICY "Students can view exams" ON exams
  FOR SELECT TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM student_profiles WHERE user_id = auth.uid() AND status = 'APPROVED')
  );

-- RLS Policies for exam_results
CREATE POLICY "Teachers and admins can manage exam results" ON exam_results
  FOR ALL TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid() AND status = 'APPROVED')
  );

CREATE POLICY "Students can view their own results" ON exam_results
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.id = student_id AND sp.status = 'APPROVED'
    )
  );

-- RLS Policies for student_insights
CREATE POLICY "Admins and teachers can view all insights" ON student_insights
  FOR SELECT TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid() AND status = 'APPROVED')
  );

CREATE POLICY "Students can view their own insights" ON student_insights
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp 
      WHERE sp.user_id = auth.uid() AND sp.id = student_id AND sp.status = 'APPROVED'
    )
  );

CREATE POLICY "Admins and teachers can manage insights" ON student_insights
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()) OR 
    EXISTS (SELECT 1 FROM teacher_profiles WHERE user_id = auth.uid() AND status = 'APPROVED')
  );

-- RLS Policies for approval_logs (admin only)
CREATE POLICY "Only admins can manage approval logs" ON approval_logs
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM admin_profiles WHERE user_id = auth.uid()));
