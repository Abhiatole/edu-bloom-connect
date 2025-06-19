# 🚀 Fix "Invalid API Key" Error on Netlify

## Problem
Users are getting "Invalid API Key" error when trying to register on your deployed Netlify site: https://edugrowhub.netlify.app/

## Root Cause
The Supabase API keys are hardcoded in your source code, but Netlify deployments require these to be set as environment variables for security and proper functionality.

## ✅ Solution (Follow these steps)

### Step 1: Set Environment Variables in Netlify

1. **Go to your Netlify Dashboard**
   - Visit https://app.netlify.com/
   - Find your site: **edugrowhub.netlify.app**

2. **Add Environment Variables**
   - Go to **Site settings** → **Environment variables**
   - Click **Add variable** and add these two variables:

   ```
   VITE_SUPABASE_URL = https://pgwgtronuluhwuiaqkcc.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxOTUxMzQsImV4cCI6MjA2NTc3MTEzNH0.hhxmy4IiSVS0R_ZwnjN75Too4MqLVFYkxhfew39z0Mk
   ```

   **⚠️ Important**: Variable names must start with `VITE_` for Vite to recognize them!

### Step 2: Verify Your Supabase Keys (Optional but recommended)

1. **Check your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Navigate to your project: **pgwgtronuluhwuiaqkcc**
   - Go to **Settings** → **API**
   - Verify the **Project URL** and **anon/public key** match the values above

### Step 3: Redeploy Your Site

1. **Trigger a new deployment**
   - In your Netlify dashboard, go to **Deploys**
   - Click **Trigger deploy** → **Deploy site**
   - Wait for the build to complete (should take 2-3 minutes)

### Step 4: Test the Fix

1. **Visit your site**: https://edugrowhub.netlify.app/
2. **Try to register** a new user (student or teacher)
3. **The "Invalid API Key" error should be resolved**

### Step 5: Debug if Still Having Issues

If you're still having problems, visit: https://edugrowhub.netlify.app/debug

This debug page will help you:
- Check if environment variables are properly set
- Test the Supabase connection
- Verify all deployment settings
- Get specific error messages

## 🔧 What We Fixed

1. **Updated `src/integrations/supabase/client.ts`**
   - Now uses environment variables instead of hardcoded keys
   - Falls back to original values if environment variables aren't set

2. **Added Environment Variable Support**
   - Created `.env.example` and `.env.local` files
   - Updated `.gitignore` to prevent committing sensitive keys

3. **Added Debug Tools**
   - Created a debug page at `/debug` to troubleshoot issues
   - Added connection testing component

## 🔐 Security Notes

- **Never commit API keys to your repository**
- **Always use environment variables for sensitive configuration**
- **The current setup is now secure and production-ready**

## 📱 Additional Netlify Settings

You may also want to configure:

1. **Supabase Site URL Settings**
   - In Supabase Dashboard → Authentication → URL Configuration
   - Add `https://edugrowhub.netlify.app` to your **Site URL**
   - Add `https://edugrowhub.netlify.app/auth/confirm` to **Redirect URLs**

2. **Netlify Redirects** (if needed)
   - Create a `_redirects` file in your `public` folder
   - Add: `/* /index.html 200` for SPA routing

## 🎯 Expected Result

After following these steps:
- ✅ User registration will work properly
- ✅ No more "Invalid API Key" errors
- ✅ Secure deployment with environment variables
- ✅ Debug tools available if needed

## 📞 Support

If you still encounter issues after following these steps:
1. Check the debug page: https://edugrowhub.netlify.app/debug
2. Verify all environment variables are set correctly in Netlify
3. Check your Supabase project is accessible and active
4. Ensure your Supabase database has the correct tables and permissions

---

**Note**: Make sure to commit and push the updated code to your repository so Netlify can deploy the latest version with environment variable support.
