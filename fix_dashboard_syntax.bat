@echo off
echo Fixing ModernTeacherDashboard.tsx with missing catch/finally clause...

echo Backing up original file...
copy "e:\New folder (2)\edu-bloom-connect\src\pages\enhanced\ModernTeacherDashboard.tsx" "e:\New folder (2)\edu-bloom-connect\src\pages\enhanced\ModernTeacherDashboard.backup.tsx"

echo Replacing with fixed version...
copy "e:\New folder (2)\edu-bloom-connect\src\pages\enhanced\ModernTeacherDashboard.fixed.tsx" "e:\New folder (2)\edu-bloom-connect\src\pages\enhanced\ModernTeacherDashboard.tsx"

echo Done! The original file has been backed up as ModernTeacherDashboard.backup.tsx
echo Please restart your development server if it's currently running.
pause
