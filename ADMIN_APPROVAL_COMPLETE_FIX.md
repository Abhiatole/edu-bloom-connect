# 🚨 ADMIN APPROVAL BUTTON FIX - COMPLETE SOLUTION

## 🎯 Root Cause Identified
The "Approve User" button doesn't work because the **RLS (Row Level Security) policies** prevent admins from updating other users' profiles.

Current RLS policies only allow users to update their own profiles:
```sql
FOR SELECT USING (user_id = auth.uid())  -- Only own profile
```

But admins need to update OTHER users' profiles for approval.

## ✅ SOLUTION 1: Fix RLS Policies (RECOMMENDED)

### Step 1: Run this SQL in Supabase SQL Editor

Copy and paste this entire SQL script into your Supabase SQL Editor and run it:

```sql
-- FIX ADMIN APPROVAL - Add UPDATE policies for admins
-- This script adds the missing RLS policies to allow admins to approve/reject users

-- First, let's add policies to allow admins to view all profiles (needed for the dashboard)
DROP POLICY IF EXISTS "Admins can view all student profiles" ON student_profiles;
CREATE POLICY "Admins can view all student profiles" ON student_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR  -- Users can see their own
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('ADMIN', 'SUPER_ADMIN') 
            AND approval_status = 'APPROVED'
        )
    );

DROP POLICY IF EXISTS "Admins can view all teacher profiles" ON teacher_profiles;
CREATE POLICY "Admins can view all teacher profiles" ON teacher_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR  -- Users can see their own
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('ADMIN', 'SUPER_ADMIN') 
            AND approval_status = 'APPROVED'
        )
    );

-- Now add the critical UPDATE policies for admins to approve/reject users
DROP POLICY IF EXISTS "Admins can update student profiles" ON student_profiles;
CREATE POLICY "Admins can update student profiles" ON student_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR  -- Users can update their own
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('ADMIN', 'SUPER_ADMIN') 
            AND approval_status = 'APPROVED'
        )
    );

DROP POLICY IF EXISTS "Admins can update teacher profiles" ON teacher_profiles;
CREATE POLICY "Admins can update teacher profiles" ON teacher_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR  -- Users can update their own
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('ADMIN', 'SUPER_ADMIN') 
            AND approval_status = 'APPROVED'
        )
    );

-- Also add policies to allow admins to view all user profiles
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
CREATE POLICY "Admins can view all user profiles" ON user_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles up 
            WHERE up.user_id = auth.uid() 
            AND up.role IN ('ADMIN', 'SUPER_ADMIN') 
            AND up.approval_status = 'APPROVED'
        )
    );

SELECT 'RLS Policies Updated Successfully! Admin approval should now work.' as result;
```

### Step 2: Test the Fix
1. Go to your admin dashboard: `/admin/approvals`
2. Click "Approve" on any pending user
3. The user should now move to the "Approved" tab immediately
4. No console errors should appear

## ✅ SOLUTION 2: Alternative Code Fix (If you can't access SQL Editor)

If you can't run SQL scripts, here's a code-based workaround:

Replace the approval logic to use the service role for updates:

```typescript
// In SimplifiedUserApprovals.tsx, replace the handleApproval function:

const handleApproval = async (userId: string, action: 'approve' | 'reject') => {
  setActionLoading(userId);
  try {
    const userToUpdate = allUsers.find(u => u.user_id === userId);
    if (!userToUpdate) throw new Error('User not found');

    const approvalDate = action === 'approve' ? new Date().toISOString() : null;

    // Use service role client for admin operations
    const serviceClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY  // Add this to .env
    );

    let updateError;
    if (userToUpdate.role === 'STUDENT') {
      const { error } = await serviceClient
        .from('student_profiles')
        .update({ 
          approval_date: approvalDate,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      updateError = error;
    } else if (userToUpdate.role === 'TEACHER') {
      const { error } = await serviceClient
        .from('teacher_profiles')
        .update({ 
          approval_date: approvalDate,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      updateError = error;
    }

    if (updateError) throw updateError;

    toast({
      title: `${action === 'approve' ? 'Approved' : 'Rejected'}!`,
      description: `${userToUpdate.display_name} has been ${action}d successfully.`,
    });

    await fetchAllData();
  } catch (error: any) {
    console.error('Approval error:', error);
    toast({
      title: "Error", 
      description: error.message || `Failed to ${action} user`,
      variant: "destructive"
    });
  } finally {
    setActionLoading(null);
    setConfirmDialog(null);
  }
};
```

## 🧪 How to Test

1. **Before Fix**: Click "Approve" → No change, user stays pending
2. **After Fix**: Click "Approve" → User immediately moves to "Approved" tab

## 📋 Technical Details

- **Issue**: RLS policies blocking admin updates
- **Root Cause**: `FOR UPDATE USING (user_id = auth.uid())` only allows self-updates
- **Fix**: Add admin role check to UPDATE policies
- **Result**: Admins can now approve/reject any user

## 🎉 Expected Result

After applying the fix:
✅ Approve button works immediately
✅ Users move between tabs in real-time  
✅ Statistics update automatically
✅ No console errors
✅ Success toast notifications show

The admin approval system will be fully functional!
