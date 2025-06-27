-- TEACHER APPROVAL ENUM-SAFE QUICK FIX
-- This version properly handles ENUM status columns

-- First, let's check the current status column setup
DO $$
BEGIN
    RAISE NOTICE 'Checking current status column setup...';
    
    -- Check if status column exists and its type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' AND column_name = 'status'
    ) THEN
        DECLARE
            col_type TEXT;
            col_default TEXT;
        BEGIN
            SELECT data_type, column_default 
            INTO col_type, col_default
            FROM information_schema.columns 
            WHERE table_name = 'teacher_profiles' AND column_name = 'status';
            
            RAISE NOTICE '✅ Status column exists - Type: %, Default: %', col_type, col_default;
        END;
    ELSE
        RAISE NOTICE '❌ Status column missing - will create it';
    END IF;
END $$;

-- Check if we have an ENUM type for approval_status
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        RAISE NOTICE '✅ approval_status ENUM type exists';
        
        -- Show ENUM values
        RAISE NOTICE 'ENUM values: %', (
            SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'approval_status')
        );
    ELSE
        RAISE NOTICE '❌ approval_status ENUM type does not exist';
    END IF;
END $$;

-- Check if we have an ENUM type for subject_type
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subject_type') THEN
        RAISE NOTICE '✅ subject_type ENUM type exists';
        
        -- Show ENUM values
        RAISE NOTICE 'ENUM values: %', (
            SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subject_type')
        );
    ELSE
        RAISE NOTICE '❌ subject_type ENUM type does not exist';
    END IF;
END $$;

-- Create ENUM type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
        RAISE NOTICE '✅ Created approval_status ENUM type';
    END IF;
END $$;

-- Handle status column creation/modification safely
DO $$
DECLARE
    current_data_type TEXT;
    enum_exists BOOLEAN;
BEGIN
    -- Check current column type
    SELECT data_type INTO current_data_type
    FROM information_schema.columns 
    WHERE table_name = 'teacher_profiles' AND column_name = 'status';
    
    enum_exists := EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status');
    
    IF current_data_type IS NULL THEN
        -- Column doesn't exist, create it
        IF enum_exists THEN
            ALTER TABLE teacher_profiles ADD COLUMN status approval_status DEFAULT 'PENDING';
            RAISE NOTICE '✅ Added status column with ENUM type';
        ELSE
            ALTER TABLE teacher_profiles ADD COLUMN status TEXT DEFAULT 'PENDING';
            RAISE NOTICE '✅ Added status column with TEXT type';
        END IF;
    ELSIF current_data_type = 'text' AND enum_exists THEN
        -- Convert TEXT to ENUM
        ALTER TABLE teacher_profiles 
        ALTER COLUMN status TYPE approval_status 
        USING CASE 
            WHEN UPPER(status) = 'PENDING' THEN 'PENDING'::approval_status
            WHEN UPPER(status) = 'APPROVED' THEN 'APPROVED'::approval_status
            WHEN UPPER(status) = 'REJECTED' THEN 'REJECTED'::approval_status
            ELSE 'PENDING'::approval_status
        END;
        RAISE NOTICE '✅ Converted status column from TEXT to ENUM';
    ELSE
        RAISE NOTICE '✅ Status column already properly configured';
    END IF;
END $$;

-- Safely update status values
DO $$
DECLARE
    update_count INTEGER;
    current_data_type TEXT;
BEGIN
    -- Get current data type
    SELECT data_type INTO current_data_type
    FROM information_schema.columns 
    WHERE table_name = 'teacher_profiles' AND column_name = 'status';
    
    IF current_data_type = 'USER-DEFINED' THEN
        -- Handle ENUM type - only update NULL values
        UPDATE teacher_profiles 
        SET status = 'PENDING'::approval_status 
        WHERE status IS NULL;
        GET DIAGNOSTICS update_count = ROW_COUNT;
        RAISE NOTICE '✅ Updated % teacher profiles with ENUM PENDING status', update_count;
    ELSE
        -- Handle TEXT type - update NULL and empty values
        UPDATE teacher_profiles 
        SET status = 'PENDING' 
        WHERE status IS NULL OR status = '' OR status NOT IN ('PENDING', 'APPROVED', 'REJECTED');
        GET DIAGNOSTICS update_count = ROW_COUNT;
        RAISE NOTICE '✅ Updated % teacher profiles with TEXT PENDING status', update_count;
    END IF;
END $$;

-- Add other required columns if missing
DO $$
BEGIN
    -- Add approval_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' AND column_name = 'approval_date'
    ) THEN
        ALTER TABLE teacher_profiles ADD COLUMN approval_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Added approval_date column';
    END IF;
    
    -- Add approved_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE teacher_profiles ADD COLUMN approved_by UUID;
        RAISE NOTICE '✅ Added approved_by column';
    END IF;
END $$;

-- Create/Update admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users 
        WHERE id = auth.uid() 
        AND (
            raw_user_meta_data->>'role' IN ('admin', 'ADMIN', 'superadmin', 'SUPERADMIN')
            OR email IN ('admin@edugrowthub.com', 'superadmin@edugrowthub.com')
            OR email LIKE '%admin%@%'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate RLS policies safely
DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "teacher_profiles_admin_read" ON teacher_profiles;
    DROP POLICY IF EXISTS "teacher_profiles_admin_update" ON teacher_profiles;
    DROP POLICY IF EXISTS "teacher_profiles_admin_insert" ON teacher_profiles;
    DROP POLICY IF EXISTS "Teachers can view own profile and admins can view all" ON teacher_profiles;
    DROP POLICY IF EXISTS "Teachers can update own profile and admins can update all" ON teacher_profiles;
    DROP POLICY IF EXISTS "admin_approval_teacher_read" ON teacher_profiles;
    DROP POLICY IF EXISTS "admin_approval_teacher_update" ON teacher_profiles;
    DROP POLICY IF EXISTS "admin_approval_teacher_insert" ON teacher_profiles;
    DROP POLICY IF EXISTS "teachers_read_policy" ON teacher_profiles;
    DROP POLICY IF EXISTS "teachers_update_policy" ON teacher_profiles;
    DROP POLICY IF EXISTS "teachers_insert_policy" ON teacher_profiles;
    
    RAISE NOTICE '✅ Cleaned up old RLS policies';
END $$;

-- Create new RLS policies
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

-- Enable RLS
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;

-- Create missing teacher profiles for confirmed users
DO $$
DECLARE
    teacher_record RECORD;
    created_count INTEGER := 0;
    status_value TEXT;
    current_data_type TEXT;
    subject_data_type TEXT;
    subject_enum_exists BOOLEAN;
BEGIN
    -- Get current data types
    SELECT data_type INTO current_data_type
    FROM information_schema.columns 
    WHERE table_name = 'teacher_profiles' AND column_name = 'status';
    
    SELECT data_type INTO subject_data_type
    FROM information_schema.columns 
    WHERE table_name = 'teacher_profiles' AND column_name = 'subject_expertise';
    
    subject_enum_exists := EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subject_type');
    
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
        -- Insert with appropriate casting based on column types
        BEGIN
            IF current_data_type = 'USER-DEFINED' AND subject_data_type = 'USER-DEFINED' THEN
                -- Both status and subject are ENUMs
                INSERT INTO teacher_profiles (
                    user_id, full_name, email, subject_expertise, 
                    experience_years, status, created_at, updated_at
                ) VALUES (
                    teacher_record.id, teacher_record.full_name, teacher_record.email, 
                    CASE 
                        WHEN teacher_record.subject_expertise IN ('Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other')
                        THEN teacher_record.subject_expertise::subject_type
                        ELSE 'Other'::subject_type
                    END,
                    teacher_record.experience_years, 
                    'PENDING'::approval_status, NOW(), NOW()
                );
            ELSIF current_data_type = 'USER-DEFINED' AND subject_data_type != 'USER-DEFINED' THEN
                -- Status is ENUM, subject is TEXT
                INSERT INTO teacher_profiles (
                    user_id, full_name, email, subject_expertise, 
                    experience_years, status, created_at, updated_at
                ) VALUES (
                    teacher_record.id, teacher_record.full_name, teacher_record.email, 
                    teacher_record.subject_expertise, teacher_record.experience_years, 
                    'PENDING'::approval_status, NOW(), NOW()
                );
            ELSIF current_data_type != 'USER-DEFINED' AND subject_data_type = 'USER-DEFINED' THEN
                -- Status is TEXT, subject is ENUM
                INSERT INTO teacher_profiles (
                    user_id, full_name, email, subject_expertise, 
                    experience_years, status, created_at, updated_at
                ) VALUES (
                    teacher_record.id, teacher_record.full_name, teacher_record.email, 
                    CASE 
                        WHEN teacher_record.subject_expertise IN ('Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other')
                        THEN teacher_record.subject_expertise::subject_type
                        ELSE 'Other'::subject_type
                    END,
                    teacher_record.experience_years, 
                    'PENDING', NOW(), NOW()
                );
            ELSE
                -- Both are TEXT
                INSERT INTO teacher_profiles (
                    user_id, full_name, email, subject_expertise, 
                    experience_years, status, created_at, updated_at
                ) VALUES (
                    teacher_record.id, teacher_record.full_name, teacher_record.email, 
                    teacher_record.subject_expertise, teacher_record.experience_years, 
                    'PENDING', NOW(), NOW()
                );
            END IF;
            created_count := created_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to create profile for %: %', teacher_record.email, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '✅ Created % missing teacher profiles', created_count;
END $$;

-- Create enhanced profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_teacher_profile_creation()
RETURNS trigger AS $$
DECLARE
    current_data_type TEXT;
    subject_data_type TEXT;
BEGIN
    -- Only process if this is a teacher role and user is confirmed
    IF NEW.email_confirmed_at IS NOT NULL 
       AND NEW.raw_user_meta_data ? 'role' 
       AND NEW.raw_user_meta_data->>'role' IN ('teacher', 'TEACHER') THEN
      
      -- Check if profile doesn't already exist
      IF NOT EXISTS (SELECT 1 FROM public.teacher_profiles WHERE user_id = NEW.id) THEN
        
        -- Get current data types
        SELECT data_type INTO current_data_type
        FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' AND column_name = 'status';
        
        SELECT data_type INTO subject_data_type
        FROM information_schema.columns 
        WHERE table_name = 'teacher_profiles' AND column_name = 'subject_expertise';
        
        -- Insert with appropriate casting based on column types
        BEGIN
          IF current_data_type = 'USER-DEFINED' AND subject_data_type = 'USER-DEFINED' THEN
            -- Both status and subject are ENUMs
            INSERT INTO public.teacher_profiles (
              user_id, full_name, email, subject_expertise, 
              experience_years, status, created_at, updated_at
            ) VALUES (
              NEW.id,
              COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
              NEW.email,
              CASE 
                WHEN COALESCE(NEW.raw_user_meta_data->>'subject_expertise', 'Other') IN ('Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other')
                THEN COALESCE(NEW.raw_user_meta_data->>'subject_expertise', 'Other')::subject_type
                ELSE 'Other'::subject_type
              END,
              COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0),
              'PENDING'::approval_status,
              NOW(), NOW()
            );
          ELSIF current_data_type = 'USER-DEFINED' AND subject_data_type != 'USER-DEFINED' THEN
            -- Status is ENUM, subject is TEXT
            INSERT INTO public.teacher_profiles (
              user_id, full_name, email, subject_expertise, 
              experience_years, status, created_at, updated_at
            ) VALUES (
              NEW.id,
              COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
              NEW.email,
              COALESCE(NEW.raw_user_meta_data->>'subject_expertise', 'Other'),
              COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0),
              'PENDING'::approval_status,
              NOW(), NOW()
            );
          ELSIF current_data_type != 'USER-DEFINED' AND subject_data_type = 'USER-DEFINED' THEN
            -- Status is TEXT, subject is ENUM
            INSERT INTO public.teacher_profiles (
              user_id, full_name, email, subject_expertise, 
              experience_years, status, created_at, updated_at
            ) VALUES (
              NEW.id,
              COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
              NEW.email,
              CASE 
                WHEN COALESCE(NEW.raw_user_meta_data->>'subject_expertise', 'Other') IN ('Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Other')
                THEN COALESCE(NEW.raw_user_meta_data->>'subject_expertise', 'Other')::subject_type
                ELSE 'Other'::subject_type
              END,
              COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0),
              'PENDING',
              NOW(), NOW()
            );
          ELSE
            -- Both are TEXT
            INSERT INTO public.teacher_profiles (
              user_id, full_name, email, subject_expertise, 
              experience_years, status, created_at, updated_at
            ) VALUES (
              NEW.id,
              COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
              NEW.email,
              COALESCE(NEW.raw_user_meta_data->>'subject_expertise', 'Other'),
              COALESCE((NEW.raw_user_meta_data->>'experience_years')::integer, 0),
              'PENDING',
              NOW(), NOW()
            );
          END IF;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE LOG 'Failed to create teacher profile for %: %', NEW.email, SQLERRM;
        END;
      END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
DROP TRIGGER IF EXISTS on_auth_user_created_teacher ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed_teacher ON auth.users;

CREATE TRIGGER on_auth_user_created_teacher
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_teacher_profile_creation();

CREATE TRIGGER on_auth_user_confirmed_teacher
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE PROCEDURE public.handle_teacher_profile_creation();

-- Final verification
SELECT 
    '🎯 TEACHER APPROVAL SYSTEM STATUS' as check_name,
    COUNT(*) as total_teachers,
    COUNT(CASE WHEN status::text = 'PENDING' THEN 1 END) as pending_teachers,
    COUNT(CASE WHEN status::text = 'APPROVED' THEN 1 END) as approved_teachers,
    COUNT(CASE WHEN status::text = 'REJECTED' THEN 1 END) as rejected_teachers
FROM teacher_profiles;

-- Test admin function
SELECT 
    '🔧 ADMIN FUNCTION TEST' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_admin')
        THEN 'is_admin function exists ✅'
        ELSE 'is_admin function missing ❌'
    END as result;

-- Check policies
SELECT 
    '🛡️ RLS POLICIES CHECK' as check_name,
    COUNT(*) as teacher_policies_count
FROM pg_policies 
WHERE tablename = 'teacher_profiles';

-- Show status column info
SELECT 
    '📊 STATUS COLUMN INFO' as check_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' AND column_name = 'status';

SELECT '🎉 ENUM-SAFE Teacher Approval System Fix Complete!' as result;
SELECT 'Test at: http://localhost:8081/test/teacher-approval-flow' as next_step;
