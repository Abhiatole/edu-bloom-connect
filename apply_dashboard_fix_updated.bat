@echo off
echo =====================================================
echo EDU-BLOOM-CONNECT DASHBOARD FIX SCRIPT
echo =====================================================
echo This script will help apply all fixes to resolve
echo database errors, missing tables, and RLS issues.
echo.

echo Choose how you want to apply the fixes:
echo 1. Copy SQL scripts to clipboard (to paste in Supabase SQL Editor)
echo 2. Help with running scripts through Supabase CLI
echo.

choice /C 12 /M "Enter your choice"
if %ERRORLEVEL% == 1 goto COPY_SQL
if %ERRORLEVEL% == 2 goto CLI_HELP

:COPY_SQL
echo.
echo Which SQL fix do you want to copy?
echo 1. Complete database fix (FINAL_DATABASE_API_FIX.sql)
echo 2. RLS policy fix - includes column fixes (COMPREHENSIVE_RLS_FIX.sql)
echo 3. Application verification test (FINAL_APPLICATION_TEST.sql)
echo.

choice /C 123 /M "Enter your choice"
if %ERRORLEVEL% == 1 goto COPY_DB_FIX
if %ERRORLEVEL% == 2 goto COPY_RLS_FIX
if %ERRORLEVEL% == 3 goto COPY_TEST

:COPY_DB_FIX
type FINAL_DATABASE_API_FIX.sql | clip
echo.
echo FINAL_DATABASE_API_FIX.sql copied to clipboard!
echo Paste it into the Supabase SQL Editor and execute.
echo.
goto END

:COPY_RLS_FIX
type COMPREHENSIVE_RLS_FIX.sql | clip
echo.
echo COMPREHENSIVE_RLS_FIX.sql copied to clipboard!
echo This script will fix the "column examiner_id does not exist" error.
echo Paste it into the Supabase SQL Editor and execute.
echo.
goto END

:COPY_TEST
type FINAL_APPLICATION_TEST.sql | clip
echo.
echo FINAL_APPLICATION_TEST.sql copied to clipboard!
echo Paste it into the Supabase SQL Editor and execute to verify all fixes.
echo.
goto END

:CLI_HELP
echo.
echo To apply fixes using Supabase CLI, run the following commands:
echo.
echo 1. First, make sure you're logged in to Supabase:
echo    supabase login
echo.
echo 2. Then run each script in this order:
echo    supabase db push -f FINAL_DATABASE_API_FIX.sql
echo    supabase db push -f COMPREHENSIVE_RLS_FIX.sql
echo    supabase db push -f FINAL_APPLICATION_TEST.sql
echo.
echo 3. Finally, start your development server:
echo    npm run dev
echo.

:END
echo.
echo =====================================================
echo If you still experience issues:
echo =====================================================
echo 1. Run only COMPREHENSIVE_RLS_FIX.sql for the "column examiner_id" error
echo 2. Use the FINAL_APPLICATION_TEST.sql to check all database components
echo 3. Check the browser console for any remaining errors
echo.
pause
