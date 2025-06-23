import { supabase } from '@/integrations/supabase/client';

/**
 * This diagnostic script tests the Supabase connection and RLS permissions
 * Run this script to diagnose issues with fetching users in the admin dashboard
 */
const runDiagnostics = async () => {
  console.log('🔍 Starting Supabase connection diagnostics...');
  
  try {
    // Step 1: Test authentication
    console.log('\n📊 Checking current user...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Authentication error:', userError.message);
    } else if (!userData.user) {
      console.warn('⚠️ No authenticated user found. Some tests may fail.');
    } else {
      console.log('✅ Authenticated as:', userData.user.email);
      console.log('🔑 User ID:', userData.user.id);
      console.log('👤 User role:', userData.user.user_metadata?.role || 'No role found');
    }
    
    // Step 2: Test student_profiles table access
    console.log('\n📊 Testing student_profiles table access...');
    const { data: students, error: studentsError } = await supabase
      .from('student_profiles')
      .select('*')
      .limit(3);
      
    if (studentsError) {
      console.error('❌ Error accessing student_profiles:', studentsError.message);
      if (studentsError.message.includes('does not exist')) {
        console.error('   Table does not exist - Run the FIX_FETCH_USERS_ADMIN_DASHBOARD.sql script');
      } else if (studentsError.message.includes('permission denied')) {
        console.error('   Permission denied - RLS policies are blocking access');
      }
    } else {
      console.log(`✅ Successfully retrieved ${students.length} student profiles`);
      if (students.length === 0) {
        console.warn('⚠️ No student profiles found - table may be empty');
      } else {
        console.log('   Sample student:', students[0]);
      }
    }
    
    // Step 3: Test teacher_profiles table access
    console.log('\n📊 Testing teacher_profiles table access...');
    const { data: teachers, error: teachersError } = await supabase
      .from('teacher_profiles')
      .select('*')
      .limit(3);
      
    if (teachersError) {
      console.error('❌ Error accessing teacher_profiles:', teachersError.message);
      if (teachersError.message.includes('does not exist')) {
        console.error('   Table does not exist - Run the FIX_FETCH_USERS_ADMIN_DASHBOARD.sql script');
      } else if (teachersError.message.includes('permission denied')) {
        console.error('   Permission denied - RLS policies are blocking access');
      }
    } else {
      console.log(`✅ Successfully retrieved ${teachers.length} teacher profiles`);
      if (teachers.length === 0) {
        console.warn('⚠️ No teacher profiles found - table may be empty');
      } else {
        console.log('   Sample teacher:', teachers[0]);
      }
    }
    
    // Step 4: Check for debug view
    console.log('\n📊 Testing debug view access...');
    const { data: debugData, error: debugError } = await supabase
      .from('debug_user_profiles')
      .select('*')
      .limit(3);
      
    if (debugError) {
      console.log('ℹ️ Debug view not available:', debugError.message);
      console.log('   You can create it by running CREATE_DEBUG_VIEW.sql');
    } else {
      console.log(`✅ Successfully accessed debug view with ${debugData.length} records`);
    }
    
    // Step 5: Test is_admin function if it exists
    console.log('\n📊 Testing admin status check...');
    try {
      const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');
      
      if (adminError) {
        console.log('ℹ️ is_admin function not available:', adminError.message);
      } else {
        console.log(`✅ Admin check result: ${adminCheck ? 'You are an admin' : 'You are not an admin'}`);
      }
    } catch (e) {
      console.log('ℹ️ is_admin function not available');
    }
    
    console.log('\n🏁 Diagnostics complete!');
    console.log('If you found issues, please run the FIX_FETCH_USERS_ADMIN_DASHBOARD.sql script');
    
  } catch (e) {
    console.error('❌ Unexpected error during diagnostics:', e);
  }
};

// Run the diagnostics
runDiagnostics();

export default runDiagnostics;
