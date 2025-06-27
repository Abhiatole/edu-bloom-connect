// Check current approval system components
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkApprovalSystem() {
  console.log('🔍 CHECKING CURRENT APPROVAL SYSTEM COMPONENTS');
  console.log('='.repeat(50));
  
  try {
    // 1. Check students table structure and data
    console.log('\n📚 1. STUDENT PROFILES:');
    const { data: students, error: studentsError } = await supabase
      .from('student_profiles')
      .select('id, full_name, email, status, class_level, created_at')
      .order('created_at', { ascending: false });
    
    if (studentsError) {
      console.log('❌ Error fetching students:', studentsError.message);
    } else {
      console.log(`Total students: ${students.length}`);
      const statusCounts = students.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {});
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
      });
    }
    
    // 2. Check subjects table
    console.log('\n📖 2. SUBJECTS:');
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    
    if (subjectsError) {
      console.log('❌ Error fetching subjects:', subjectsError.message);
    } else {
      console.log(`Available subjects: ${subjects.length}`);
      subjects.forEach(s => console.log(`  - ${s.name}`));
    }
    
    // 3. Check teachers table
    console.log('\n👨‍🏫 3. TEACHERS:');
    const { data: teachers, error: teachersError } = await supabase
      .from('teacher_profiles')
      .select('id, full_name, email, status, subject_specialization')
      .order('created_at', { ascending: false });
    
    if (teachersError) {
      console.log('❌ Error fetching teachers:', teachersError.message);
    } else {
      console.log(`Total teachers: ${teachers.length}`);
      teachers.forEach(t => {
        console.log(`  - ${t.full_name} (${t.status}) - ${t.subject_specialization || 'No specialization'}`);
      });
    }
    
    // 4. Check student-subject relationships
    console.log('\n🔗 4. STUDENT-SUBJECT ENROLLMENTS:');
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('student_subjects')
      .select(`
        student_id,
        subjects(name),
        student_profiles(full_name, status)
      `)
      .limit(10);
    
    if (enrollmentsError) {
      console.log('❌ Error fetching enrollments:', enrollmentsError.message);
    } else {
      console.log(`Total enrollments: ${enrollments.length}`);
      enrollments.forEach(e => {
        console.log(`  - ${e.student_profiles?.full_name} → ${e.subjects?.name} (${e.student_profiles?.status})`);
      });
    }
    
    // 5. Check what's needed for approval system
    console.log('\n✅ 5. APPROVAL SYSTEM REQUIREMENTS:');
    
    const requirements = [
      {
        item: 'Students table with approval status',
        status: students && students.length > 0 ? '✅' : '❌',
        details: students ? `${students.length} students found` : 'No students'
      },
      {
        item: 'Subjects for teacher filtering',
        status: subjects && subjects.length > 0 ? '✅' : '❌',
        details: subjects ? `${subjects.length} subjects found` : 'No subjects'
      },
      {
        item: 'Teachers for approval workflow',
        status: teachers && teachers.length > 0 ? '✅' : '❌',
        details: teachers ? `${teachers.length} teachers found` : 'No teachers'
      },
      {
        item: 'Student-subject relationships',
        status: enrollments && enrollments.length > 0 ? '✅' : '❌',
        details: enrollments ? `${enrollments.length} relationships found` : 'No relationships'
      }
    ];
    
    requirements.forEach(req => {
      console.log(`${req.status} ${req.item}: ${req.details}`);
    });
    
    // 6. Check pending students specifically
    console.log('\n⏳ 6. PENDING STUDENTS (for approval):');
    const pendingStudents = students?.filter(s => s.status === 'PENDING') || [];
    console.log(`Pending students: ${pendingStudents.length}`);
    
    if (pendingStudents.length === 0) {
      console.log('🎯 No pending students found. Create test data or register new students.');
    } else {
      pendingStudents.forEach(s => {
        console.log(`  - ${s.full_name} (${s.email}) - Class ${s.class_level}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during check:', error);
  }
}

checkApprovalSystem();
