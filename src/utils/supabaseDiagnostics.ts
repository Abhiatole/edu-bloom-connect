import { supabase } from '@/integrations/supabase/client';
/**
 * This diagnostic script tests the Supabase connection and RLS permissions
 * Run this script to diagnose issues with fetching users in the admin dashboard
 */
const runDiagnostics = async () => {
  
  try {
    // Step 1: Test authentication
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
    } else if (!userData.user) {
    } else {
    }
    
    // Step 2: Test student_profiles table access
    const { data: students, error: studentsError } = await supabase
      .from('student_profiles')
      .select('*')
      .limit(3);
      
    if (studentsError) {
      if (studentsError.message.includes('does not exist')) {
      } else if (studentsError.message.includes('permission denied')) {
      }
    } else {
      if (students.length === 0) {
      } else {
      }
    }
    
    // Step 3: Test teacher_profiles table access
    const { data: teachers, error: teachersError } = await supabase
      .from('teacher_profiles')
      .select('*')
      .limit(3);
      
    if (teachersError) {
      if (teachersError.message.includes('does not exist')) {
      } else if (teachersError.message.includes('permission denied')) {
      }
    } else {
      if (teachers.length === 0) {
      } else {
      }
    }
    
    // Step 4: Check for debug view
    const { data: debugData, error: debugError } = await supabase
      .from('debug_user_profiles')
      .select('*')
      .limit(3);
      
    if (debugError) {
    } else {
    }
    
    // Step 5: Test is_admin function if it exists
    try {
      const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin');
      
      if (adminError) {
      } else {
      }
    } catch (e) {
    }
    
    
  } catch (e) {
  }
};
// Run the diagnostics
runDiagnostics();
export default runDiagnostics;
