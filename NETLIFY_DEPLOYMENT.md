# Netlify Deployment Instructions

## Environment Variables Configuration

To fix the "API key is invalid" error when users try to register, you need to set up environment variables in your Netlify deployment.

### Step 1: Add Environment Variables to Netlify

1. Go to your Netlify dashboard
2. Navigate to your site: **edugrowhub.netlify.app**
3. Go to **Site settings** → **Environment variables**
4. Add the following variables:

```
VITE_SUPABASE_URL = https://pgwgtronuluhwuiaqkcc.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxOTUxMzQsImV4cCI6MjA2NTc3MTEzNH0.hhxmy4IiSVS0R_ZwnjN75Too4MqLVFYkxhfew39z0Mk
```

### Step 2: Verify Supabase Keys

Before adding to Netlify, verify your Supabase keys are correct:

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy the **Project URL** and **anon/public key**
4. Make sure they match the values above

### Step 3: Redeploy Your Site

After adding the environment variables:
1. Go to **Deploys** in your Netlify dashboard
2. Click **Trigger deploy** → **Deploy site**
3. Wait for the build to complete

### Step 4: Test the Registration

1. Visit https://edugrowhub.netlify.app/
2. Try to register a new user (student or teacher)
3. The "API key is invalid" error should be resolved

## Common Issues and Solutions

### Issue 1: Environment Variables Not Working
- Make sure variable names start with `VITE_` (this is required for Vite)
- Ensure there are no extra spaces in variable names or values
- Redeploy after adding variables

### Issue 2: Supabase Project Settings
- Check if your Supabase project has the correct domain in **Authentication** → **URL Configuration**
- Add `https://edugrowhub.netlify.app` to your **Site URL** and **Redirect URLs**

### Issue 3: Database Access
- Ensure Row Level Security (RLS) is properly configured
- Check that your database triggers are working correctly
- Verify your database is accessible from external domains

## Local Development

For local development, use the `.env.local` file that has been created with your current configuration.

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Production Deployment

When you're ready to deploy:

1. Commit your changes to Git
2. Push to your connected repository
3. Netlify will automatically redeploy with the new environment variables

## Supabase Configuration Check

To verify your Supabase setup is working correctly, you can:

1. Check the **Auth** section in Supabase dashboard
2. Ensure email templates are configured
3. Verify database tables exist and have proper permissions
4. Test with a simple authentication flow

---

**Note**: Never commit actual API keys to your repository. Always use environment variables for sensitive configuration.
