import { supabase } from '@/integrations/supabase/client';

export const testDatabase = async () => {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('student_profiles').select('count').limit(1);
    
    if (error) {
      console.error('Database connection error:', error);
      return false;
    }
    
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database test failed:', error);
    return false;
  }
};

export const checkTablesExist = async () => {
  console.log('Checking database tables...');
  
  try {
    // Test student_profiles table
    const { data: studentData, error: studentError } = await supabase
      .from('student_profiles')
      .select('count')
      .limit(1);
    
    console.log('student_profiles table:', studentError ? 'ERROR - ' + studentError.message : 'OK');
    
    // Test user_profiles table
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);
    
    console.log('user_profiles table:', userError ? 'ERROR - ' + userError.message : 'OK');
    
    // Test teacher_profiles table
    const { data: teacherData, error: teacherError } = await supabase
      .from('teacher_profiles')
      .select('count')
      .limit(1);
    
    console.log('teacher_profiles table:', teacherError ? 'ERROR - ' + teacherError.message : 'OK');
    
    return {
      student_profiles: !studentError,
      user_profiles: !userError,
      teacher_profiles: !teacherError
    };
  } catch (error) {
    console.error('Database check failed:', error);
    return {};
  }
};
