#!/bin/bash
echo "Updating student names and enrollment numbers..."

# Determine which Supabase tool to use
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    supabase db execute -f UPDATE_STUDENT_NAMES_ENROLLMENTS.sql
elif command -v npx &> /dev/null; then
    echo "Using npx supabase..."
    npx supabase db execute -f UPDATE_STUDENT_NAMES_ENROLLMENTS.sql
else
    echo "Supabase CLI not found. Please use the Supabase Dashboard to run the SQL script manually."
    echo "Opening UPDATE_STUDENT_NAMES_ENROLLMENTS.sql with default editor..."
    if command -v xdg-open &> /dev/null; then
        xdg-open UPDATE_STUDENT_NAMES_ENROLLMENTS.sql
    elif command -v open &> /dev/null; then
        open UPDATE_STUDENT_NAMES_ENROLLMENTS.sql
    else
        cat UPDATE_STUDENT_NAMES_ENROLLMENTS.sql
    fi
fi

echo ""
echo "If you see any errors above, please copy the content of UPDATE_STUDENT_NAMES_ENROLLMENTS.sql"
echo "and run it manually in the Supabase Dashboard SQL editor."
echo ""
read -p "Press Enter to continue..."
