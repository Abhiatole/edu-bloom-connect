// Test script to verify admin approval functionality
// Run this after clicking approve to see if the database was actually updated

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('⚠️ Environment variables not found, using hardcoded values');
  // You can temporarily add your values here for testing
  // const supabaseUrl = 'your-supabase-url';
  // const supabaseAnonKey = 'your-anon-key';
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkApprovalStatus() {
  console.log('🔍 CHECKING APPROVAL STATUS');
  console.log('==========================');
  
  try {
    // Check student profiles
    const { data: students, error: studentError } = await supabase
      .from('student_profiles')
      .select('user_id, enrollment_no, approval_date, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (studentError) {
      console.error('❌ Student profiles error:', studentError.message);
    } else {
      console.log('\n📚 RECENT STUDENT PROFILES:');
      students?.forEach(student => {
        const status = student.approval_date ? '✅ APPROVED' : '⏳ PENDING';
        console.log(`  ${student.enrollment_no}: ${status}`);
        if (student.approval_date) {
          console.log(`    Approved: ${new Date(student.approval_date).toLocaleString()}`);
        }
        console.log(`    Updated: ${new Date(student.updated_at).toLocaleString()}`);
      });
    }
    
    // Check teacher profiles  
    const { data: teachers, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('user_id, employee_id, approval_date, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (teacherError) {
      console.error('❌ Teacher profiles error:', teacherError.message);
    } else {
      console.log('\n👨‍🏫 RECENT TEACHER PROFILES:');
      teachers?.forEach(teacher => {
        const status = teacher.approval_date ? '✅ APPROVED' : '⏳ PENDING';
        console.log(`  ${teacher.employee_id}: ${status}`);  
        if (teacher.approval_date) {
          console.log(`    Approved: ${new Date(teacher.approval_date).toLocaleString()}`);
        }
        console.log(`    Updated: ${new Date(teacher.updated_at).toLocaleString()}`);
      });
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('- If you just clicked "Approve" and don\'t see the approval_date, the database update failed');
    console.log('- If you see the approval_date but UI doesn\'t update, it\'s a frontend state issue');
    console.log('- Check the browser console for detailed logs from the approval process');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkApprovalStatus();
