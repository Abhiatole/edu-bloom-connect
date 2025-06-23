-- COMPREHENSIVE DATABASE FIX FOR ADMIN DASHBOARD
-- This script will fix all issues with fetching users in the admin dashboard

-- Step 1: Verify the tables exist and have the correct structure
DO $$
BEGIN
  -- Check if student_profiles exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'student_profiles'
  ) THEN
    -- Create student_profiles table
    CREATE TABLE student_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      class_level INTEGER DEFAULT 11,
      parent_email VARCHAR(255),
      enrollment_no VARCHAR(20),
      guardian_name VARCHAR(100),
      guardian_mobile VARCHAR(15),
      profile_picture TEXT,
      status TEXT DEFAULT 'PENDING',
      approved_by UUID REFERENCES auth.users(id),
      approval_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created student_profiles table';
  END IF;

  -- Check if teacher_profiles exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'teacher_profiles'
  ) THEN
    -- Create teacher_profiles table
    CREATE TABLE teacher_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      subject_expertise VARCHAR(50) NOT NULL,
      experience_years INTEGER DEFAULT 0,
      profile_picture TEXT,
      status TEXT DEFAULT 'PENDING',
      approved_by UUID REFERENCES auth.users(id),
      approval_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    RAISE NOTICE 'Created teacher_profiles table';
  END IF;
END $$;

-- Step 2: Add required columns if they don't exist
DO $$
BEGIN
  -- Add required columns to student_profiles if missing
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'student_profiles'
    AND column_name = 'enrollment_no'
  ) THEN
    ALTER TABLE student_profiles ADD COLUMN enrollment_no VARCHAR(20);
    RAISE NOTICE 'Added enrollment_no column to student_profiles';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'student_profiles'
    AND column_name = 'parent_email'
  ) THEN
    ALTER TABLE student_profiles ADD COLUMN parent_email VARCHAR(255);
    RAISE NOTICE 'Added parent_email column to student_profiles';
  END IF;
  
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'student_profiles'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE student_profiles ADD COLUMN status TEXT DEFAULT 'PENDING';
    RAISE NOTICE 'Added status column to student_profiles';
  END IF;
  
  -- Add required columns to teacher_profiles if missing
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'teacher_profiles'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE teacher_profiles ADD COLUMN status TEXT DEFAULT 'PENDING';
    RAISE NOTICE 'Added status column to teacher_profiles';
  END IF;
END $$;

-- Step 3: Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_user_meta_data->>'role' IN ('admin', 'ADMIN', 'superadmin') OR
            raw_app_meta_data->>'role' IN ('admin', 'ADMIN', 'superadmin')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
COMMENT ON FUNCTION is_admin IS 'Checks if the current user is an admin';
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin TO anon;
GRANT EXECUTE ON FUNCTION is_admin TO service_role;

-- Step 4: Enable RLS on tables
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies
DO $$
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON student_profiles;', E'\n')
        FROM pg_policies
        WHERE tablename = 'student_profiles'
    );
    
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON teacher_profiles;', E'\n')
        FROM pg_policies
        WHERE tablename = 'teacher_profiles'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- Step 6: Create new policies that allow admins to view and edit all profiles
-- Student profiles policies
CREATE POLICY "anyone_can_view_student_profiles" ON student_profiles
    FOR SELECT USING (true);

CREATE POLICY "students_can_update_own_profile" ON student_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    ) WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "students_can_insert_own_profile" ON student_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

-- Teacher profiles policies
CREATE POLICY "anyone_can_view_teacher_profiles" ON teacher_profiles
    FOR SELECT USING (true);

CREATE POLICY "teachers_can_update_own_profile" ON teacher_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    ) WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "teachers_can_insert_own_profile" ON teacher_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

-- Step 7: Insert sample data if tables are empty
DO $$
BEGIN
    -- Insert sample student if no students exist
    IF NOT EXISTS (SELECT 1 FROM student_profiles LIMIT 1) THEN
        INSERT INTO student_profiles (user_id, full_name, email, class_level, enrollment_no, parent_email, status)
        VALUES 
            ('00000000-0000-0000-0000-000000000001', 'Student One', 'student1@example.com', 11, 'ENR001', 'parent1@example.com', 'PENDING'),
            ('00000000-0000-0000-0000-000000000002', 'Student Two', 'student2@example.com', 12, 'ENR002', 'parent2@example.com', 'PENDING');
        
        RAISE NOTICE 'Inserted sample student data';
    END IF;
    
    -- Insert sample teacher if no teachers exist
    IF NOT EXISTS (SELECT 1 FROM teacher_profiles LIMIT 1) THEN
        INSERT INTO teacher_profiles (user_id, full_name, email, subject_expertise, experience_years, status)
        VALUES 
            ('00000000-0000-0000-0000-000000000003', 'Teacher One', 'teacher1@example.com', 'Physics', 5, 'PENDING'),
            ('00000000-0000-0000-0000-000000000004', 'Teacher Two', 'teacher2@example.com', 'Mathematics', 8, 'PENDING');
        
        RAISE NOTICE 'Inserted sample teacher data';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting sample data: %', SQLERRM;
END $$;

-- Step 8: Grant proper permissions
GRANT SELECT, INSERT, UPDATE ON public.student_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.teacher_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.student_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.teacher_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.student_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.teacher_profiles TO service_role;

SELECT 'Admin dashboard database fix completed successfully!' as result;
