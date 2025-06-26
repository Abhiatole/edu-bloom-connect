@echo off
echo 🔍 Enhanced Teacher Dashboard - Pre-Migration Check
echo.
echo This script will help you understand your current database structure
echo before applying the complete migration.
echo.
echo 📋 What this check does:
echo 1. ✅ Checks if teacher_profiles and student_profiles tables exist
echo 2. ✅ Shows the structure of existing profile tables
echo 3. ✅ Identifies which columns are available (like 'role', 'status')
echo 4. ✅ Recommends the best migration approach
echo.
echo ⚠️  Run this in your Supabase SQL Editor FIRST
echo.
echo 📄 File to run: pre_migration_check.sql
echo.

set /p choice="Would you like to open the pre-check file now? (y/n): "
if /i "%choice%"=="y" (
    if exist "C:\Program Files\Microsoft VS Code\Code.exe" (
        "C:\Program Files\Microsoft VS Code\Code.exe" pre_migration_check.sql
        echo ✅ Pre-check file opened in VS Code
    ) else (
        notepad pre_migration_check.sql
        echo ✅ Pre-check file opened in Notepad
    )
) else (
    echo 📝 Please manually open: pre_migration_check.sql
)

echo.
echo 🚀 Steps:
echo 1. Copy and paste pre_migration_check.sql into Supabase SQL Editor
echo 2. Run it to see your database structure
echo 3. Then run complete_schema_migration.sql
echo.
echo 💡 The migration will work regardless of your current structure!
echo.
pause
