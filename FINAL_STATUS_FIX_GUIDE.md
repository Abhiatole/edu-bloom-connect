# DEFINITIVE STATUS UPDATE FIX - Based on Actual Schema

## Current Situation
Your `student_profiles` table already has:
- `status` column using `approval_status` enum ('PENDING', 'APPROVED', 'REJECTED')
- Columns: `id`, `user_id`, `full_name`, `email`, `class_level`, `guardian_name`, `guardian_mobile`, `status`, `approved_by`, `approval_date`, `created_at`, `updated_at`

## What Needs to be Done

### 1. Check and Fix Teacher Profiles Table
Run this query first to see teacher_profiles structure:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'teacher_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### 2. Add Missing Columns to Teacher Profiles
If teacher_profiles doesn't have status column, run:
```sql
-- Add status column to teacher_profiles using the same enum as student_profiles
ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS status approval_status DEFAULT 'PENDING';

-- Add rejection tracking columns to both tables
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);

ALTER TABLE teacher_profiles
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id);

-- Update any existing records without status
UPDATE teacher_profiles
SET status = CASE 
    WHEN approval_date IS NOT NULL THEN 'APPROVED'::approval_status  
    ELSE 'PENDING'::approval_status
END
WHERE status IS NULL;
```

### 3. Create Triggers for Automatic Status Updates
```sql
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

-- Create triggers
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
```

### 4. Code is Already Fixed
✅ The TypeScript types now use `approval_status` enum
✅ The approval service uses `status` field consistently  
✅ The registration service sets `status: 'PENDING'`

## Expected Behavior After Fix

1. **New registrations**: Users get `status = 'PENDING'`
2. **Approvals**: Status changes to 'APPROVED' with approval_date
3. **Rejections**: Status changes to 'REJECTED' with rejection details
4. **Dashboard filtering**: Works by status
5. **Statistics**: Show counts by status

## Test the Fix

After running the SQL commands:

1. **Check status distribution**:
```sql
SELECT 'Students' as table_name, status, COUNT(*) as count
FROM student_profiles GROUP BY status
UNION ALL
SELECT 'Teachers' as table_name, status, COUNT(*) as count  
FROM teacher_profiles GROUP BY status;
```

2. **Test approval**:
```sql
-- Find a pending user
SELECT id, user_id, full_name, status FROM student_profiles WHERE status = 'PENDING' LIMIT 1;

-- Approve them (replace USER_ID with actual value)
UPDATE student_profiles 
SET status = 'APPROVED', approval_date = NOW(), approved_by = 'some-admin-uuid'
WHERE user_id = 'USER_ID';
```

3. **Verify trigger works**:
```sql
-- Update approval_date should auto-update status
UPDATE student_profiles 
SET approval_date = NOW()
WHERE status = 'PENDING' AND user_id = 'some-user-id';

-- Check if status changed to APPROVED
SELECT status FROM student_profiles WHERE user_id = 'some-user-id';
```

The main issue was that your database schema uses `approval_status` enum, not `user_status`, and potentially teacher_profiles doesn't have the status column yet.
