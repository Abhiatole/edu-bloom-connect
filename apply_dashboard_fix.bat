@echo off
ECHO EduBloomConnect Dashboard Fix Script
ECHO ====================================
ECHO.
ECHO This script will help run the final database fixes for the dashboard.
ECHO.
ECHO Steps:
ECHO 1. Copy the FINAL_DATABASE_API_FIX.sql content to Supabase SQL Editor
ECHO 2. Run the SQL to apply all fixes
ECHO 3. Test the dashboard functionality
ECHO.
ECHO If you still experience issues after running the SQL, you can use:
ECHO - database-helpers.improved.ts (robust multi-layer approach)
ECHO - database-helpers.emergency.ts (fallback that always assumes tables exist)
ECHO.

CHOICE /C YN /M "Would you like to copy the FINAL_DATABASE_API_FIX.sql content to clipboard?"
IF ERRORLEVEL 2 GOTO SKIP_COPY
IF ERRORLEVEL 1 GOTO COPY_SQL

:COPY_SQL
type FINAL_DATABASE_API_FIX.sql | clip
ECHO.
ECHO SQL content copied to clipboard!
ECHO Please paste it into the Supabase SQL Editor and execute.
ECHO.
ECHO After running the SQL, restart your development server with:
ECHO npm run dev
ECHO.
PAUSE
GOTO END

:SKIP_COPY
ECHO.
ECHO Please open FINAL_DATABASE_API_FIX.sql manually and copy its contents to 
ECHO the Supabase SQL Editor. Then execute it to apply all fixes.
ECHO.
PAUSE

:END
ECHO Script complete. If you continue to experience issues after applying the fixes,
ECHO consider using one of the alternative database-helpers.ts versions provided.
ECHO.
