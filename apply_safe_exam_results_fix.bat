@echo off
echo.
echo ===============================================
echo    SAFE EXAM_RESULTS COLUMN FIX
echo ===============================================
echo.
echo This script will SAFELY:
echo 1. ✅ Add missing 'created_at' column to exam_results table
echo 2. ✅ Add missing 'updated_at' column if needed
echo 3. ✅ Add other commonly expected columns
echo 4. ❌ Will NOT modify existing column types (to avoid errors)
echo.

set /p confirm="Do you want to proceed with the SAFE fix? (y/n): "
if /i "%confirm%" neq "y" (
    echo Operation cancelled.
    exit /b 1
)

echo.
echo Applying SAFE exam_results table fixes...
echo.

REM Show the SQL content
echo Please run the following SQL in your Supabase SQL Editor:
echo.
echo Content of SAFE_EXAM_RESULTS_FIX.sql:
echo.
type "SAFE_EXAM_RESULTS_FIX.sql"

echo.
echo ===============================================
echo Instructions:
echo 1. Copy the SQL content above
echo 2. Go to your Supabase project dashboard
echo 3. Navigate to SQL Editor
echo 4. Paste and run the SQL
echo 5. Check the output for confirmation messages
echo 6. This version will NOT cause the generated column error
echo ===============================================
echo.

pause
