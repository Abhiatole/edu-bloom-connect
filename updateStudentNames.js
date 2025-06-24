// updateStudentNames.js
// This script updates student names and enrollment numbers using the Supabase JS client

import { supabase } from './src/integrations/supabase/client.js';

const studentData = [
  { full_name: 'John Smith', enrollment_no: 'S1000' },
  { full_name: 'Emma Johnson', enrollment_no: 'S1001' },
  { full_name: 'Michael Davis', enrollment_no: 'S1002' },
  { full_name: 'Sophia Wilson', enrollment_no: 'S1003' },
  { full_name: 'Daniel Taylor', enrollment_no: 'S1004' },
  { full_name: 'Olivia Brown', enrollment_no: 'S1005' }
];

async function updateStudentNames() {
  try {
    console.log('Fetching student profiles...');
    
    // Get all student profiles, ordered by creation date
    const { data: students, error: fetchError } = await supabase
      .from('student_profiles')
      .select('id, full_name')
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`Found ${students?.length} student profiles`);
    
    if (!students || students.length === 0) {
      console.log('No student profiles found to update.');
      return;
    }
    
    // Update each student with new data
    for (let i = 0; i < Math.min(students.length, studentData.length); i++) {
      const student = students[i];
      const newData = studentData[i];
      
      console.log(`Updating student ${i+1}: ${student.full_name || 'Unknown'} -> ${newData.full_name}`);
      
      const { error: updateError } = await supabase
        .from('student_profiles')
        .update({ 
          full_name: newData.full_name,
          enrollment_no: newData.enrollment_no 
        })
        .eq('id', student.id);
      
      if (updateError) {
        console.error(`Error updating student ${student.id}:`, updateError);
      } else {
        console.log(`Successfully updated student to ${newData.full_name} (${newData.enrollment_no})`);
      }
    }
    
    console.log('Student update process complete.');
    
  } catch (error) {
    console.error('Error in updateStudentNames:', error);
  }
}

// Execute the function
updateStudentNames();
