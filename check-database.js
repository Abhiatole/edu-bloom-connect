import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pgwgtronuluhwuiaqkcc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabaseStructure() {
  console.log('🔍 Checking Database Structure...');
  
  const tables = [
    'student_profiles',
    'teacher_profiles', 
    'admin_profiles',
    'user_profiles'
  ];
  
  for (const table of tables) {
    try {
      console.log(`\n📋 Checking table: ${table}`);
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);
      
      if (error) {
        console.log(`❌ Error accessing ${table}:`, error.message);
        if (error.message.includes('permission denied')) {
          console.log(`🔒 RLS might be blocking access to ${table}`);
        }
      } else {
        console.log(`✅ ${table} exists with ${count} records`);
        if (data && data.length > 0) {
          console.log(`📄 Sample structure:`, Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`💥 Unexpected error with ${table}:`, err.message);
    }
  }
  
  // Check auth settings
  console.log('\n🔐 Checking Auth Settings...');
  try {
    const { data: session } = await supabase.auth.getSession();
    console.log('Current session:', session.session ? 'Active' : 'None');
    
    // Try to get user info
    const { data: user } = await supabase.auth.getUser();
    console.log('Current user:', user.user ? user.user.email : 'None');
    
  } catch (error) {
    console.log('Auth check error:', error.message);
  }
}

checkDatabaseStructure();
