// Test the exact registration flow from frontend
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFrontendRegistration() {
  console.log('🧪 Testing exact frontend registration flow');
  console.log('=' .repeat(45));
  
  // Simulate exact data from frontend form
  const testData = {
    fullName: 'Test Student',
    email: `teststudent-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    classLevel: '11',
    guardianName: 'Test Guardian',
    guardianMobile: '9876543210',
    parentMobile: '9876543210',
    batches: ['NEET', 'JEE'],
    subjects: ['Physics', 'Chemistry', 'Mathematics']
  };
  
  console.log('📝 Test data:', {
    ...testData,
    password: '[HIDDEN]'
  });
  
  try {
    // Step 1: Create metadata exactly like the service
    const userMetadata = {
      full_name: testData.fullName,
      user_type: 'student',
      class_level: testData.classLevel,
      guardian_name: testData.guardianName,
      guardian_mobile: testData.guardianMobile,
      parent_mobile: testData.parentMobile
    };
    
    // Add batches and subjects as JSON strings
    if (testData.batches && testData.batches.length > 0) {
      userMetadata.batches = JSON.stringify(testData.batches);
    }
    if (testData.subjects && testData.subjects.length > 0) {
      userMetadata.subjects = JSON.stringify(testData.subjects);
    }
    
    console.log('📋 Metadata to send:', userMetadata);
    
    // Step 2: Test signup with metadata
    console.log('\n🔐 Attempting signup...');
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testData.email,
      password: testData.password,
      options: {
        data: userMetadata,
        emailRedirectTo: `http://localhost:5173/auth/confirm`
      }
    });
    
    if (authError) {
      console.log('❌ REGISTRATION FAILED');
      console.log('Error:', authError);
      console.log('Error code:', authError.status);
      console.log('Error message:', authError.message);
      
      // Try without metadata to isolate the issue
      console.log('\n🔬 Testing without metadata...');
      const { data: simpleData, error: simpleError } = await supabase.auth.signUp({
        email: `simple-${Date.now()}@example.com`,
        password: testData.password
      });
      
      if (simpleError) {
        console.log('❌ Even simple signup failed:', simpleError.message);
      } else {
        console.log('✅ Simple signup worked - issue is with metadata');
        console.log('Checking each metadata field...');
        
        // Test each metadata field individually
        const testFields = [
          { full_name: testData.fullName },
          { user_type: 'student' },
          { class_level: testData.classLevel },
          { guardian_name: testData.guardianName },
          { guardian_mobile: testData.guardianMobile },
          { parent_mobile: testData.parentMobile },
          { batches: JSON.stringify(testData.batches) },
          { subjects: JSON.stringify(testData.subjects) }
        ];
        
        for (const field of testFields) {
          const fieldName = Object.keys(field)[0];
          const fieldValue = Object.values(field)[0];
          
          try {
            const { error: fieldError } = await supabase.auth.signUp({
              email: `test-${fieldName}-${Date.now()}@example.com`,
              password: testData.password,
              options: {
                data: field
              }
            });
            
            if (fieldError) {
              console.log(`❌ Field '${fieldName}' causes error:`, fieldError.message);
            } else {
              console.log(`✅ Field '${fieldName}' is OK`);
            }
          } catch (e) {
            console.log(`❌ Field '${fieldName}' test failed:`, e.message);
          }
        }
      }
      
    } else {
      console.log('✅ REGISTRATION SUCCESSFUL!');
      console.log('User ID:', authData.user?.id);
      console.log('Email confirmed:', authData.user?.email_confirmed_at ? 'Yes' : 'No');
      console.log('Session created:', !!authData.session);
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  }
}

testFrontendRegistration();
