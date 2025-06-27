// Simple registration test to bypass complex service
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simple registration function that mimics what should work
window.testSimpleRegistration = async () => {
  console.log('🧪 Testing simple registration from browser...');
  
  const testEmail = `browser-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Browser Test User',
          user_type: 'student'
        }
      }
    });
    
    if (error) {
      console.error('❌ Browser registration failed:', error);
      alert(`Registration failed: ${error.message}`);
    } else {
      console.log('✅ Browser registration successful!', data);
      alert('Registration successful! Check console for details.');
    }
  } catch (err) {
    console.error('❌ Exception during registration:', err);
    alert(`Exception: ${err.message}`);
  }
};

console.log('🚀 Simple registration test loaded. Run window.testSimpleRegistration() in console.');
