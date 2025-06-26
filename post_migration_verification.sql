-- Post-Migration Verification for Enhanced Teacher Dashboard
-- Run this to confirm everything was applied correctly

-- Check if all required tables exist
SELECT 
    '✅ TABLE VERIFICATION' as check_type,
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('exams', 'exam_results', 'parent_notifications')
ORDER BY table_name;

-- Check exams table has all required columns
SELECT 
    '✅ EXAMS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'exams'
ORDER BY ordinal_position;

-- Check exam_results table structure
SELECT 
    '✅ EXAM_RESULTS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'exam_results'
ORDER BY ordinal_position;

-- Check parent_notifications table structure
SELECT 
    '✅ PARENT_NOTIFICATIONS TABLE COLUMNS' as check_type,
    column_name,
    data_type,
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'parent_notifications'
ORDER BY ordinal_position;

-- Check indexes were created
SELECT 
    '✅ INDEXES VERIFICATION' as check_type,
    indexname,
    tablename,
    'CREATED' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('exams', 'exam_results', 'parent_notifications')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check RLS is enabled
SELECT 
    '✅ RLS VERIFICATION' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('exams', 'exam_results', 'parent_notifications')
ORDER BY tablename;

-- Check triggers exist
SELECT 
    '✅ TRIGGERS VERIFICATION' as check_type,
    trigger_name,
    event_object_table as table_name,
    'ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
    AND event_object_table IN ('exams', 'exam_results')
ORDER BY event_object_table, trigger_name;

-- Quick data summary
DO $$
DECLARE
    exam_count INTEGER;
    result_count INTEGER;
    notification_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO exam_count FROM public.exams;
    SELECT COUNT(*) INTO result_count FROM public.exam_results;
    SELECT COUNT(*) INTO notification_count FROM public.parent_notifications;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 MIGRATION VERIFICATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Exams table: % records', exam_count;
    RAISE NOTICE '✅ Exam results table: % records', result_count;
    RAISE NOTICE '✅ Parent notifications table: % records', notification_count;
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Enhanced Teacher Dashboard Status: READY';
    RAISE NOTICE '🌐 Dashboard URL: http://localhost:8080/teacher/dashboard';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next Steps:';
    RAISE NOTICE '1. Test exam creation and publishing';
    RAISE NOTICE '2. Test result entry (manual and Excel)';
    RAISE NOTICE '3. Test parent notification generation';
    RAISE NOTICE '4. Verify all features work as expected';
    RAISE NOTICE '========================================';
END $$;
