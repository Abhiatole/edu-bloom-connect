@echo off
echo Updating student names and enrollment numbers...

:: Determine which Supabase tool to use
where supabase >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Using Supabase CLI...
    supabase db execute -f UPDATE_STUDENT_NAMES_ENROLLMENTS.sql
) else (
    where npx >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo Using npx supabase...
        npx supabase db execute -f UPDATE_STUDENT_NAMES_ENROLLMENTS.sql
    ) else (
        echo Supabase CLI not found. Please use the Supabase Dashboard to run the SQL script manually.
        echo Opening UPDATE_STUDENT_NAMES_ENROLLMENTS.sql...
        start notepad UPDATE_STUDENT_NAMES_ENROLLMENTS.sql
    )
)

echo.
echo If you see any errors above, please copy the content of UPDATE_STUDENT_NAMES_ENROLLMENTS.sql
echo and run it manually in the Supabase Dashboard SQL editor.
echo.
pause
