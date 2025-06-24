#!/bin/bash

echo "EduBloomConnect Student Insights Fix Script"
echo "=========================================="
echo
echo "This script will help fix the student_insights table column and RLS issues."
echo
echo "Steps:"
echo "1. First, we'll display the SQL to add the created_by column"
echo "2. Then, we'll display the SQL to fix the RLS policies"
echo "3. You'll need to copy each into the Supabase SQL Editor and execute them"
echo

echo "Step 1: Add the created_by column to student_insights table"
echo "--------------------------------------------------------"
echo

echo "SQL to add created_by column:"
echo "----------------------------"
cat ADD_CREATED_BY_COLUMN.sql
echo
echo "Please copy the SQL above and paste it into the Supabase SQL Editor, then execute it."
echo

read -p "Press Enter after executing the SQL to continue..."

echo
echo "Step 2: Fix the RLS policies for student_insights table"
echo "-----------------------------------------------------"
echo

echo "SQL to fix RLS policies:"
echo "----------------------"
cat FIX_STUDENT_INSIGHTS_RLS.sql
echo
echo "Please copy the SQL above and paste it into the Supabase SQL Editor, then execute it."
echo

read -p "Press Enter to finish..."

echo
echo "Script complete. The student_insights table should now have the created_by column"
echo "and the RLS policies should be properly configured."
echo
echo "After applying these fixes, restart your development server:"
echo "npm run dev"
echo
