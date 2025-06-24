# Student Names Update Guide

This guide will help you update the generic "Student" names in your EduBloomConnect application with real student names and enrollment numbers.

## What This Update Does

The update will:

1. Add an `enrollment_no` column to the `student_profiles` table if it doesn't already exist
2. Update existing student profiles with real names and enrollment numbers:
   - Student 1 → John Smith (S1000)
   - Student 2 → Emma Johnson (S1001)
   - Student 3 → Michael Davis (S1002)
   - Student 4 → Sophia Wilson (S1003)
   - Student 5 → Daniel Taylor (S1004)
   - Student 6 → Olivia Brown (S1005)

## How to Apply the Update

### Option 1: Using the Provided Scripts

#### Windows Users
1. Open a command prompt in your project directory
2. Run the batch script:
   ```
   update_student_names.bat
   ```

#### Unix/Linux/Mac Users
1. Open a terminal in your project directory
2. Make the script executable:
   ```
   chmod +x update_student_names.sh
   ```
3. Run the script:
   ```
   ./update_student_names.sh
   ```

### Option 2: Manual SQL Execution

If the scripts don't work or you prefer to run the SQL manually:

1. Open your Supabase Dashboard and navigate to the SQL Editor
2. Copy the contents of `UPDATE_STUDENT_NAMES_ENROLLMENTS.sql`
3. Paste the SQL into the editor and execute it

## Verification

After applying the update:

1. Navigate to any page that displays student information
2. Verify that real names (like "John Smith") are shown instead of generic "Student" placeholders
3. Confirm that enrollment numbers (like "S1000") are displayed correctly

## Customizing the Student Data

If you want to use different student names or enrollment numbers:

1. Open `UPDATE_STUDENT_NAMES_ENROLLMENTS.sql` in a text editor
2. Modify the `INSERT INTO temp_student_data` section with your preferred names and enrollment numbers
3. Save the file and run the update again

## Troubleshooting

If you encounter any issues:

- Check the Supabase dashboard for any SQL errors
- Make sure the `student_profiles` table exists in your database
- Confirm that you have the necessary permissions to modify the database

For further assistance, please contact the development team.
