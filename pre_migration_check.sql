-- Pre-Migration Check: Verify Profile Tables Structure
-- Run this BEFORE the main migration to understand your database structure

-- Check if profile tables exist
SELECT 
    'PROFILE_TABLES_CHECK' as check_type,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    SELECT 'teacher_profiles' as expected_table
    UNION SELECT 'student_profiles'
) expected
LEFT JOIN information_schema.tables t ON t.table_name = expected.expected_table 
    AND t.table_schema = 'public'
ORDER BY expected.expected_table;

-- If teacher_profiles exists, show its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_profiles' AND table_schema = 'public') THEN
        RAISE NOTICE '';
        RAISE NOTICE '=== TEACHER_PROFILES TABLE STRUCTURE ===';
        FOR rec IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'teacher_profiles'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  Column: % | Type: % | Nullable: %', rec.column_name, rec.data_type, rec.is_nullable;
        END LOOP;
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  teacher_profiles table does not exist';
        RAISE NOTICE '   RLS policies will be created without teacher validation';
    END IF;
END $$;

-- If student_profiles exists, show its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_profiles' AND table_schema = 'public') THEN
        RAISE NOTICE '';
        RAISE NOTICE '=== STUDENT_PROFILES TABLE STRUCTURE ===';
        FOR rec IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'student_profiles'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  Column: % | Type: % | Nullable: %', rec.column_name, rec.data_type, rec.is_nullable;
        END LOOP;
        
        -- Check if status column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'student_profiles' 
            AND column_name = 'status' 
            AND table_schema = 'public'
        ) THEN
            RAISE NOTICE '✅ status column exists - will use for student validation';
        ELSE
            RAISE NOTICE '⚠️  status column missing - will skip status validation';
        END IF;
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  student_profiles table does not exist';
        RAISE NOTICE '   RLS policies will allow all authenticated users';
    END IF;
END $$;

-- Show recommended action
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT STEPS:';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_profiles' AND table_schema = 'public') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_profiles' AND table_schema = 'public') THEN
        RAISE NOTICE '✅ Both profile tables exist - you can run the complete migration safely';
    ELSE
        RAISE NOTICE '⚠️  Some profile tables are missing';
        RAISE NOTICE '   The migration will still work but with simplified RLS policies';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📄 Run complete_schema_migration.sql to apply the full schema';
    RAISE NOTICE '🎯 Your Enhanced Teacher Dashboard will work regardless of profile table structure';
END $$;
