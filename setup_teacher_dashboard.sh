#!/bin/bash
# Enhanced Teacher Dashboard Setup Script

echo "🚀 Setting up Enhanced Teacher Dashboard..."

# Apply database schema
echo "📊 Applying database schema..."
echo "Please run the following SQL in your Supabase dashboard:"
echo "File: enhanced_teacher_dashboard_schema.sql"
echo ""

# Install dependencies (if not already installed)
echo "📦 Checking dependencies..."
npm list xlsx >/dev/null 2>&1 || npm install xlsx
npm list papaparse >/dev/null 2>&1 || npm install papaparse
npm list @types/papaparse >/dev/null 2>&1 || npm install --save-dev @types/papaparse

echo "✅ Dependencies installed!"

# Build check
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please check errors above."
    exit 1
fi

# Start development server
echo "🖥️  Starting development server..."
echo "Visit: http://localhost:8080/teacher/dashboard"
echo ""
echo "📋 Test Accounts Needed:"
echo "- Teacher account (approved in teacher_profiles)"
echo "- Student accounts (approved in student_profiles)"
echo ""
echo "🎯 Test Features:"
echo "1. Create exam → Publish → Notify students"
echo "2. Enter results (manual + Excel upload)"
echo "3. Generate parent notifications"
echo "4. View dashboard analytics"
echo ""
echo "🔗 Useful URLs:"
echo "- Teacher Dashboard: http://localhost:8080/teacher/dashboard"
echo "- Admin Dashboard: http://localhost:8080/admin/dashboard"
echo ""

npm run dev
