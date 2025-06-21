# PowerShell script to push important changed files to GitHub

Write-Host "Preparing to push important fixed files to GitHub..." -ForegroundColor Green

# List of important fixed files
$IMPORTANT_FILES = @(
  "src/pages/enhanced/ModernTeacherDashboard.tsx",
  "src/utils/database-helpers.ts",
  "src/components/debug/DashboardErrorDiagnostic.tsx",
  "src/components/debug/RLSDebugTool.tsx",
  "DASHBOARD_500_ERROR_FIX.sql",
  "FIX_DASHBOARD_ERROR.md",
  "FIXING_500_ERROR_GUIDE.md",
  "ADD_EXAM_RESULTS_STATUS.sql"
)

# Instructions for pushing to GitHub
Write-Host ""
Write-Host "===== GitHub Push Instructions =====" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run the following commands to push the fixed files to GitHub:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Add the important files:" -ForegroundColor White
Write-Host "   git add $($IMPORTANT_FILES -join ' ')" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Commit the changes:" -ForegroundColor White
Write-Host '   git commit -m "Fix 500 Internal Server Error in ModernTeacherDashboard"' -ForegroundColor Gray
Write-Host ""
Write-Host "3. Push to GitHub:" -ForegroundColor White
Write-Host "   git push origin main"  -ForegroundColor Gray # Change 'main' to your branch name if different
Write-Host ""
Write-Host "===== Files Summary =====" -ForegroundColor Cyan
Write-Host ""
Write-Host "The following files were fixed:" -ForegroundColor Yellow
Write-Host "- ModernTeacherDashboard.tsx: Fixed syntax error with missing catch/finally clauses" -ForegroundColor White
Write-Host "- database-helpers.ts: Fixed syntax error in comments and improved error handling" -ForegroundColor White
Write-Host "- DashboardErrorDiagnostic.tsx: Added diagnostic tool to help identify API issues" -ForegroundColor White
Write-Host "- DASHBOARD_500_ERROR_FIX.sql: SQL script to fix RPC functions and permissions" -ForegroundColor White
Write-Host "- FIX_DASHBOARD_ERROR.md & FIXING_500_ERROR_GUIDE.md: Documentation files" -ForegroundColor White
Write-Host "- ADD_EXAM_RESULTS_STATUS.sql: Script to add status column to exam_results table" -ForegroundColor White
Write-Host ""
Write-Host "Make sure all your changes are working correctly before pushing to GitHub." -ForegroundColor Yellow

# Option to execute the git commands directly
$executeGit = Read-Host "Would you like to execute these git commands now? (y/n)"
if ($executeGit -eq "y" -or $executeGit -eq "Y") {
    Write-Host "Executing git commands..." -ForegroundColor Green
    
    # Check if git is available
    try {
        git --version | Out-Null
        
        # Add the files
        Write-Host "Adding files..." -ForegroundColor Cyan
        git add $IMPORTANT_FILES
        
        # Commit the changes
        Write-Host "Committing changes..." -ForegroundColor Cyan
        git commit -m "Fix 500 Internal Server Error in ModernTeacherDashboard"
        
        # Ask about pushing
        $pushToGithub = Read-Host "Push to GitHub now? (y/n)"
        if ($pushToGithub -eq "y" -or $pushToGithub -eq "Y") {
            # Ask for branch name
            $branchName = Read-Host "Enter branch name to push to (default: main)"
            if ([string]::IsNullOrEmpty($branchName)) {
                $branchName = "main"
            }
            
            Write-Host "Pushing to $branchName..." -ForegroundColor Cyan
            git push origin $branchName
            
            Write-Host "Done! Changes have been pushed to GitHub." -ForegroundColor Green
        } else {
            Write-Host "Changes have been committed locally but not pushed to GitHub." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Error: Git is not available or not in your PATH. Please install Git or use the commands manually." -ForegroundColor Red
    }
} else {
    Write-Host "You can run the git commands manually using the instructions above." -ForegroundColor Yellow
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
