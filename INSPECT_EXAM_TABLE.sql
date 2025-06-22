-- Inspect the exam table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'exams';

-- Check the exam_type enum if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'exam_type'
    ) THEN
        -- Try to get enum values
        RAISE NOTICE 'exam_type enum exists, checking values';
        -- This is a bit tricky in PostgreSQL, but we can try
        PERFORM enum_range(NULL::exam_type);
    ELSE
        RAISE NOTICE 'exam_type is not an enum type';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error checking enum: %', SQLERRM;
END $$;

-- Check actual values in the exams table
SELECT DISTINCT exam_type FROM exams LIMIT 10;
