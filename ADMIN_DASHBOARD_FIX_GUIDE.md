## Admin Approval System Fix Guide

This guide will help you fix the admin dashboard where database policies are preventing admins from approving pending users.

### The Issue

The Row Level Security (RLS) policies in Supabase are too restrictive and preventing admin users from updating the status of pending users in the student_profiles and teacher_profiles tables.

### The Solution

1. **Apply the RLS Fix Script**

   You need to run the `FIX_ADMIN_APPROVAL_RLS.sql` script in the Supabase SQL Editor. This script will:
   - Enable RLS on the relevant tables
   - Drop conflicting policies
   - Create proper policies for admin approval
   - Add status columns if needed
   - Create indexes for better performance

   **Steps:**
   1. Log in to your Supabase dashboard
   2. Navigate to the SQL Editor
   3. Copy and paste the entire content of the `FIX_ADMIN_APPROVAL_RLS.sql` file
   4. Click "Run" to execute the script
   5. You should see the message: "Admin approval RLS policies have been successfully updated!"

2. **Test the Admin Dashboard**

   After applying the fix:
   1. Start the development server (if not already running):
      ```
      npm run dev
      ```
   2. Navigate to the admin approvals page: http://localhost:8082/admin/approvals
   3. Try to approve/reject a pending user
   4. The operation should now succeed without errors

### What the Fix Does

The script creates these essential policies:

1. **For Student Profiles:**
   - "Students can view own profile and admins can view all"
   - "Students can update own profile and admins can update all"

2. **For Teacher Profiles:**
   - "Teachers can view own profile and admins can view all"
   - "Teachers can update own profile and admins can update all"

3. **Add Required Columns** (if missing):
   - status (TEXT): to track approval state (PENDING, APPROVED, REJECTED)
   - approved_by (UUID): to track which admin approved the user

4. **Create Indexes** for better performance:
   - On status columns
   - On user_id columns

### Troubleshooting

If you still encounter issues after applying the fix:

1. Check the browser console for specific error messages
2. Ensure your admin user has the correct role ('admin' or 'ADMIN') in the Supabase user metadata
3. Verify that the tables have the correct structure with:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name IN ('student_profiles', 'teacher_profiles')
   AND table_schema = 'public'
   ORDER BY table_name, ordinal_position;
   ```
4. Check if the policies were correctly applied:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename IN ('student_profiles', 'teacher_profiles')
   AND schemaname = 'public';
   ```

### Need More Help?

If you continue to experience issues, you can try running the more comprehensive `ADMIN_APPROVAL_RLS_FIX.sql` script, which includes additional policy cleanup and a specialized admin check function.
