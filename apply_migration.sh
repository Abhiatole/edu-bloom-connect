#!/bin/bash
# Apply database migration for Enhanced Teacher Dashboard

echo "🔧 Applying database migration for Enhanced Teacher Dashboard..."
echo ""
echo "⚠️  IMPORTANT: Please apply the migration script in your Supabase dashboard:"
echo ""
echo "📄 File: migration_add_missing_columns.sql"
echo ""
echo "📋 Steps:"
echo "1. Open your Supabase dashboard"
echo "2. Go to SQL Editor"
echo "3. Copy and paste the contents of migration_add_missing_columns.sql"
echo "4. Run the script"
echo ""
echo "✅ This migration will:"
echo "   - Add missing columns to existing tables (status, max_marks, etc.)"
echo "   - Create new tables if they don't exist (exam_results, parent_notifications)"
echo "   - Add proper indexes and triggers"
echo "   - Set up Row Level Security policies"
echo "   - Handle both new and existing database schemas"
echo ""
echo "🚨 The migration is safe to run multiple times - it checks for existing columns/tables"
echo ""
echo "After applying the migration, your Enhanced Teacher Dashboard will work correctly!"
echo ""

# Check if the user wants to open the migration file
read -p "Open migration file in default editor? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v code &> /dev/null; then
        code migration_add_missing_columns.sql
    elif command -v nano &> /dev/null; then
        nano migration_add_missing_columns.sql
    elif command -v vim &> /dev/null; then
        vim migration_add_missing_columns.sql
    else
        echo "Please open migration_add_missing_columns.sql in your preferred editor"
    fi
fi

echo ""
echo "🎯 After migration, test the dashboard at: http://localhost:8080/teacher/dashboard"
