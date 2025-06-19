import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pgwgtronuluhwuiaqkcc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDetailedRegistration() {
  console.log('🔍 Testing Detailed Registration Process...');
  
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'testpassword123';
  
  try {
    console.log('\n👤 Step 1: Testing signup with minimal data...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError) {
      console.error('❌ Basic signup failed:', signUpError);
      console.error('Error details:', {
        message: signUpError.message,
        status: signUpError.status,
        statusText: signUpError.statusText,
        details: signUpError
      });
      return;
    }
    
    console.log('✅ Basic signup successful!');
    console.log('User ID:', signUpData.user?.id);
    console.log('User confirmed:', !!signUpData.user?.email_confirmed_at);
    
    // Step 2: Test with metadata (this is what your app does)
    console.log('\n📝 Step 2: Testing signup with metadata...');
    const testEmail2 = `test_meta_${Date.now()}@example.com`;
    
    const { data: metaSignUpData, error: metaSignUpError } = await supabase.auth.signUp({
      email: testEmail2,
      password: testPassword,
      options: {
        data: {
          role: 'student',
          full_name: 'Test Student',
          class_level: 11,
          guardian_name: 'Test Guardian',
          guardian_mobile: '1234567890'
        }
      }
    });
    
    if (metaSignUpError) {
      console.error('❌ Metadata signup failed:', metaSignUpError);
      console.error('This is likely your registration issue!');
      console.error('Error details:', {
        message: metaSignUpError.message,
        status: metaSignUpError.status,
        statusText: metaSignUpError.statusText,
        details: metaSignUpError
      });
      
      // Check if it's a trigger/function issue
      if (metaSignUpError.message.includes('function') || 
          metaSignUpError.message.includes('trigger') || 
          metaSignUpError.message.includes('relation')) {
        console.log('\n🔧 Diagnosis: Database trigger or table issue');
        console.log('Solution: Run the database setup script in Supabase SQL Editor');
      }
      
      return;
    }
    
    console.log('✅ Metadata signup successful!');
    
    // Step 3: Check if profiles were created
    if (metaSignUpData.user?.id) {
      console.log('\n📋 Step 3: Checking if profiles were created...');
      
      // Wait a moment for triggers
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const { data: studentProfile, error: profileError } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', metaSignUpData.user.id)
          .single();
        
        if (profileError) {
          console.log('❌ No student profile created:', profileError.message);
          console.log('🔧 This suggests the database trigger is not working');
        } else {
          console.log('✅ Student profile created successfully!');
          console.log('Profile data:', studentProfile);
        }
      } catch (err) {
        console.log('❌ Error checking profile:', err.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testDetailedRegistration();
