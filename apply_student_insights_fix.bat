@echo off
ECHO EduBloomConnect Student Insights Fix Script
ECHO ==========================================
ECHO.
ECHO This script will help fix the student_insights table column and RLS issues.
ECHO.
ECHO Steps:
ECHO 1. First, we'll copy the SQL to add the created_by column
ECHO 2. Then, we'll copy the SQL to fix the RLS policies
ECHO 3. You'll need to paste each into the Supabase SQL Editor and execute them
ECHO.

ECHO Step 1: Add the created_by column to student_insights table
ECHO --------------------------------------------------------
ECHO.
CHOICE /C YN /M "Would you like to copy the ADD_CREATED_BY_COLUMN.sql content to clipboard?"
IF ERRORLEVEL 2 GOTO SKIP_COPY_1
IF ERRORLEVEL 1 GOTO COPY_SQL_1

:COPY_SQL_1
type ADD_CREATED_BY_COLUMN.sql | clip
ECHO.
ECHO SQL content copied to clipboard!
ECHO Please paste it into the Supabase SQL Editor and execute.
ECHO.
ECHO Press any key after executing the SQL to continue...
PAUSE > NUL
GOTO STEP_2

:SKIP_COPY_1
ECHO.
ECHO Please open ADD_CREATED_BY_COLUMN.sql manually and copy its contents to 
ECHO the Supabase SQL Editor. Then execute it to add the missing column.
ECHO.
ECHO Press any key after executing the SQL to continue...
PAUSE > NUL

:STEP_2
ECHO.
ECHO Step 2: Fix the RLS policies for student_insights table
ECHO -----------------------------------------------------
ECHO.
CHOICE /C YN /M "Would you like to copy the FIX_STUDENT_INSIGHTS_RLS.sql content to clipboard?"
IF ERRORLEVEL 2 GOTO SKIP_COPY_2
IF ERRORLEVEL 1 GOTO COPY_SQL_2

:COPY_SQL_2
type FIX_STUDENT_INSIGHTS_RLS.sql | clip
ECHO.
ECHO SQL content copied to clipboard!
ECHO Please paste it into the Supabase SQL Editor and execute.
ECHO.
PAUSE
GOTO END

:SKIP_COPY_2
ECHO.
ECHO Please open FIX_STUDENT_INSIGHTS_RLS.sql manually and copy its contents to 
ECHO the Supabase SQL Editor. Then execute it to fix the RLS policies.
ECHO.
PAUSE

:END
ECHO.
ECHO Script complete. The student_insights table should now have the created_by column
ECHO and the RLS policies should be properly configured.
ECHO.
ECHO After applying these fixes, restart your development server:
ECHO npm run dev
ECHO.
PAUSE
