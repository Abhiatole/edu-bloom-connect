// Simple project existence checker
async function checkSupabaseProject() {
  console.log('🔍 Checking if Supabase project exists...');
  
  try {
    const response = await fetch('https://pgwgtronuluhwuiaqkcc.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (response.status === 401) {
      console.log('✅ Project exists but API key is invalid (expected)');
      console.log('🔑 You need to get the correct API key from your Supabase dashboard');
    } else if (response.status === 404) {
      console.log('❌ Project does not exist or URL is incorrect');
      console.log('🚨 Your Supabase project might have been deleted or the URL is wrong');
    } else {
      console.log('🤔 Unexpected response. Project might exist but has other issues.');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('🌐 Check your internet connection or the Supabase URL might be wrong');
  }
}

checkSupabaseProject();
