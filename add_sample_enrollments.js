// Add sample enrollment data for existing students
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function addSampleEnrollments() {
  try {
    console.log('📝 Adding sample enrollments for existing students...\n');
    
    // Get first student
    const { data: students } = await supabase
      .from('student_profiles')
      .select('id, full_name')
      .limit(1);
    
    if (!students || students.length === 0) {
      console.log('No students found');
      return;
    }
    
    const student = students[0];
    console.log(`Adding enrollments for: ${student.full_name}`);
    
    // Get some subjects and batches
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name')
      .in('name', ['Physics', 'Chemistry', 'Mathematics']);
    
    const { data: batches } = await supabase
      .from('batches')
      .select('id, name')
      .in('name', ['NEET', 'JEE']);
    
    // Add subject enrollments
    if (subjects && subjects.length > 0) {
      for (const subject of subjects) {
        const { data, error } = await supabase
          .from('student_subjects')
          .insert({
            student_id: student.id,
            subject_id: subject.id
          });
        
        if (error && !error.message.includes('duplicate')) {
          console.error('Error adding subject enrollment:', error);
        } else {
          console.log(`✅ Added ${subject.name} enrollment`);
        }
      }
    }
    
    // Add batch enrollments
    if (batches && batches.length > 0) {
      for (const batch of batches) {
        const { data, error } = await supabase
          .from('student_batches')
          .insert({
            student_id: student.id,
            batch_id: batch.id
          });
        
        if (error && !error.message.includes('duplicate')) {
          console.error('Error adding batch enrollment:', error);
        } else {
          console.log(`✅ Added ${batch.name} enrollment`);
        }
      }
    }
    
    console.log('\n🎉 Sample enrollments added successfully!');
    console.log('You can now test the student dashboard to see enrollment data.');
    
  } catch (error) {
    console.error('Error adding sample enrollments:', error);
  }
}

addSampleEnrollments();
