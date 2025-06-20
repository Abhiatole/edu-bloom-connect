import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testApprovalAfterFix() {
  console.log('🧪 Testing Admin Approval After RLS Fix...\n');

  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'getgifts257@gmail.com',
      password: 'Sam@123'
    });

    if (authError) {
      console.log('❌ Admin login failed:', authError.message);
      return;
    }
    console.log('✅ Admin login successful');

    // Step 2: Get a test student
    console.log('\n2. Finding test student...');
    const { data: students, error: studentError } = await supabase
      .from('student_profiles')
      .select('*')
      .limit(1);

    if (studentError) {
      console.log('❌ Failed to fetch students:', studentError.message);
      return;
    }

    if (!students || students.length === 0) {
      console.log('⚠️ No students found to test with');
      return;
    }

    const testStudent = students[0];
    console.log('✅ Found test student:', testStudent.enrollment_no);
    console.log('📊 Current approval status:', testStudent.approval_date ? 'APPROVED' : 'PENDING');

    // Step 3: Test approval update
    console.log('\n3. Testing approval update...');
    const { data: updateResult, error: updateError, count } = await supabase
      .from('student_profiles')
      .update({ 
        approval_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', testStudent.user_id);

    console.log('📊 Update response:');
    console.log('  - Data:', updateResult);
    console.log('  - Count:', count);
    console.log('  - Error:', updateError);

    if (updateError) {
      console.log('❌ Update failed:', updateError.message);
      console.log('🔍 This means the RLS policies still need to be applied');
      console.log('💡 Please run the SQL script in Supabase SQL Editor');
    } else if (count === 0) {
      console.log('⚠️ Update succeeded but affected 0 rows');
      console.log('🔍 This means RLS policies are still blocking the update');
      console.log('💡 Please run the SQL script in Supabase SQL Editor');
    } else {
      console.log('✅ Update successful! Affected', count, 'rows');
      console.log('🎉 Admin approval functionality is now working!');
    }

    // Step 4: Verify the change
    console.log('\n4. Verifying update...');
    const { data: verifyData } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', testStudent.user_id)
      .single();

    if (verifyData) {
      console.log('📊 Verification result:');
      console.log('  - Enrollment:', verifyData.enrollment_no);
      console.log('  - Approval date:', verifyData.approval_date);
      console.log('  - Status:', verifyData.approval_date ? 'APPROVED' : 'PENDING');
      
      if (verifyData.approval_date && !testStudent.approval_date) {
        console.log('🎉 SUCCESS: Student was successfully approved!');
        console.log('✅ Admin approval button will now work in the dashboard');
      }
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

console.log('🔧 RLS Policy Test Script');
console.log('=========================');
console.log('This script tests if the admin approval RLS policies are working.');
console.log('If you see "Update failed" or "0 rows affected", you need to:');
console.log('1. Open Supabase SQL Editor');
console.log('2. Run the RLS policy SQL script');
console.log('3. Re-run this test');
console.log('');

testApprovalAfterFix();
