@echo off
setlocal enabledelayedexpansion

REM Set up variables
set SQL_FILE=.\public\CREATE_EXAM_TABLES.sql
set OUTPUT_FILE=.\exam_tables_setup.log

echo Starting exam tables setup process...
echo ===================================== > %OUTPUT_FILE%
echo Running at: %date% %time% >> %OUTPUT_FILE%
echo ===================================== >> %OUTPUT_FILE%

REM Check if the SQL file exists
if not exist "%SQL_FILE%" (
    echo Error: SQL file not found at %SQL_FILE% | tee -a %OUTPUT_FILE%
    exit /b 1
)

REM Check if SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are set
if "%SUPABASE_URL%"=="" (
    echo Error: SUPABASE_URL environment variable is not set >> %OUTPUT_FILE%
    echo Please set these variables before running this script. >> %OUTPUT_FILE%
    echo Error: SUPABASE_URL environment variable is not set
    echo Please set these variables before running this script.
    exit /b 1
)

if "%SUPABASE_SERVICE_KEY%"=="" (
    echo Error: SUPABASE_SERVICE_KEY environment variable is not set >> %OUTPUT_FILE%
    echo Please set these variables before running this script. >> %OUTPUT_FILE%
    echo Error: SUPABASE_SERVICE_KEY environment variable is not set
    echo Please set these variables before running this script.
    exit /b 1
)

echo SQL file found at %SQL_FILE% >> %OUTPUT_FILE%
echo Executing SQL script against Supabase database... | tee -a %OUTPUT_FILE%

REM Read SQL file content
set "sql_content="
for /f "usebackq tokens=*" %%a in ("%SQL_FILE%") do (
    set "line=%%a"
    set "sql_content=!sql_content! !line!"
)

REM Escape quotes for JSON
set "sql_content=!sql_content:"=\"!"

REM Use curl to execute the SQL script against the Supabase REST API
curl -X POST ^
    -H "Content-Type: application/json" ^
    -H "apikey: %SUPABASE_SERVICE_KEY%" ^
    -H "Authorization: Bearer %SUPABASE_SERVICE_KEY%" ^
    -d "{\"query\": \"%sql_content%\"}" ^
    "%SUPABASE_URL%/rest/v1/rpc/exec_sql" >> %OUTPUT_FILE% 2>&1

REM Check if the curl command was successful
if %ERRORLEVEL% EQU 0 (
    echo SQL script execution completed successfully! | tee -a %OUTPUT_FILE%
) else (
    echo Error: Failed to execute SQL script | tee -a %OUTPUT_FILE%
    echo Check %OUTPUT_FILE% for details | tee -a %OUTPUT_FILE%
    exit /b 1
)

echo ===================================== >> %OUTPUT_FILE%
echo Process completed at: %date% %time% >> %OUTPUT_FILE%
echo ===================================== >> %OUTPUT_FILE%

echo Exam tables setup process completed. Log saved to %OUTPUT_FILE%
