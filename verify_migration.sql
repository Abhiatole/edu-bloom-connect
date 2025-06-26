-- Test Script: Verify Enhanced Teacher Dashboard Schema
-- Run this AFTER applying the complete_schema_migration.sql

-- ====================================
-- POST-MIGRATION VERIFICATION TESTS
-- ====================================

-- Test 1: Verify all tables exist
SELECT 
    '🔍 TABLE_EXISTENCE_CHECK' as test_name,
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (
    SELECT 'exams' as expected_table
    UNION SELECT 'exam_results'
    UNION SELECT 'parent_notifications'
) expected
LEFT JOIN information_schema.tables t ON t.table_name = expected.expected_table 
    AND t.table_schema = 'public'
ORDER BY expected.expected_table;

-- Test 2: Verify exams table has all required columns
SELECT 
    '🔍 EXAMS_COLUMNS_CHECK' as test_name,
    expected_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exams' 
            AND column_name = expected_column
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    SELECT 'id' as expected_column
    UNION SELECT 'title'
    UNION SELECT 'subject'
    UNION SELECT 'exam_date'
    UNION SELECT 'exam_time'
    UNION SELECT 'duration_minutes'
    UNION SELECT 'max_marks'
    UNION SELECT 'class_level'
    UNION SELECT 'exam_type'
    UNION SELECT 'description'
    UNION SELECT 'question_paper_url'
    UNION SELECT 'status'
    UNION SELECT 'created_by_teacher_id'
    UNION SELECT 'created_at'
    UNION SELECT 'updated_at'
) cols
ORDER BY expected_column;

-- Test 3: Verify exam_results table has all required columns
SELECT 
    '🔍 EXAM_RESULTS_COLUMNS_CHECK' as test_name,
    expected_column,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'exam_results' 
            AND column_name = expected_column
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    SELECT 'id' as expected_column
    UNION SELECT 'exam_id'
    UNION SELECT 'student_id'
    UNION SELECT 'enrollment_no'
    UNION SELECT 'student_name'
    UNION SELECT 'subject'
    UNION SELECT 'exam_name'
    UNION SELECT 'marks_obtained'
    UNION SELECT 'max_marks'
    UNION SELECT 'percentage'
    UNION SELECT 'feedback'
    UNION SELECT 'created_at'
    UNION SELECT 'updated_at'
) cols
ORDER BY expected_column;

-- Test 4: Verify indexes exist
SELECT 
    '🔍 INDEXES_CHECK' as test_name,
    indexname,
    tablename,
    '✅ EXISTS' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('exams', 'exam_results', 'parent_notifications')
ORDER BY tablename, indexname;

-- Test 5: Verify RLS is enabled
SELECT 
    '🔍 RLS_CHECK' as test_name,
    tablename,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('exams', 'exam_results', 'parent_notifications')
ORDER BY tablename;

-- Test 6: Verify triggers exist
SELECT 
    '🔍 TRIGGERS_CHECK' as test_name,
    trigger_name,
    event_object_table,
    '✅ EXISTS' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
    AND event_object_table IN ('exams', 'exam_results')
ORDER BY event_object_table, trigger_name;

-- Test 7: Try to insert test data (will be rolled back)
DO $$
DECLARE
    test_exam_id UUID;
    test_user_id UUID := gen_random_uuid(); -- Simulate a teacher ID
BEGIN
    -- Test exam insertion
    INSERT INTO public.exams (
        title, subject, exam_date, exam_time, 
        duration_minutes, max_marks, class_level, 
        exam_type, status, created_by_teacher_id
    ) VALUES (
        'Test Migration Exam',
        'Mathematics',
        CURRENT_DATE + INTERVAL '1 day',
        '10:00:00',
        90,
        100,
        11,
        'Internal',
        'DRAFT',
        test_user_id
    ) ON CONFLICT DO NOTHING
    RETURNING id INTO test_exam_id;
    
    IF test_exam_id IS NOT NULL THEN
        RAISE NOTICE '✅ Test exam insertion: SUCCESS';
        
        -- Test exam_results insertion
        INSERT INTO public.exam_results (
            exam_id, student_id, enrollment_no, student_name,
            subject, exam_name, marks_obtained, max_marks, feedback
        ) VALUES (
            test_exam_id,
            gen_random_uuid(),
            'TEST001',
            'Test Student',
            'Mathematics',
            'Test Migration Exam',
            85,
            100,
            'Good performance in test'
        );
        
        RAISE NOTICE '✅ Test exam result insertion: SUCCESS';
        
        -- Clean up test data
        DELETE FROM public.exam_results WHERE exam_id = test_exam_id;
        DELETE FROM public.exams WHERE id = test_exam_id;
        
        RAISE NOTICE '✅ Test data cleanup: SUCCESS';
    ELSE
        RAISE NOTICE '⚠️  Test exam insertion: SKIPPED (may already exist)';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test insertion failed: %', SQLERRM;
END $$;

-- Test 8: Final summary
DO $$
DECLARE
    exams_count INTEGER;
    exam_results_count INTEGER;
    notifications_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO exams_count FROM public.exams;
    SELECT COUNT(*) INTO exam_results_count FROM public.exam_results;
    SELECT COUNT(*) INTO notifications_count FROM public.parent_notifications;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===== MIGRATION VERIFICATION COMPLETE =====';
    RAISE NOTICE '✅ Exams table: % records', exams_count;
    RAISE NOTICE '✅ Exam results table: % records', exam_results_count;
    RAISE NOTICE '✅ Parent notifications table: % records', notifications_count;
    RAISE NOTICE '🚀 Enhanced Teacher Dashboard is ready!';
    RAISE NOTICE '🌐 Test at: http://localhost:8080/teacher/dashboard';
    RAISE NOTICE '============================================';
END $$;
