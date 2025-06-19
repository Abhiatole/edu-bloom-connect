# 🚨 URGENT: Admin Login Fix Guide

## The Problem
The admin registration works, but login fails with:
- 406 "Not Acceptable" errors when querying profiles
- "User profile not found" error during login
- RLS policies are blocking database access

## The Solution (3 Easy Steps)

### Step 1: Run the Database Fix Script

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: "edu-bloom-connect"

2. **Go to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste the ENTIRE content of `URGENT_ADMIN_LOGIN_FIX.sql`**
   - The file is in your project root
   - Select all text and copy it
   - Paste it into the SQL Editor

4. **Run the Script**
   - Click "Run" button
   - Wait for it to complete
   - You should see "Database setup completed successfully!"

### Step 2: Test Admin Login

1. **Update the test script with your admin credentials:**
   ```bash
   # Edit test-admin-login.js
   # Change lines 15-16 to your actual admin email/password:
   const adminEmail = 'your-admin-email@example.com';
   const adminPassword = 'your-admin-password';
   ```

2. **Run the test:**
   ```bash
   node test-admin-login.js
   ```

3. **Expected output:**
   ```
   ✅ Connected to Supabase successfully
   ✅ Login successful!
   ✅ Profile found!
   ✅ Admin can access user profiles
   ✅ Test completed successfully!
   ```

### Step 3: Test in the Web App

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Go to the login page:**
   - Visit http://localhost:5173/login
   - Enter your admin credentials
   - Click "Sign In"

3. **You should be redirected to:**
   - `/superadmin/dashboard` (if successful)

## What the Fix Does

1. **Creates proper user_profiles table** with correct structure
2. **Fixes RLS policies** to allow authenticated users to access profiles
3. **Creates automatic trigger** to create profiles for new users
4. **Creates missing profiles** for existing admin users
5. **Sets admin status to APPROVED** automatically

## If It Still Doesn't Work

1. **Check the SQL script output** - it should show your admin user and profile
2. **Verify your admin user exists** in Supabase Auth Users section
3. **Check if the profile was created** in the user_profiles table
4. **Run the test script** to diagnose the exact issue

## Quick Manual Fix (If needed)

If the automatic fix doesn't work, manually create the admin profile:

1. Go to Supabase Dashboard > Table Editor
2. Open the `user_profiles` table
3. Click "Insert row"
4. Fill in:
   - `user_id`: Your user ID from auth.users table
   - `full_name`: Your full name
   - `email`: Your email
   - `role`: ADMIN
   - `status`: APPROVED
5. Save the row

## Support

If you're still having issues:
1. Share the output of the SQL script
2. Share the output of the test script
3. Check the browser console for any error messages

## Files Created
- `URGENT_ADMIN_LOGIN_FIX.sql` - Database fix script
- `test-admin-login.js` - Login test script
- `ADMIN_LOGIN_FIX_GUIDE.md` - This guide

---

**🎯 Run Step 1 first - that's the most important fix!**
