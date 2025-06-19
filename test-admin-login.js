const { createClient } = require('@supabase/supabase-js');

// Use the new environment variables or fallback
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vplpbemqscczqfxkkqoa.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbHBiZW1xc2NjenFmeGtrcW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5Mzg4NDQsImV4cCI6MjA1MjUxNDg0NH0.b5vdgT_vdhZK6Oo_1B0bKuqCfVWzSMCMYAKd_8rkSbM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAdminLogin() {
  console.log('🔍 Testing Admin Login Flow...\n');

  try {
    // Test 1: Check if we can connect to Supabase
    console.log('1. Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('user_profiles')
      .select('count(*)', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Connected to Supabase successfully');

    // Test 2: Try to login with admin credentials
    console.log('\n2. Testing admin login...');
    const adminEmail = 'admin@test.com'; // Replace with your test admin email
    const adminPassword = 'admin123'; // Replace with your test admin password

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      
      // If login fails, let's check if the user exists
      console.log('\n3. Checking if admin user exists...');
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      
      if (!userError && users?.users) {
        const adminUser = users.users.find(u => u.email === adminEmail);
        if (adminUser) {
          console.log('✅ Admin user exists in auth.users');
          console.log('User ID:', adminUser.id);
          console.log('Email confirmed:', adminUser.email_confirmed_at);
          console.log('Role metadata:', adminUser.user_metadata?.role);
        } else {
          console.log('❌ Admin user not found in auth.users');
        }
      }
      return;
    }

    if (loginData?.user) {
      console.log('✅ Login successful!');
      console.log('User ID:', loginData.user.id);
      console.log('Email:', loginData.user.email);

      // Test 3: Check user profile
      console.log('\n3. Checking user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', loginData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile check failed:', profileError.message);
        
        // Try to check if profile exists at all
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from('user_profiles')
          .select('user_id, email, role, status')
          .eq('user_id', loginData.user.id);
        
        if (!allProfilesError && allProfiles?.length > 0) {
          console.log('📋 Found profile data:', allProfiles[0]);
        } else {
          console.log('❌ No profile found for user');
        }
      } else {
        console.log('✅ Profile found!');
        console.log('Profile:', {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
          status: profile.status
        });
      }

      // Test 4: Check admin-specific access
      console.log('\n4. Testing admin access to user_profiles table...');
      const { data: allUsers, error: adminAccessError } = await supabase
        .from('user_profiles')
        .select('email, role, status')
        .limit(5);

      if (adminAccessError) {
        console.error('❌ Admin access failed:', adminAccessError.message);
      } else {
        console.log('✅ Admin can access user profiles');
        console.log('Sample users:', allUsers);
      }

      // Clean up: sign out
      await supabase.auth.signOut();
      console.log('\n✅ Test completed successfully!');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAdminLogin().catch(console.error);
