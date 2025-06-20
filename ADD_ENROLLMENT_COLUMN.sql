-- ADD MISSING ENROLLMENT_NO COLUMN
-- This script will add the enrollment_no column to student_profiles if it's missing
-- and populate it with auto-generated enrollment numbers

-- First, check if the column exists
DO $$
BEGIN
    -- Check if enrollment_no column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'student_profiles' 
        AND column_name = 'enrollment_no'
    ) THEN
        -- Add the enrollment_no column
        ALTER TABLE student_profiles ADD COLUMN enrollment_no TEXT;
        
        -- Generate enrollment numbers for existing students
        UPDATE student_profiles 
        SET enrollment_no = 'STU' || LPAD(id::text, 6, '0') 
        WHERE enrollment_no IS NULL;
        
        -- Make it NOT NULL after populating
        ALTER TABLE student_profiles ALTER COLUMN enrollment_no SET NOT NULL;
        
        -- Add unique constraint
        ALTER TABLE student_profiles ADD CONSTRAINT student_profiles_enrollment_no_unique UNIQUE (enrollment_no);
        
        RAISE NOTICE 'enrollment_no column added and populated successfully';
    ELSE
        RAISE NOTICE 'enrollment_no column already exists';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    'VERIFICATION:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'student_profiles'
AND column_name = 'enrollment_no';

-- Show sample enrollment numbers
SELECT 
    'SAMPLE ENROLLMENT NUMBERS:' as info,
    id,
    enrollment_no,
    status
FROM student_profiles 
ORDER BY id 
LIMIT 5;
