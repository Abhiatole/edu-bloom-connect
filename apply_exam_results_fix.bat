@echo off
echo.
echo ===============================================
echo    FIXING EXAM_RESULTS CREATED_AT COLUMN
echo ===============================================
echo.
echo This script will:
echo 1. ✅ Add missing 'created_at' column to exam_results table
echo 2. ✅ Add missing 'updated_at' column if needed
echo 3. ✅ Add other commonly expected columns
echo 4. ✅ Update data types as needed
echo.

set /p confirm="Do you want to proceed? (y/n): "
if /i "%confirm%" neq "y" (
    echo Operation cancelled.
    exit /b 1
)

echo.
echo Applying exam_results table fixes...
echo.

REM Copy the SQL content to clipboard and show instructions
echo Please run the following SQL in your Supabase SQL Editor:
echo.
echo Content of FIX_EXAM_RESULTS_CREATED_AT.sql:
echo.
type "FIX_EXAM_RESULTS_CREATED_AT.sql"

echo.
echo ===============================================
echo Instructions:
echo 1. Copy the SQL content above
echo 2. Go to your Supabase project dashboard
echo 3. Navigate to SQL Editor
echo 4. Paste and run the SQL
echo 5. Check the output for confirmation messages
echo ===============================================
echo.

pause
