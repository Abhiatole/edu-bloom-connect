// TEST REGISTRATION - Minimal version to isolate the 500 error
// Use this in browser console to test Supabase auth directly

import { supabase } from '@/integrations/supabase/client';

// Test 1: Simple signup without metadata or redirects
async function testBasicSignup() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test123@example.com',
      password: 'password123'
    });
    
    if (error) {
      console.error('❌ Basic signup failed:', error);
      return false;
    }
    
    console.log('✅ Basic signup succeeded:', data);
    return true;
  } catch (err) {
    console.error('❌ Exception during basic signup:', err);
    return false;
  }
}

// Test 2: Signup with minimal metadata
async function testMetadataSignup() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test456@example.com',
      password: 'password123',
      options: {
        data: {
          role: 'STUDENT',
          full_name: 'Test User'
        }
      }
    });
    
    if (error) {
      console.error('❌ Metadata signup failed:', error);
      return false;
    }
    
    console.log('✅ Metadata signup succeeded:', data);
    return true;
  } catch (err) {
    console.error('❌ Exception during metadata signup:', err);
    return false;
  }
}

// Test 3: Signup with redirect URL
async function testRedirectSignup() {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'test789@example.com',
      password: 'password123',
      options: {
        data: {
          role: 'STUDENT',
          full_name: 'Test User'
        },
        emailRedirectTo: 'http://localhost:8081/auth/confirm'
      }
    });
    
    if (error) {
      console.error('❌ Redirect signup failed:', error);
      return false;
    }
    
    console.log('✅ Redirect signup succeeded:', data);
    return true;
  } catch (err) {
    console.error('❌ Exception during redirect signup:', err);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting Supabase signup tests...');
  
  const test1 = await testBasicSignup();
  const test2 = await testMetadataSignup();
  const test3 = await testRedirectSignup();
  
  console.log('\n📊 Test Results:');
  console.log('Basic signup:', test1 ? '✅' : '❌');
  console.log('Metadata signup:', test2 ? '✅' : '❌');
  console.log('Redirect signup:', test3 ? '✅' : '❌');
  
  if (!test1) {
    console.log('\n🚨 Database schema issues - run SUPABASE_500_ERROR_FIX.sql');
  } else if (!test2) {
    console.log('\n🚨 Metadata handling issues - check user_metadata triggers');
  } else if (!test3) {
    console.log('\n🚨 Email redirect issues - check URL configuration');
  } else {
    console.log('\n🎉 All tests passed - registration should work!');
  }
}

// Export for testing
window.testSupabaseSignup = runAllTests;
