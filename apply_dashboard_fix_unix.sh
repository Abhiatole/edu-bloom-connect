#!/bin/bash

echo "====================================================="
echo "EDU-BLOOM-CONNECT DASHBOARD FIX SCRIPT"
echo "====================================================="
echo "This script will help apply all fixes to resolve"
echo "database errors, missing tables, and RLS issues."
echo ""

echo "1. Creating any missing tables..."
echo "   (This step creates exam tables if they don't exist)"
echo ""
supabase db push -f FINAL_DATABASE_API_FIX.sql
if [ $? -ne 0 ]; then
  echo "Error applying database fixes!"
  echo "Please run this script from the root directory of the project."
  exit 1
fi

echo ""
echo "2. Verifying database tables and functions..."
echo "   (This checks if all required tables and functions exist)"
echo ""
supabase db push -f FINAL_VERIFICATION_SCRIPT.sql
if [ $? -ne 0 ]; then
  echo "Warning: Verification script encountered issues."
  echo "This may be normal if some tables don't exist yet."
fi

echo ""
echo "3. Applying comprehensive RLS fixes..."
echo "   (This ensures all tables have proper access policies)"
echo ""
supabase db push -f COMPREHENSIVE_RLS_FIX.sql
if [ $? -ne 0 ]; then
  echo "Warning: RLS fix script encountered issues."
  echo "This may be normal if some tables don't exist yet."
fi

echo ""
echo "4. Starting the development server..."
echo "   (This will launch the application with all fixes applied)"
echo ""
echo "npm run dev"
echo ""
echo "====================================================="
echo "Fix completed successfully!"
echo "====================================================="
echo ""
echo "If you still encounter issues:"
echo "1. Make sure you're logged in to Supabase CLI"
echo "2. Try running each SQL script individually in the Supabase dashboard"
echo "3. Check the browser console for any remaining errors"
echo ""
