-- STATUS COLUMNS ALREADY EXIST - NO MIGRATION NEEDED
-- 
-- After checking your actual database schema, both student_profiles and teacher_profiles
-- already have all the necessary columns:
-- 
-- ✅ status (using approval_status enum)
-- ✅ rejection_reason, rejected_at, rejected_by
-- ✅ proper indexes and triggers
--
-- The issue was in TypeScript code, not database schema.
-- See TEACHER_REGISTRATION_STATUS_COMPLETELY_FIXED.md for details.
--
-- This verification query confirms your schema is correct:

SELECT 'Schema Check' as info, 
       table_name, 
       column_name, 
       data_type,
       is_nullable,
       column_default
FROM information_schema.columns 
WHERE table_name IN ('student_profiles', 'teacher_profiles')
AND column_name IN ('status', 'rejection_reason', 'rejected_at', 'rejected_by', 'full_name', 'email')
ORDER BY table_name, column_name;

-- Step 3: Add rejection tracking columns to student_profiles
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);

-- Step 4: Add rejection tracking columns to teacher_profiles
ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);

-- Step 5: Update existing records to have proper status (if needed)
UPDATE student_profiles 
SET status = CASE 
    WHEN approval_date IS NOT NULL THEN 'APPROVED'::approval_status
    ELSE 'PENDING'::approval_status
END
WHERE status IS NULL;

UPDATE teacher_profiles
SET status = CASE 
    WHEN approval_date IS NOT NULL THEN 'APPROVED'::approval_status  
    ELSE 'PENDING'::approval_status
END
WHERE status IS NULL;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_status ON student_profiles(status);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_status ON teacher_profiles(status);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id_status ON student_profiles(user_id, status);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id_status ON teacher_profiles(user_id, status);

-- Step 7: Create function to automatically update status
CREATE OR REPLACE FUNCTION update_user_status()
RETURNS TRIGGER AS $$
BEGIN
    -- For approvals
    IF NEW.approval_date IS NOT NULL AND (OLD.approval_date IS NULL OR OLD.approval_date IS DISTINCT FROM NEW.approval_date) THEN
        NEW.status = 'APPROVED';
    END IF;
    
    -- For rejections
    IF NEW.rejected_at IS NOT NULL AND (OLD.rejected_at IS NULL OR OLD.rejected_at IS DISTINCT FROM NEW.rejected_at) THEN
        NEW.status = 'REJECTED';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create triggers for automatic status updates
DROP TRIGGER IF EXISTS student_status_trigger ON student_profiles;
CREATE TRIGGER student_status_trigger
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_status();

DROP TRIGGER IF EXISTS teacher_status_trigger ON teacher_profiles;
CREATE TRIGGER teacher_status_trigger
    BEFORE UPDATE ON teacher_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_status();

-- Step 9: Verification queries (run these to confirm everything worked)
SELECT 'Student Status Distribution' as info, status, COUNT(*) as count
FROM student_profiles 
GROUP BY status
UNION ALL
SELECT 'Teacher Status Distribution' as info, status, COUNT(*) as count
FROM teacher_profiles 
GROUP BY status;

-- Check that columns were added to teacher_profiles
SELECT 'Teacher Columns Added' as info, column_name
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
AND column_name IN ('status', 'rejection_reason', 'rejected_at', 'rejected_by');

-- Check student_profiles structure (should already exist)
SELECT 'Student Columns Check' as info, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'student_profiles' 
AND column_name IN ('status', 'rejection_reason', 'rejected_at', 'rejected_by');
