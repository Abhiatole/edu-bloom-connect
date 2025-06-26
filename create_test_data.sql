-- Sample Test Data for Enhanced Teacher Dashboard Testing
-- Run this to create sample data for testing your dashboard

-- Note: Replace 'your-teacher-id' with an actual authenticated teacher user ID
-- You can get this from Supabase Auth or your application

DO $$
DECLARE
    test_teacher_id UUID := 'test-teacher-123'; -- Replace with actual teacher ID
    test_exam_id UUID;
    test_student_id UUID := 'test-student-123'; -- Replace with actual student ID
BEGIN
    -- Insert sample exam (only if you have a valid teacher ID)
    INSERT INTO public.exams (
        id,
        title,
        subject,
        exam_date,
        exam_time,
        duration_minutes,
        max_marks,
        class_level,
        exam_type,
        description,
        status,
        created_by_teacher_id
    ) VALUES (
        gen_random_uuid(),
        'Sample Mathematics Test',
        'Mathematics',
        CURRENT_DATE + INTERVAL '3 days',
        '10:00:00',
        90,
        100,
        11,
        'Internal',
        'Sample exam for testing the dashboard functionality',
        'PUBLISHED',
        test_teacher_id
    ) 
    ON CONFLICT DO NOTHING
    RETURNING id INTO test_exam_id;

    -- Insert sample exam result
    IF test_exam_id IS NOT NULL THEN
        INSERT INTO public.exam_results (
            exam_id,
            student_id,
            enrollment_no,
            student_name,
            subject,
            exam_name,
            marks_obtained,
            max_marks,
            feedback
        ) VALUES (
            test_exam_id,
            test_student_id,
            'STU001',
            'Sample Student One',
            'Mathematics',
            'Sample Mathematics Test',
            85,
            100,
            'Excellent performance in algebra and trigonometry'
        ),
        (
            test_exam_id,
            gen_random_uuid(),
            'STU002',
            'Sample Student Two',
            'Mathematics',
            'Sample Mathematics Test',
            78,
            100,
            'Good work, needs improvement in geometry'
        ),
        (
            test_exam_id,
            gen_random_uuid(),
            'STU003',
            'Sample Student Three',
            'Mathematics',
            'Sample Mathematics Test',
            92,
            100,
            'Outstanding performance across all topics'
        )
        ON CONFLICT DO NOTHING;

        RAISE NOTICE '✅ Sample exam and results created successfully!';
        RAISE NOTICE 'Exam ID: %', test_exam_id;
        RAISE NOTICE '📊 3 sample results added with marks: 85, 78, 92';
        
    ELSE
        RAISE NOTICE '⚠️  Could not create sample exam. Please ensure you have a valid teacher ID.';
        RAISE NOTICE 'Replace test_teacher_id with your actual authenticated teacher user ID.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next Steps:';
    RAISE NOTICE '1. Update the teacher ID in this script with your actual user ID';
    RAISE NOTICE '2. Re-run this script to create test data';
    RAISE NOTICE '3. Visit http://localhost:8080/teacher/dashboard to see the data';
    RAISE NOTICE '4. Test all dashboard features with this sample data';
    
END $$;

-- Show current data counts
SELECT 
    'CURRENT_DATA_SUMMARY' as info,
    (SELECT COUNT(*) FROM public.exams) as exam_count,
    (SELECT COUNT(*) FROM public.exam_results) as result_count,
    (SELECT COUNT(*) FROM public.parent_notifications) as notification_count;

-- Show sample of created data
SELECT 
    '📚 SAMPLE EXAMS' as data_type,
    title,
    subject,
    exam_date,
    status,
    max_marks
FROM public.exams
ORDER BY created_at DESC
LIMIT 3;

SELECT 
    '📊 SAMPLE RESULTS' as data_type,
    student_name,
    marks_obtained,
    max_marks,
    percentage,
    feedback
FROM public.exam_results
ORDER BY created_at DESC
LIMIT 5;
