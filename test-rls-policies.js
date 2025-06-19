import { createClient } from '@supabase/supabase-js';

// Use the correct Supabase URL and key from .env.local
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLSPolicies() {
  console.log('🔍 Testing RLS Policies for All Profile Tables...\n');

  try {
    // Test without authentication first
    console.log('1. Testing unauthenticated access (should fail)...');
    
    const { data: unauthTest, error: unauthError } = await supabase
      .from('student_profiles')
      .select('count(*)', { count: 'exact', head: true });
    
    if (unauthError) {
      console.log('✅ Unauthenticated access properly blocked:', unauthError.message);
    } else {
      console.log('❌ Warning: Unauthenticated access allowed');
    }

    // Test with authentication
    console.log('\n2. Testing with admin authentication...');
    const adminEmail = 'getgifts257@gmail.com'; // Replace with your admin email
    const adminPassword = 'Sam@123'; // Replace with your admin password

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
      console.log('Please update the script with correct admin credentials');
      return;
    }

    console.log('✅ Admin login successful');

    // Test access to each profile table
    const tables = ['student_profiles', 'teacher_profiles', 'user_profiles'];
    
    for (const table of tables) {
      console.log(`\n3. Testing ${table} access...`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(5);
      
      if (error) {
        console.error(`❌ ${table} access failed:`, error.message);
        console.log(`   Error code: ${error.code}`);
        console.log(`   Error details: ${error.details}`);
      } else {
        console.log(`✅ ${table} access successful`);
        console.log(`   Found ${data?.length || 0} records`);
      }
    }

    // Test specific user profile lookup (like the login does)
    console.log('\n4. Testing user profile lookup (like login flow)...');
    const userId = loginData.user.id;

    // Test student profile lookup
    const { data: studentProfile, error: studentError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (studentError && studentError.code !== 'PGRST116') { // PGRST116 = no rows found, which is OK
      console.error('❌ Student profile lookup failed:', studentError.message);
    } else {
      console.log('✅ Student profile lookup works (no data is normal for admin)');
    }

    // Test teacher profile lookup
    const { data: teacherProfile, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (teacherError && teacherError.code !== 'PGRST116') {
      console.error('❌ Teacher profile lookup failed:', teacherError.message);
    } else {
      console.log('✅ Teacher profile lookup works (no data is normal for admin)');
    }

    // Test admin profile lookup
    const { data: adminProfile, error: adminError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'ADMIN')
      .single();

    if (adminError) {
      console.error('❌ Admin profile lookup failed:', adminError.message);
    } else {
      console.log('✅ Admin profile lookup successful');
      console.log('   Profile:', {
        full_name: adminProfile.full_name,
        email: adminProfile.email,
        role: adminProfile.role,
        status: adminProfile.status
      });
    }

    // Clean up
    await supabase.auth.signOut();
    console.log('\n✅ RLS Policy test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testRLSPolicies().catch(console.error);
