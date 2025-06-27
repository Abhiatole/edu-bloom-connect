@echo off
echo Applying student registration database migration...
echo.

echo 1. Adding missing columns to student_profiles table...
echo 2. Creating batches and subjects tables...
echo 3. Creating relationship tables for student_batches and student_subjects...
echo 4. Setting up RLS policies...
echo.

echo WARNING: This will modify your production database!
echo Make sure you have a backup before proceeding.
echo.
set /p confirm="Do you want to continue? (y/n): "

if /i "%confirm%"=="y" (
    echo.
    echo Applying migration...
    
    REM You can run this SQL file through Supabase Dashboard or CLI
    echo Please run the SQL file: fix_student_registration_flow.sql
    echo in your Supabase SQL Editor or via supabase db push
    echo.
    echo After running the migration, the full registration flow will work
    echo with proper batch and subject enrollment.
    
    pause
) else (
    echo Migration cancelled.
    pause
)
