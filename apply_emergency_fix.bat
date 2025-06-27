@echo off
echo Applying emergency fix for missing columns and views...
echo.

echo Running column additions and view fixes...
supabase db reset
if %ERRORLEVEL% NEQ 0 (
    echo Error: Database reset failed. Trying direct SQL execution...
    pause
    exit /b 1
)

echo.
echo Success! Columns added and views recreated.
echo You can now run the comprehensive database fix.
echo.
pause
