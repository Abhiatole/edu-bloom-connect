import { createClient } from '@supabase/supabase-js';

// Test the current configuration
const SUPABASE_URL = "https://pgwgtronuluhwuiaqkcc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...');
  console.log('URL:', SUPABASE_URL);
  console.log('Key (first 50 chars):', SUPABASE_ANON_KEY.substring(0, 50) + '...');
  
  try {
    // Test 1: Basic connection
    console.log('\n📡 Testing basic connection...');
    const { data, error } = await supabase.from('student_profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('Error details:', error);
      
      if (error.message.includes('Invalid API key')) {
        console.log('\n🔑 API Key Issues:');
        console.log('- The API key might be expired or invalid');
        console.log('- Check your Supabase dashboard for the correct keys');
        console.log('- Make sure you\'re using the anon/public key, not the service key');
      }
      
      return false;
    } else {
      console.log('✅ Basic connection successful!');
    }
    
    // Test 2: Auth functionality
    console.log('\n🔐 Testing auth functionality...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth test failed:', authError.message);
      return false;
    } else {
      console.log('✅ Auth functionality working!');
    }
    
    // Test 3: Try a sign up (this will test the exact endpoint that's failing)
    console.log('\n👤 Testing signup endpoint...');
    const testEmail = `test_${Date.now()}@example.com`;
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        data: {
          role: 'student',
          full_name: 'Test User'
        }
      }
    });
    
    if (signupError) {
      console.error('❌ Signup test failed:', signupError.message);
      console.error('This is the same error users are experiencing');
      return false;
    } else {
      console.log('✅ Signup endpoint working!');
      
      // Clean up the test user if needed
      if (signupData.user) {
        console.log('🧹 Test user created, you may want to delete it from your auth users');
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return false;
  }
}

// Run the test
testSupabaseConnection().then(success => {
  if (success) {
    console.log('\n🎉 All tests passed! Your Supabase configuration is working.');
  } else {
    console.log('\n❌ Tests failed. Please check your Supabase configuration.');
    console.log('\n📋 Next steps:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project: pgwgtronuluhwuiaqkcc');
    console.log('3. Go to Settings → API');
    console.log('4. Copy the Project URL and anon public key');
    console.log('5. Update your .env.local file with the correct values');
  }
});
