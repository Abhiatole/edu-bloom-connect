#!/bin/bash

# Set up variables
SQL_FILE="./public/CREATE_EXAM_TABLES.sql"
OUTPUT_FILE="./exam_tables_setup.log"

echo "Starting exam tables setup process..."
echo "=====================================" > $OUTPUT_FILE
echo "Running at: $(date)" >> $OUTPUT_FILE
echo "=====================================" >> $OUTPUT_FILE

# Check if the SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo "Error: SQL file not found at $SQL_FILE" | tee -a $OUTPUT_FILE
    exit 1
fi

# Check if SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "Error: SUPABASE_URL and/or SUPABASE_SERVICE_KEY environment variables are not set" | tee -a $OUTPUT_FILE
    echo "Please set these variables before running this script." | tee -a $OUTPUT_FILE
    exit 1
fi

echo "SQL file found at $SQL_FILE" >> $OUTPUT_FILE
echo "Executing SQL script against Supabase database..." | tee -a $OUTPUT_FILE

# Use curl to execute the SQL script against the Supabase REST API
curl -X POST \
    -H "Content-Type: application/json" \
    -H "apikey: $SUPABASE_SERVICE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -d "{\"query\": \"$(cat $SQL_FILE | tr -d '\n' | sed 's/"/\\"/g')\"}" \
    "$SUPABASE_URL/rest/v1/rpc/exec_sql" >> $OUTPUT_FILE 2>&1

# Check if the curl command was successful
if [ $? -eq 0 ]; then
    echo "SQL script execution completed successfully!" | tee -a $OUTPUT_FILE
else
    echo "Error: Failed to execute SQL script" | tee -a $OUTPUT_FILE
    echo "Check $OUTPUT_FILE for details" | tee -a $OUTPUT_FILE
    exit 1
fi

echo "=====================================" >> $OUTPUT_FILE
echo "Process completed at: $(date)" >> $OUTPUT_FILE
echo "=====================================" >> $OUTPUT_FILE

echo "Exam tables setup process completed. Log saved to $OUTPUT_FILE"
