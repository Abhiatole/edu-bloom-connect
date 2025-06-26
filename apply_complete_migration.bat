@echo off
echo 🔍 Enhanced Teacher Dashboard - Complete Schema Migration
echo.
echo This script will help you apply the complete database schema migration.
echo.
echo 📋 What this migration does:
echo 1. ✅ Checks current database state
echo 2. ✅ Creates missing tables (exams, exam_results, parent_notifications)
echo 3. ✅ Adds missing columns to existing tables
echo 4. ✅ Sets up indexes and triggers
echo 5. ✅ Configures Row Level Security policies
echo 6. ✅ Verifies everything is working
echo.
echo ⚠️  IMPORTANT: Apply this in your Supabase SQL Editor
echo.
echo 📄 File to apply: complete_schema_migration.sql
echo.
echo 🚀 Steps:
echo 1. Open your Supabase Dashboard
echo 2. Go to SQL Editor
echo 3. Copy and paste the contents of complete_schema_migration.sql
echo 4. Click "Run" to execute the migration
echo 5. Check the output for success messages
echo.

set /p choice="Would you like to open the migration file now? (y/n): "
if /i "%choice%"=="y" (
    if exist "C:\Program Files\Microsoft VS Code\Code.exe" (
        "C:\Program Files\Microsoft VS Code\Code.exe" complete_schema_migration.sql
        echo ✅ Migration file opened in VS Code
    ) else (
        notepad complete_schema_migration.sql
        echo ✅ Migration file opened in Notepad
    )
) else (
    echo 📝 Please manually open: complete_schema_migration.sql
)

echo.
echo 🎯 After applying the migration:
echo - Visit: http://localhost:8080/teacher/dashboard
echo - Test exam creation, result entry, and parent notifications
echo - All features should work without errors
echo.
echo 🔧 If you encounter issues:
echo - Check the SQL execution logs in Supabase
echo - Ensure you have proper permissions
echo - Contact support if needed
echo.
pause
