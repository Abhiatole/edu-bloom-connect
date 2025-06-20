-- Add status columns to existing tables for better workflow management
-- This script adds explicit status tracking to student_profiles and teacher_profiles

-- Create status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column to student_profiles
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'PENDING';

-- Add status column to teacher_profiles  
ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'PENDING';

-- Update existing records to set proper status based on approval_date
UPDATE student_profiles 
SET status = CASE 
    WHEN approval_date IS NOT NULL THEN 'APPROVED'::user_status
    ELSE 'PENDING'::user_status
END
WHERE status IS NULL;

UPDATE teacher_profiles
SET status = CASE 
    WHEN approval_date IS NOT NULL THEN 'APPROVED'::user_status  
    ELSE 'PENDING'::user_status
END
WHERE status IS NULL;

-- Add rejection fields for better tracking
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by TEXT;

ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by TEXT;

-- Create function to automatically update status when approval_date changes
CREATE OR REPLACE FUNCTION update_user_status()
RETURNS TRIGGER AS $$
BEGIN
    -- For approvals
    IF NEW.approval_date IS NOT NULL AND OLD.approval_date IS NULL THEN
        NEW.status = 'APPROVED';
    END IF;
    
    -- For rejections
    IF NEW.rejected_at IS NOT NULL AND OLD.rejected_at IS NULL THEN
        NEW.status = 'REJECTED';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic status updates
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_status ON student_profiles(status);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_status ON teacher_profiles(status);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id_status ON student_profiles(user_id, status);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id_status ON teacher_profiles(user_id, status);

-- Update RLS policies to include status-based access
DROP POLICY IF EXISTS "Users can view own profile" ON student_profiles;
CREATE POLICY "Users can view own profile" ON student_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Teachers can approve students" ON student_profiles;
CREATE POLICY "Teachers can approve students" ON student_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM teacher_profiles tp 
            WHERE tp.user_id = auth.uid() 
            AND tp.status = 'APPROVED'
        )
    );

DROP POLICY IF EXISTS "Users can view own profile" ON teacher_profiles;
CREATE POLICY "Users can view own profile" ON teacher_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can approve teachers" ON teacher_profiles;
CREATE POLICY "Admins can approve teachers" ON teacher_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role = 'ADMIN' 
            AND up.status = 'APPROVED'
        )
    );

COMMENT ON COLUMN student_profiles.status IS 'Current status of student registration: PENDING, APPROVED, or REJECTED';
COMMENT ON COLUMN teacher_profiles.status IS 'Current status of teacher registration: PENDING, APPROVED, or REJECTED';
COMMENT ON FUNCTION update_user_status() IS 'Automatically updates user status when approval_date or rejected_at changes';
