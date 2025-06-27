// Debug Supabase Authentication Issue
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugAuthIssue() {
  console.log('🔍 Debugging Supabase Authentication Issue');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Check if auth is working at all
    console.log('📡 Testing basic Supabase connection...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ Auth connection error:', userError.message);
    } else {
      console.log('✅ Auth connection working');
      console.log('Current user:', user ? user.email : 'No user logged in');
    }
    
    // Test 2: Check if we can access the auth.users table (indirectly)
    console.log('\n📊 Testing auth table access...');
    
    // Test 3: Try a simple signup with test data
    console.log('\n🧪 Testing signup with dummy data...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('Attempting signup with:', testEmail);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          user_type: 'student'
        }
      }
    });
    
    if (signupError) {
      console.log('❌ Signup error:', signupError);
      console.log('Error code:', signupError.status);
      console.log('Error message:', signupError.message);
      
      // Check if it's a database trigger issue
      if (signupError.message.includes('Database error saving new user')) {
        console.log('\n🔧 DIAGNOSIS: Database trigger or RLS issue');
        console.log('This usually means:');
        console.log('1. A database trigger is failing');
        console.log('2. RLS policies are blocking the auth.users table');
        console.log('3. A foreign key constraint is failing');
        console.log('4. Required tables or columns are missing');
      }
    } else {
      console.log('✅ Signup successful!');
      console.log('User ID:', signupData.user?.id);
      console.log('Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');
    }
    
    // Test 4: Check for database triggers
    console.log('\n🔍 Checking for database triggers...');
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('*')
      .ilike('event_object_table', 'users');
    
    if (triggerError) {
      console.log('❌ Cannot check triggers (this is normal)');
    } else {
      console.log('Triggers found:', triggers?.length || 0);
    }
    
    // Test 5: Check student_profiles table structure
    console.log('\n📋 Checking student_profiles table...');
    const { data: profileTest, error: profileError } = await supabase
      .from('student_profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.log('❌ Student profiles error:', profileError.message);
    } else {
      console.log('✅ Student profiles accessible');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugAuthIssue();
