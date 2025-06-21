#!/bin/bash

echo "EduBloomConnect Dashboard Fix Script"
echo "===================================="
echo
echo "This script will help run the final database fixes for the dashboard."
echo
echo "Steps:"
echo "1. Copy the FINAL_DATABASE_API_FIX.sql content"
echo "2. Run the SQL in Supabase SQL Editor to apply all fixes"
echo "3. Test the dashboard functionality"
echo
echo "If you still experience issues after running the SQL, you can use:"
echo "- database-helpers.improved.ts (robust multi-layer approach)"
echo "- database-helpers.emergency.ts (fallback that always assumes tables exist)"
echo

read -p "Would you like to copy the FINAL_DATABASE_API_FIX.sql content? (y/n) " choice
case "$choice" in 
  y|Y ) 
    if command -v pbcopy > /dev/null; then
      # macOS
      cat FINAL_DATABASE_API_FIX.sql | pbcopy
      echo "SQL copied to clipboard (macOS)!"
    elif command -v xclip > /dev/null; then
      # Linux with xclip
      cat FINAL_DATABASE_API_FIX.sql | xclip -selection clipboard
      echo "SQL copied to clipboard (Linux with xclip)!"
    elif command -v xsel > /dev/null; then
      # Linux with xsel
      cat FINAL_DATABASE_API_FIX.sql | xsel --clipboard --input
      echo "SQL copied to clipboard (Linux with xsel)!"
    else
      echo "Could not copy to clipboard. Please open FINAL_DATABASE_API_FIX.sql manually."
    fi
    ;;
  * ) 
    echo "Please open FINAL_DATABASE_API_FIX.sql manually and copy its contents."
    ;;
esac

echo
echo "Please paste the SQL into the Supabase SQL Editor and execute."
echo "After running the SQL, restart your development server with:"
echo "npm run dev"
echo
echo "If you continue to experience issues after applying the fixes,"
echo "consider using one of the alternative database-helpers.ts versions provided."
read -p "Press Enter to continue..."
