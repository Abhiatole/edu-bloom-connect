# STATUS UPDATE ISSUE - COMPLETE FIX GUIDE

## Root Cause
The status is not being updated in the database because:

1. **Database Schema Missing**: The `status` column doesn't exist in the database yet
2. **TypeScript Types Out of Sync**: The types don't include the new status fields
3. **Inconsistent Code Logic**: Some methods use `approval_date` filter while others expect `status`

## Step-by-Step Solution

### Step 1: Apply Database Migration
Execute the SQL commands in `APPLY_STATUS_COLUMNS_FIX.sql` in your Supabase SQL Editor:

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the entire content of `APPLY_STATUS_COLUMNS_FIX.sql`
4. Execute the script

This will:
- Create the `user_status` enum type
- Add `status` column to both `student_profiles` and `teacher_profiles`
- Add rejection tracking columns (`rejected_at`, `rejected_by`, `rejection_reason`)
- Create triggers to automatically update status when approval/rejection dates change
- Update existing records to have proper status values
- Create performance indexes

### Step 2: Verify Database Changes
Run the verification queries at the end of the SQL script to confirm:
- Columns were added successfully
- Existing data has proper status values
- Triggers are working

### Step 3: Update TypeScript Types (Already Done)
The `src/integrations/supabase/types.ts` file has been updated to include:
- `user_status` enum type
- Status and rejection fields in both student and teacher profiles

### Step 4: Fixed Code Issues (Already Done)
The `src/services/approvalService.ts` has been updated:
- All methods now consistently use `status` field instead of `approval_date` filters
- `bulkApprove` method now explicitly sets `status: 'APPROVED'`
- Statistics and approval checks use the status field
- Rejection workflow properly sets status and rejection fields

## What Each Service Does Now

### Registration Service (`registrationService.ts`)
- Sets `status: 'PENDING'` when creating new profiles
- Creates user profiles with proper initial status

### Approval Service (`approvalService.ts`)
- `getPendingUsers()` - Uses `status = 'PENDING'` filter
- `approveStudent()` - Sets `status: 'APPROVED'` and `approval_date`
- `approveTeacher()` - Sets `status: 'APPROVED'` and `approval_date`
- `rejectUser()` - Sets `status: 'REJECTED'`, `rejected_at`, and `rejection_reason`
- `bulkApprove()` - Sets `status: 'APPROVED'` for multiple users
- `getApprovalStats()` - Uses status field for statistics
- `isUserApproved()` - Checks `status = 'APPROVED'`

### Database Triggers
- Automatically update `status` when `approval_date` is set
- Automatically update `status` when `rejected_at` is set
- Maintain data consistency

## Testing the Fix

After applying the database migration:

1. **Register a new user** - Status should be 'PENDING'
2. **Approve a user** - Status should change to 'APPROVED'
3. **Reject a user** - Status should change to 'REJECTED'
4. **Check statistics** - Should show correct counts by status
5. **Test bulk operations** - Should update multiple users' status

## Verification Queries

```sql
-- Check status distribution
SELECT 'Students' as table_name, status, COUNT(*) as count
FROM student_profiles 
GROUP BY status
UNION ALL
SELECT 'Teachers' as table_name, status, COUNT(*) as count
FROM teacher_profiles 
GROUP BY status;

-- Check recent registrations
SELECT 'Recent Students' as info, enrollment_no, status, created_at
FROM student_profiles 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'Recent Teachers' as info, employee_id, status, created_at
FROM teacher_profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

## Expected Behavior After Fix

1. **New Registrations**: All new users get `status = 'PENDING'`
2. **Approvals**: Status changes to 'APPROVED' with proper timestamps
3. **Rejections**: Status changes to 'REJECTED' with reason and timestamp
4. **UI Components**: Show real-time status updates
5. **Admin Dashboard**: Filter and manage users by status
6. **Statistics**: Accurate counts of pending, approved, and rejected users

The system will now properly track user status throughout the entire registration and approval workflow.
