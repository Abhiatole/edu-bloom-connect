@echo off
REM Enhanced Teacher Dashboard Setup Script for Windows

echo 🚀 Setting up Enhanced Teacher Dashboard...

REM Apply database schema
echo 📊 Applying database schema...
echo Please run the following SQL in your Supabase dashboard:
echo File: enhanced_teacher_dashboard_schema.sql
echo.

REM Install dependencies (if not already installed)
echo 📦 Checking dependencies...
npm list xlsx >nul 2>&1 || npm install xlsx
npm list papaparse >nul 2>&1 || npm install papaparse
npm list @types/papaparse >nul 2>&1 || npm install --save-dev @types/papaparse

echo ✅ Dependencies installed!

REM Build check
echo 🔨 Building project...
npm run build

if %errorlevel% equ 0 (
    echo ✅ Build successful!
) else (
    echo ❌ Build failed! Please check errors above.
    exit /b 1
)

REM Show instructions
echo 🖥️  Ready to start development server...
echo Visit: http://localhost:8080/teacher/dashboard
echo.
echo 📋 Test Accounts Needed:
echo - Teacher account (approved in teacher_profiles)
echo - Student accounts (approved in student_profiles)
echo.
echo 🎯 Test Features:
echo 1. Create exam → Publish → Notify students
echo 2. Enter results (manual + Excel upload)
echo 3. Generate parent notifications
echo 4. View dashboard analytics
echo.
echo 🔗 Useful URLs:
echo - Teacher Dashboard: http://localhost:8080/teacher/dashboard
echo - Admin Dashboard: http://localhost:8080/admin/dashboard
echo.

echo Press any key to start development server...
pause >nul

npm run dev
