// Check current student_profiles schema
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
  try {
    console.log('📋 Checking student_profiles table schema...\n');
    
    // Get a sample record to see available columns
    const { data: sample, error } = await supabase
      .from('student_profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error.message);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('Current student_profiles columns:');
      Object.keys(sample[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof sample[0][key]} (${sample[0][key] || 'NULL'})`);
      });
    } else {
      console.log('No student profiles found in database');
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();
