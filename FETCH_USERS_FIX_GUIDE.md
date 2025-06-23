# Fix for "Failed to Fetch Users" in Admin Dashboard

## The Issue

The admin dashboard is failing to fetch users from the Supabase database. This issue can occur due to:

1. Missing or incorrectly structured tables (`student_profiles` and `teacher_profiles`)
2. Restrictive Row Level Security (RLS) policies preventing data access
3. Missing required columns that the UI expects

## The Solution

Follow these steps to fix the issue:

### Step 1: Apply the Database Fix Script

1. Log in to your **Supabase Dashboard**
2. Navigate to the **SQL Editor**
3. Copy the entire content of the `FIX_FETCH_USERS_ADMIN_DASHBOARD.sql` file
4. Paste it into the SQL Editor
5. Click **Run** to execute the script
6. You should see the message: "Admin dashboard database fix completed successfully!"

### Step 2: Restart the Application

1. If the development server is running, stop it (Ctrl+C in the terminal)
2. Start it again with:
   ```
   npm run dev
   ```

### Step 3: Test the Admin Dashboard

1. Navigate to: http://localhost:8082/admin/approvals
2. You should now see the pending users loaded correctly
3. The approve/reject buttons should work as expected

## What the Fix Does

The fix script performs several important operations:

1. **Verifies and Creates Tables**: Ensures `student_profiles` and `teacher_profiles` tables exist with the correct structure
2. **Adds Required Columns**: Adds any missing columns that the UI expects
3. **Creates Admin Check Function**: Implements the `is_admin()` function to identify admin users
4. **Updates RLS Policies**: Creates permissive policies that allow:
   - Anyone to view profiles (for listing in the dashboard)
   - Users to update their own profiles
   - Admins to update any profile (for approval)
5. **Adds Sample Data**: Inserts sample data if tables are empty (for testing)
6. **Grants Permissions**: Ensures proper database access permissions are set

## Troubleshooting

If you still encounter issues after applying the fix:

1. **Check Console Errors**: Open your browser's developer tools (F12) and look for specific error messages
2. **Verify Admin Role**: Make sure your user account has the admin role in Supabase
   ```sql
   SELECT id, email, raw_user_meta_data->'role' as role 
   FROM auth.users 
   WHERE id = '[YOUR_USER_ID]';
   ```
3. **Verify Table Structure**: Check if the tables have the expected columns
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'student_profiles';
   ```
4. **Check Data**: Verify there's data in the tables
   ```sql
   SELECT COUNT(*) FROM student_profiles;
   SELECT COUNT(*) FROM teacher_profiles;
   ```

If problems persist, you may need to look at the specific error messages in the browser console or server logs for more targeted troubleshooting.
