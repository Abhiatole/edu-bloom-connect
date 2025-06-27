-- TEACHER APPROVAL QUICK FIX
-- Run this script to fix the most common teacher approval issues

DO $$
BEGIN
    RAISE NOTICE 'Starting Teacher Approval System Fix...';
    
    -- Step 1: Ensure required columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE teacher_profiles ADD COLUMN status TEXT DEFAULT 'PENDING';
        RAISE NOTICE '✅ Added status column to teacher_profiles';
    ELSE
        RAISE NOTICE '✅ Status column already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' AND column_name = 'approval_date'
    ) THEN
        ALTER TABLE teacher_profiles ADD COLUMN approval_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added approval_date column to teacher_profiles';
    ELSE
        RAISE NOTICE '✅ Approval_date column already exists';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE teacher_profiles ADD COLUMN approved_by UUID;
        RAISE NOTICE '✅ Added approved_by column to teacher_profiles';
    ELSE
        RAISE NOTICE '✅ Approved_by column already exists';
    END IF;
    
    -- Step 2: Check if status column is ENUM and handle accordingly
    DECLARE
        status_data_type TEXT;
        update_count INTEGER;
    BEGIN
        -- Get the data type of the status column
        SELECT data_type INTO status_data_type
        FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' AND column_name = 'status';
        
        -- Handle ENUM type differently
        IF status_data_type = 'USER-DEFINED' THEN
            -- For ENUM, only update NULL values (not empty strings)
            UPDATE teacher_profiles 
            SET status = 'PENDING' 
            WHERE status IS NULL;
            GET DIAGNOSTICS update_count = ROW_COUNT;
            RAISE NOTICE '✅ Updated % teacher profiles with ENUM PENDING status', update_count;
        ELSE
            -- For TEXT type, update both NULL and empty strings
            UPDATE teacher_profiles 
            SET status = 'PENDING' 
            WHERE status IS NULL OR status = '';
            GET DIAGNOSTICS update_count = ROW_COUNT;
            RAISE NOTICE '✅ Updated % teacher profiles with TEXT PENDING status', update_count;
        END IF;
    END;
END $$;

-- Step 3: Create/Update admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check multiple ways a user can be admin
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            -- Check role in metadata
            raw_user_meta_data->>'role' IN ('admin', 'ADMIN', 'superadmin', 'SUPERADMIN')
            -- Check specific admin emails
            OR email IN ('admin@edugrowthub.com', 'superadmin@edugrowthub.com')
            -- You can add more admin emails here
            OR email LIKE '%admin%@%'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Drop problematic policies
DROP POLICY IF EXISTS "teacher_profiles_admin_read" ON teacher_profiles;
DROP POLICY IF EXISTS "teacher_profiles_admin_update" ON teacher_profiles;
DROP POLICY IF EXISTS "teacher_profiles_admin_insert" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can view own profile and admins can view all" ON teacher_profiles;
DROP POLICY IF EXISTS "Teachers can update own profile and admins can update all" ON teacher_profiles;
DROP POLICY IF EXISTS "admin_approval_teacher_read" ON teacher_profiles;
DROP POLICY IF EXISTS "admin_approval_teacher_update" ON teacher_profiles;
DROP POLICY IF EXISTS "admin_approval_teacher_insert" ON teacher_profiles;

-- Step 5: Create simple, working policies
CREATE POLICY "teachers_read_policy" ON teacher_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );

CREATE POLICY "teachers_update_policy" ON teacher_profiles
    FOR UPDATE USING (
        is_admin() OR user_id = auth.uid()
    ) WITH CHECK (
        is_admin() OR user_id = auth.uid()
    );

CREATE POLICY "teachers_insert_policy" ON teacher_profiles
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR is_admin()
    );

-- Step 6: Ensure RLS is enabled
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create missing teacher profiles for confirmed users
DO $$
DECLARE
    teacher_record RECORD;
    created_count INTEGER := 0;
BEGIN
    -- Find confirmed teachers without profiles
    FOR teacher_record IN 
        SELECT 
            au.id,
            au.email,
            COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
            COALESCE(au.raw_user_meta_data->>'subject_expertise', 'Other') as subject_expertise,
            COALESCE((au.raw_user_meta_data->>'experience_years')::integer, 0) as experience_years
        FROM auth.users au
        LEFT JOIN teacher_profiles tp ON au.id = tp.user_id
        WHERE au.raw_user_meta_data->>'role' IN ('teacher', 'TEACHER')
        AND au.email_confirmed_at IS NOT NULL
        AND tp.user_id IS NULL
    LOOP
        INSERT INTO teacher_profiles (
            user_id,
            full_name,
            email,
            subject_expertise,
            experience_years,
            status,
            created_at,
            updated_at
        ) VALUES (
            teacher_record.id,
            teacher_record.full_name,
            teacher_record.email,
            teacher_record.subject_expertise,
            teacher_record.experience_years,
            'PENDING',
            NOW(),
            NOW()
        );
        created_count := created_count + 1;
    END LOOP;
    
    RAISE NOTICE '✅ Created % missing teacher profiles', created_count;
END $$;

-- Step 8: Create enhanced profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_teacher_profile_creation()
RETURNS trigger AS $$
BEGIN
  -- Only process if this is a teacher role and user is confirmed
  IF NEW.email_confirmed_at IS NOT NULL 
     AND NEW.raw_user_meta_data ? 'role' 
     AND NEW.raw_user_meta_data->>'role' IN ('teacher', 'TEACHER') THEN
    
    -- Check if profile doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM public.teacher_profiles WHERE user_id = NEW.id) THEN
      INSERT INTO public.teacher_profiles (
        user_id,
        full_name,
        email,
        subject_expertise,
        experience_years,
        status,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'subject_expertise', 'Other'),
        COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0),
        'PENDING',
        NOW(),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers and create new ones
DROP TRIGGER IF EXISTS on_auth_user_created_teacher ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed_teacher ON auth.users;

-- Trigger for immediate creation (if email confirmation disabled)
CREATE TRIGGER on_auth_user_created_teacher
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_teacher_profile_creation();

-- Trigger for creation after email confirmation
CREATE TRIGGER on_auth_user_confirmed_teacher
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE PROCEDURE public.handle_teacher_profile_creation();

-- Final verification
SELECT 
    'TEACHER APPROVAL SYSTEM STATUS' as check_name,
    COUNT(*) as total_teachers,
    COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_teachers,
    COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as approved_teachers
FROM teacher_profiles;

-- Test admin function
SELECT 
    'ADMIN FUNCTION TEST' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_admin')
        THEN 'is_admin function exists ✅'
        ELSE 'is_admin function missing ❌'
    END as result;

-- Check policies
SELECT 
    'RLS POLICIES CHECK' as check_name,
    COUNT(*) as teacher_policies_count
FROM pg_policies 
WHERE tablename = 'teacher_profiles';

SELECT '🎉 Teacher Approval System Fix Complete!' as result;
SELECT 'You can now test at: /test/teacher-approval-flow' as next_step;
