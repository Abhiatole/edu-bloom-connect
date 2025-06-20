# 🚨 CORRECTED SQL SCRIPT - ENUM ERROR FIXED

## ❌ Previous Error
```
ERROR: 22P02: invalid input value for enum user_role: "SUPER_ADMIN"
```

## ✅ Root Cause
The database enum `user_role` only accepts: `"ADMIN" | "TEACHER" | "STUDENT" | "PARENT"`
There is no `"SUPER_ADMIN"` value in the enum.

## 🔧 CORRECTED SQL SCRIPT

**Copy and run this CORRECTED version in Supabase SQL Editor:**

```sql
-- CORRECTED ADMIN APPROVAL RLS FIX
-- This version uses the correct enum values for user_role

-- Allow admins to update student profiles
DROP POLICY IF EXISTS "Admins can update student profiles" ON student_profiles;
CREATE POLICY "Admins can update student profiles" ON student_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN'
            AND approval_status = 'APPROVED'
        )
    );

-- Allow admins to update teacher profiles  
DROP POLICY IF EXISTS "Admins can update teacher profiles" ON teacher_profiles;
CREATE POLICY "Admins can update teacher profiles" ON teacher_profiles
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN'
            AND approval_status = 'APPROVED'
        )
    );

-- Also add SELECT policies so admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all student profiles" ON student_profiles;
CREATE POLICY "Admins can view all student profiles" ON student_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN'
            AND approval_status = 'APPROVED'
        )
    );

DROP POLICY IF EXISTS "Admins can view all teacher profiles" ON teacher_profiles;
CREATE POLICY "Admins can view all teacher profiles" ON teacher_profiles
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN'
            AND approval_status = 'APPROVED'
        )
    );

SELECT 'CORRECTED: Admin approval RLS policies updated successfully!' as result;
```

## 🎯 Key Changes Made

1. **Removed** `'SUPER_ADMIN'` from `role IN ('ADMIN', 'SUPER_ADMIN')`
2. **Changed to** `role = 'ADMIN'` only
3. **Added** SELECT policies for admin dashboard viewing

## 📋 Next Steps

1. **Run the corrected SQL script** in Supabase SQL Editor
2. **Test with**: `node test-approval-fix.js`
3. **Verify in dashboard**: `/admin/approvals`

## ✅ Expected Result

After running the corrected SQL:
- ✅ No enum errors
- ✅ Policies created successfully
- ✅ Admin approval buttons work
- ✅ Users move between tabs immediately

The enum error has been fixed - run the corrected SQL script!
