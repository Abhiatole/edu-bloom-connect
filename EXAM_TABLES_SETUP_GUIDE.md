# Exam Tables Setup Guide

This guide explains how to fix issues with the exam management system when teachers are unable to access the exam creation page or when exams don't display properly.

## Issue Description

Users might experience the following problems:
- Clicking the "New Exam" or "Create First Exam" option redirects to the login page
- Error message about missing relationships between database tables
- Exam management page shows "Database Setup Required" alert

## Solution: Set Up Exam Tables

The issue is caused by missing or incorrectly configured database tables. Follow these steps to fix it:

### Option 1: Run the Setup Script (Recommended)

1. Make sure you have admin access to the Supabase project
2. Set the following environment variables:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```
3. Run the appropriate setup script:
   - On Windows: `setup_exam_tables.bat`
   - On Linux/Mac: `./setup_exam_tables.sh` (make it executable first with `chmod +x setup_exam_tables.sh`)
4. Check the log file `exam_tables_setup.log` for any errors

### Option 2: Run SQL Manually in Supabase Dashboard

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Open the file `public/CREATE_EXAM_TABLES.sql` from this project
4. Copy the contents and paste them into the SQL Editor
5. Run the SQL script
6. Verify the tables are created by checking the Database section

### Option 3: Use the Supabase CLI

If you have the Supabase CLI installed:

1. Log in to Supabase CLI: `supabase login`
2. Run: `supabase db execute --file public/CREATE_EXAM_TABLES.sql`

## Verify the Fix

After setting up the tables:

1. Ask a teacher to log in
2. Navigate to the Teacher Dashboard
3. Click on "Create New Exam" or "Create First Exam"
4. Verify they can access the exam creation page

## Troubleshooting

If issues persist:

1. Check the browser console for error messages
2. Verify that Row Level Security policies are properly set up
3. Make sure the teacher user has the correct role permissions
4. Check if the teacher's account is properly approved

For additional help, please contact the system administrator.
