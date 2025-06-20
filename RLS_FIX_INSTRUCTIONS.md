# Steps to Fix Database Access Issues (500 Errors)

We're seeing 500 Internal Server Error responses from Supabase when trying to access the database tables, and "Action Failed: Database policies prevent this action" messages in the UI. This is due to issues with Row Level Security (RLS) policies. Follow these steps to resolve the issues:

## Step 1: Disable RLS Temporarily

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of the `EMERGENCY_RLS_FIX.sql` script (or open it from the database diagnostics page)
4. Run the script to temporarily disable RLS and drop all existing policies

## Step 2: Verify Access Works Without RLS

After running the fix script, you should:

1. Go to the Database Diagnostics page (/superadmin/database-diagnostics)
2. Click "Run Diagnostics" to verify that you can now access all tables
3. Check that the queries return data and not 500 errors

## Step 3: Re-enable RLS with Permissive Policies

Once you've confirmed that you can access the tables without RLS, you can re-enable RLS with more permissive policies:

1. Go back to the Supabase SQL Editor
2. Copy and paste the contents of the `RLS_REACTIVATION.sql` script (or open it from the database diagnostics page)
3. Run the script to enable RLS with permissive policies

## Step 4: Final Testing

1. Run diagnostics again to ensure everything still works with the new RLS policies
2. Test the main application features:
   - Registration (for all user types)
   - Email confirmation
   - Login
   - Profile access
   - Admin approvals

## Understanding the Issue

The 500 errors were occurring because the RLS policies were preventing access to the profile tables. RLS in Supabase acts as a security filter that restricts which rows a user can access. 

The temporary solution disables RLS completely, which is not recommended for production, but helps diagnose the issue. The `RLS_REACTIVATION.sql` script sets up permissive policies that still maintain some security while allowing the application to function properly.

In the future, you may want to implement more restrictive policies based on your application's security requirements.
