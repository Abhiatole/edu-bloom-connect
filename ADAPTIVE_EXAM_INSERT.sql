-- ADAPTIVE EXAM INSERT
-- This script tries multiple approaches to insert an exam based on different schema variants

DO $$
DECLARE
    exam_id UUID;
    user_id UUID;
    subject_id UUID;
    teacher_id UUID;
    migration_schema_exists BOOLEAN;
    type_schema_exists BOOLEAN;
    has_subject_column BOOLEAN;
    has_subject_id_column BOOLEAN;
    has_exam_date_column BOOLEAN;
    has_created_by_column BOOLEAN;
    has_created_by_teacher_id_column BOOLEAN;
BEGIN
    -- Check which columns exist in the exams table
    SELECT 
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'subject') INTO has_subject_column;
    
    SELECT 
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'subject_id') INTO has_subject_id_column;
    
    SELECT 
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'exam_date') INTO has_exam_date_column;
        
    SELECT 
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'created_by') INTO has_created_by_column;
    
    SELECT 
        EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'created_by_teacher_id') INTO has_created_by_teacher_id_column;
    
    -- Check if we're using the migration schema or the type schema
    IF has_subject_id_column AND has_created_by_column AND NOT has_exam_date_column THEN
        migration_schema_exists := TRUE;
        type_schema_exists := FALSE;
        RAISE NOTICE 'Using migration schema (subject_id, created_by)';
    ELSIF has_subject_column AND has_exam_date_column AND has_created_by_teacher_id_column THEN
        migration_schema_exists := FALSE;
        type_schema_exists := TRUE;
        RAISE NOTICE 'Using type schema (subject, exam_date, created_by_teacher_id)';
    ELSE
        migration_schema_exists := FALSE;
        type_schema_exists := FALSE;
        RAISE NOTICE 'Using hybrid schema approach';
    END IF;
    
    -- Try to get IDs for various scenarios
    BEGIN
        SELECT id INTO user_id FROM auth.users LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No users found in auth.users';
    END;
    
    BEGIN
        SELECT id INTO subject_id FROM subjects LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No subjects found';
    END;
    
    BEGIN
        SELECT id INTO teacher_id FROM teacher_profiles LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'No teacher profiles found';
    END;
    
    -- APPROACH 1: Try migration schema first if it exists
    IF migration_schema_exists THEN
        RAISE NOTICE 'Trying migration schema insert';
        
        INSERT INTO exams (
            title,
            subject_id,
            exam_type,
            class_level,
            max_marks,
            created_by
        ) 
        VALUES (
            'Adaptive Exam - Migration Schema',
            subject_id,
            'Boards',
            10,
            100,
            user_id
        )
        RETURNING id INTO exam_id;
        
        IF exam_id IS NOT NULL THEN
            RAISE NOTICE 'Migration schema insert successful with ID: %', exam_id;
            RETURN;
        END IF;
    END IF;
    
    -- APPROACH 2: Try type schema if it exists
    IF type_schema_exists THEN
        RAISE NOTICE 'Trying type schema insert';
        
        INSERT INTO exams (
            title,
            subject,
            class_level,
            exam_type,
            exam_date,
            created_by_teacher_id,
            total_marks
        ) 
        VALUES (
            'Adaptive Exam - Type Schema',
            'Physics',
            10,
            'Boards',
            current_timestamp,
            teacher_id,
            100
        )
        RETURNING id INTO exam_id;
        
        IF exam_id IS NOT NULL THEN
            RAISE NOTICE 'Type schema insert successful with ID: %', exam_id;
            RETURN;
        END IF;
    END IF;
    
    -- APPROACH 3: Minimal approach with just required fields
    RAISE NOTICE 'Trying minimal required fields approach';
    
    BEGIN
        INSERT INTO exams (
            title,
            exam_type,
            class_level
        ) 
        VALUES (
            'Adaptive Exam - Minimal Fields',
            'Boards',
            10
        )
        RETURNING id INTO exam_id;
        
        IF exam_id IS NOT NULL THEN
            RAISE NOTICE 'Minimal fields insert successful with ID: %', exam_id;
            RETURN;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Minimal fields approach failed: %', SQLERRM;
    END;
    
    -- APPROACH 4: Subject field approach
    IF has_subject_column THEN
        RAISE NOTICE 'Trying with subject field';
        
        BEGIN
            INSERT INTO exams (
                title,
                subject,
                exam_type,
                class_level,
                max_marks
            ) 
            VALUES (
                'Adaptive Exam - With Subject',
                'Physics',
                'Boards',
                10,
                100
            )
            RETURNING id INTO exam_id;
            
            IF exam_id IS NOT NULL THEN
                RAISE NOTICE 'Subject field insert successful with ID: %', exam_id;
                RETURN;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Subject field approach failed: %', SQLERRM;
        END;
    END IF;
    
    -- APPROACH 5: Subject_id field approach
    IF has_subject_id_column AND subject_id IS NOT NULL THEN
        RAISE NOTICE 'Trying with subject_id field';
        
        BEGIN
            INSERT INTO exams (
                title,
                subject_id,
                exam_type,
                class_level,
                max_marks
            ) 
            VALUES (
                'Adaptive Exam - With Subject ID',
                subject_id,
                'Boards',
                10,
                100
            )
            RETURNING id INTO exam_id;
            
            IF exam_id IS NOT NULL THEN
                RAISE NOTICE 'Subject ID field insert successful with ID: %', exam_id;
                RETURN;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Subject ID field approach failed: %', SQLERRM;
        END;
    END IF;
    
    RAISE EXCEPTION 'All exam insert approaches failed';
END $$;

-- Verify which exams were created
SELECT 
    id, 
    title, 
    class_level,
    exam_type,
    created_at
FROM exams 
WHERE title LIKE 'Adaptive Exam%'
ORDER BY created_at DESC 
LIMIT 10;
