@echo off
echo ================================
echo Student Registration Flow Fix
echo ================================
echo.
echo This script will apply the database schema updates for the complete student registration flow.
echo.
echo What this script will do:
echo - Add missing columns to student_profiles (student_mobile, parent_email, enrollment_no)
echo - Create batches table for NEET/JEE/CET/Other
echo - Create student_batches relationship table
echo - Create subjects table if missing
echo - Create student_subjects relationship table if missing
echo - Set up automatic enrollment number generation
echo - Create helper functions for registration
echo - Apply proper RLS policies
echo.
echo Prerequisites:
echo 1. Access to your Supabase project
echo 2. SQL Editor open in Supabase dashboard
echo.
pause

echo.
echo Opening SQL file...
start notepad fix_student_registration_flow.sql

echo.
echo ===== INSTRUCTIONS =====
echo.
echo 1. Copy the ENTIRE content from the opened SQL file
echo 2. Go to your Supabase project dashboard
echo 3. Navigate to SQL Editor
echo 4. Paste the content and click "Run"
echo 5. Wait for all operations to complete
echo 6. Verify the success messages in the output
echo.
echo After running the SQL script:
echo - Test student registration with new fields
echo - Verify enrollment number generation
echo - Check subject and batch selection
echo - Test email confirmation flow
echo.
echo The updated registration form now includes:
echo ✅ Student Mobile Number (required)
echo ✅ Parent Mobile Number (required) 
echo ✅ Subject Selection (Physics/Chemistry/Biology/Mathematics)
echo ✅ Batch Selection (NEET/JEE/CET/Other)
echo ✅ Automatic Enrollment Number Generation
echo ✅ Complete Email Confirmation Flow
echo ✅ Approval Workflow for Teachers/Admin
echo.
pause

echo.
echo ===== POST-INSTALLATION TESTING =====
echo.
echo To test the complete flow:
echo.
echo 1. STUDENT REGISTRATION:
echo    - Go to /register/student
echo    - Fill all required fields including mobile numbers
echo    - Select at least one subject and one batch
echo    - Submit registration
echo.
echo 2. EMAIL CONFIRMATION:
echo    - Check email for confirmation link
echo    - Click the link to confirm
echo    - Verify enrollment number is generated
echo.
echo 3. STUDENT DASHBOARD:
echo    - After admin approval, login as student
echo    - Verify enrollment number is displayed
echo    - Check enrolled subjects and batches are shown
echo    - Verify performance data loads correctly
echo.
echo 4. ADMIN/TEACHER APPROVAL:
echo    - Login as admin or teacher
echo    - Check pending student approvals
echo    - Approve students and verify workflow
echo.
echo ===== TROUBLESHOOTING =====
echo.
echo If you encounter issues:
echo.
echo 1. DATABASE ERRORS:
echo    - Ensure all existing data is backed up
echo    - Check Supabase logs for specific error messages
echo    - Verify RLS policies are applied correctly
echo.
echo 2. REGISTRATION ERRORS:
echo    - Clear browser cache and try again
echo    - Check browser console for JavaScript errors
echo    - Verify all required fields are filled
echo.
echo 3. EMAIL CONFIRMATION ISSUES:
echo    - Check Supabase Auth settings
echo    - Verify email templates are configured
echo    - Check spam folder for confirmation emails
echo.
echo For additional support, check the application logs and contact the development team.
echo.
pause
