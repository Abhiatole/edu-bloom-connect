// Final Registration Workflow Verification
// This script provides a comprehensive summary of the current state

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function finalVerification() {
  console.log('🔍 FINAL STUDENT REGISTRATION WORKFLOW VERIFICATION');
  console.log('=' .repeat(60));
  console.log('');

  try {
    // 1. Database Schema Verification
    console.log('📊 1. DATABASE SCHEMA STATUS');
    console.log('-'.repeat(30));
    
    const schemaChecks = [
      { table: 'student_profiles', desc: 'Main student data table' },
      { table: 'subjects', desc: 'Available subjects' },
      { table: 'batches', desc: 'Available batches (NEET/JEE/CET/Other)' },
      { table: 'student_subjects', desc: 'Student-Subject enrollments' },
      { table: 'student_batches', desc: 'Student-Batch enrollments' },
      { table: 'teacher_profiles', desc: 'Teachers for approval workflow' }
    ];
    
    for (const check of schemaChecks) {
      try {
        const { data, error, count } = await supabase
          .from(check.table)
          .select('*', { count: 'exact' })
          .limit(1);
        
        const status = error ? '❌' : '✅';
        const recordCount = error ? 'ERROR' : `${count || 0} records`;
        console.log(`${status} ${check.table}: ${check.desc} (${recordCount})`);
      } catch (e) {
        console.log(`❌ ${check.table}: ${check.desc} - ERROR: ${e.message}`);
      }
    }
    
    // 2. Available Options
    console.log('\n📚 2. AVAILABLE REGISTRATION OPTIONS');
    console.log('-'.repeat(35));
    
    const { data: subjects } = await supabase.from('subjects').select('name').order('name');
    const { data: batches } = await supabase.from('batches').select('name').order('name');
    
    console.log('Subjects:', subjects?.map(s => s.name).join(', ') || 'None');
    console.log('Batches:', batches?.map(b => b.name).join(', ') || 'None');
    
    // 3. Student Data Analysis
    console.log('\n👥 3. CURRENT STUDENT DATA');
    console.log('-'.repeat(25));
    
    const { data: students } = await supabase
      .from('student_profiles')
      .select('id, full_name, email, status, enrollment_no, created_at')
      .order('created_at', { ascending: false });
    
    if (students && students.length > 0) {
      console.log(`Total students: ${students.length}`);
      
      const statusCounts = students.reduce((acc, student) => {
        acc[student.status] = (acc[student.status] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
      });
      
      const withEnrollmentNo = students.filter(s => s.enrollment_no).length;
      console.log(`Students with enrollment numbers: ${withEnrollmentNo}/${students.length}`);
    } else {
      console.log('No students found');
    }
    
    // 4. Enrollment Relationships
    console.log('\n🔗 4. ENROLLMENT RELATIONSHIPS');
    console.log('-'.repeat(30));
    
    const { data: subjectEnrollments, count: subjectCount } = await supabase
      .from('student_subjects')
      .select('*', { count: 'exact' })
      .limit(1);
    
    const { data: batchEnrollments, count: batchCount } = await supabase
      .from('student_batches')
      .select('*', { count: 'exact' })
      .limit(1);
    
    console.log(`Subject enrollments: ${subjectCount || 0}`);
    console.log(`Batch enrollments: ${batchCount || 0}`);
    
    // 5. Teacher/Admin Data for Approval Workflow
    console.log('\n👨‍🏫 5. APPROVAL WORKFLOW COMPONENTS');
    console.log('-'.repeat(35));
    
    const { data: teachers } = await supabase
      .from('teacher_profiles')
      .select('id, full_name, status')
      .order('created_at', { ascending: false });
    
    if (teachers && teachers.length > 0) {
      console.log(`Total teachers: ${teachers.length}`);
      const approvedTeachers = teachers.filter(t => t.status === 'APPROVED').length;
      console.log(`Approved teachers (can approve students): ${approvedTeachers}`);
    } else {
      console.log('No teachers found');
    }
    
    // 6. Summary and Recommendations
    console.log('\n🎯 6. WORKFLOW STATUS SUMMARY');
    console.log('-'.repeat(30));
    
    const hasSubjects = subjects && subjects.length > 0;
    const hasBatches = batches && batches.length > 0;
    const hasApprovers = teachers && teachers.filter(t => t.status === 'APPROVED').length > 0;
    
    if (hasSubjects && hasBatches && hasApprovers) {
      console.log('✅ READY FOR FULL TESTING');
      console.log('');
      console.log('🚀 NEXT STEPS:');
      console.log('1. Test new student registration:');
      console.log('   → http://localhost:5173/register/student');
      console.log('2. Verify email confirmation process');
      console.log('3. Test admin approval workflow:');
      console.log('   → http://localhost:5173/admin/dashboard');
      console.log('4. Test student dashboard after approval:');
      console.log('   → http://localhost:5173/student/dashboard');
      console.log('');
      console.log('💡 EXPECTED WORKFLOW:');
      console.log('   Student registers → Email confirmation → Admin approval → Student dashboard access');
    } else {
      console.log('⚠️ MISSING COMPONENTS:');
      if (!hasSubjects) console.log('  - No subjects available');
      if (!hasBatches) console.log('  - No batches available');
      if (!hasApprovers) console.log('  - No approved teachers/admins for approval');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 VERIFICATION COMPLETE');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

finalVerification();
