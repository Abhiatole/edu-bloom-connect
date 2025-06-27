@echo off
echo =====================================
echo EduGrowHub Complete Fix Application
echo =====================================
echo.
echo This script will apply all the comprehensive fixes for:
echo - Student registration 500 errors
echo - Email confirmation issues
echo - Teacher and student approval workflows
echo - Dashboard bugs and missing features
echo - Supabase database schema fixes
echo.
echo IMPORTANT: This will apply significant database changes.
echo Make sure you have a backup of your Supabase database before proceeding.
echo.
pause

echo.
echo ===== STEP 1: DATABASE FIXES =====
echo.
echo Opening the comprehensive database fix SQL file...
start notepad comprehensive_database_fix.sql

echo.
echo INSTRUCTIONS FOR DATABASE FIXES:
echo.
echo 1. Copy the ENTIRE content from the opened SQL file
echo 2. Go to your Supabase project dashboard
echo 3. Navigate to: SQL Editor
echo 4. Paste the content into a new query
echo 5. Click "Run" to execute all fixes
echo.
echo This will fix:
echo - RLS policies for registration
echo - Student registration bypass function
echo - Teacher registration function
echo - Batches and subjects tables
echo - Exam results and timetables
echo - Approval functions
echo - Sample data for testing
echo.
pause

echo.
echo ===== STEP 2: VERIFY FIXES APPLIED =====
echo.
echo After running the SQL, verify the following in Supabase:
echo.
echo 1. Tables exist: student_profiles, teacher_profiles, user_profiles
echo 2. Tables exist: batches, subjects, student_batches, student_subjects
echo 3. Functions exist: register_student_bypass, register_teacher_profile
echo 4. Functions exist: approve_student, approve_teacher
echo.
echo You can run these verification queries in SQL Editor:
echo   SELECT proname FROM pg_proc WHERE proname LIKE '%%student%%';
echo   SELECT tablename FROM pg_tables WHERE tablename LIKE '%%profiles%%';
echo.
pause

echo.
echo ===== STEP 3: RESTART DEVELOPMENT SERVER =====
echo.
echo The React application has been updated with:
echo - Unified registration service (fixes 500 errors)
echo - Enhanced email confirmation handling
echo - Fixed approval workflows
echo - New auth/confirm route
echo.
echo Starting the development server...
echo.

cd /d "%~dp0"

echo Installing any new dependencies...
call npm install

echo.
echo Starting the development server on http://localhost:8082
echo.
call npm run dev

pause
