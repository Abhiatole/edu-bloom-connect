// Create test pending student for approval system testing
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestPendingStudent() {
  console.log('🧪 Creating test pending student for approval system...');
  
  try {
    // First create a test user in auth
    const testEmail = `test-student-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('📝 Creating auth user:', testEmail);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Student Pending',
          user_type: 'student',
          class_level: '11',
          guardian_name: 'Test Guardian',
          guardian_mobile: '9876543210',
          selected_subjects: ['Physics', 'Chemistry', 'Mathematics'],
          selected_batches: ['NEET', 'JEE']
        }
      }
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    if (!authData.user) {
      console.error('❌ No user data returned');
      return;
    }
    
    console.log('✅ Auth user created:', authData.user.id);
    
    // Now create student profile with PENDING status
    const studentProfile = {
      user_id: authData.user.id,
      full_name: 'Test Student Pending',
      email: testEmail,
      class_level: 11,
      guardian_name: 'Test Guardian',
      guardian_mobile: '9876543210',
      student_mobile: '9876543211',
      status: 'PENDING',
      is_approved: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📋 Creating student profile...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('student_profiles')
      .insert([studentProfile])
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Profile creation error:', profileError);
      return;
    }
    
    console.log('✅ Student profile created:', profileData.id);
    
    console.log('🎉 Test pending student created successfully!');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Password:', testPassword);
    console.log('👤 Student ID:', profileData.id);
    console.log('📋 Status:', profileData.status);
    
    console.log('\n🔍 Now you can test the approval system:');
    console.log('1. Go to Admin Dashboard: http://localhost:5173/admin/dashboard');
    console.log('2. Look for the Student Approval System section');
    console.log('3. You should see the pending student');
    console.log('4. Test approve/reject functionality');
    
  } catch (error) {
    console.error('💥 Error creating test student:', error);
  }
}

createTestPendingStudent();
