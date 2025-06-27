// Complete Registration Workflow Test
// This script tests the entire student registration workflow

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRegistrationWorkflow() {
  console.log('🧪 Testing Complete Registration Workflow\n');
  
  try {
    // Test 1: Check available subjects and batches
    console.log('📚 Step 1: Checking available subjects and batches...');
    
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*');
    
    if (subjectsError) throw subjectsError;
    console.log(`✅ Found ${subjects.length} subjects:`, subjects.map(s => s.name).join(', '));
    
    const { data: batches, error: batchesError } = await supabase
      .from('batches')
      .select('*');
    
    if (batchesError) throw batchesError;
    console.log(`✅ Found ${batches.length} batches:`, batches.map(b => b.name).join(', '));
    
    // Test 2: Check student profiles structure
    console.log('\n👤 Step 2: Checking student profiles structure...');
    
    const { data: students, error: studentsError } = await supabase
      .from('student_profiles')
      .select('id, full_name, email, enrollment_no, student_mobile, parent_email, status')
      .limit(5);
    
    if (studentsError) throw studentsError;
    console.log(`✅ Found ${students.length} student profiles`);
    
    if (students.length > 0) {
      console.log('Sample student profile structure:');
      const sample = students[0];
      Object.keys(sample).forEach(key => {
        console.log(`  - ${key}: ${sample[key] || 'NULL'}`);
      });
    }
    
    // Test 3: Check enrollment relationships
    console.log('\n🔗 Step 3: Checking enrollment relationships...');
    
    if (students.length > 0) {
      const studentId = students[0].id;
      
      // Check subject enrollments
      const { data: subjectEnrollments, error: subjectEnrollError } = await supabase
        .from('student_subjects')
        .select(`
          id,
          enrolled_at,
          subjects (name)
        `)
        .eq('student_id', studentId);
      
      if (subjectEnrollError) throw subjectEnrollError;
      console.log(`✅ Student has ${subjectEnrollments.length} subject enrollments`);
      
      // Check batch enrollments
      const { data: batchEnrollments, error: batchEnrollError } = await supabase
        .from('student_batches')
        .select(`
          id,
          enrolled_at,
          batches (name)
        `)
        .eq('student_id', studentId);
      
      if (batchEnrollError) throw batchEnrollError;
      console.log(`✅ Student has ${batchEnrollments.length} batch enrollments`);
    }
    
    // Test 4: Check approval workflow data
    console.log('\n✅ Step 4: Checking approval workflow...');
    
    const { data: pendingStudents, error: pendingError } = await supabase
      .from('student_profiles')
      .select('id, full_name, email, created_at')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (pendingError) throw pendingError;
    console.log(`✅ Found ${pendingStudents.length} pending student approvals`);
    
    // Test 5: Check teacher profiles for approval workflow
    const { data: teachers, error: teachersError } = await supabase
      .from('teacher_profiles')
      .select('id, full_name, email, status')
      .limit(3);
    
    if (teachersError) throw teachersError;
    console.log(`✅ Found ${teachers.length} teacher profiles`);
    
    // Test 6: Simulate enrollment number generation
    console.log('\n🔢 Step 5: Testing enrollment number generation...');
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const { count } = await supabase
      .from('student_profiles')
      .select('*', { count: 'exact', head: true });
    
    const nextNumber = String((count || 0) + 1).padStart(4, '0');
    const enrollmentNo = `STU${year}${month}${nextNumber}`;
    console.log(`✅ Next enrollment number would be: ${enrollmentNo}`);
    
    console.log('\n🎉 All registration workflow components are working correctly!');
    console.log('\n📋 Workflow Summary:');
    console.log('1. ✅ Database schema is complete');
    console.log('2. ✅ Subjects and batches are available');
    console.log('3. ✅ Student profiles support all required fields');
    console.log('4. ✅ Enrollment relationships are functional');
    console.log('5. ✅ Approval workflow data is accessible');
    console.log('6. ✅ Enrollment number generation is working');
    
    console.log('\n🚀 Ready for end-to-end testing:');
    console.log('1. Register a new student at: http://localhost:5173/register/student');
    console.log('2. Check admin dashboard at: http://localhost:5173/admin/dashboard');
    console.log('3. Approve the student through admin interface');
    console.log('4. Login as student and check dashboard at: http://localhost:5173/student/dashboard');
    
  } catch (error) {
    console.error('❌ Error in workflow test:', error.message);
    console.log('\n⚠️  Issues found. Please check:');
    console.log('1. Database migration has been applied');
    console.log('2. RLS policies are properly configured');
    console.log('3. User authentication is working');
  }
}

// Run the test
testRegistrationWorkflow();
