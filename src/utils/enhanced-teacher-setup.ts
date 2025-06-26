import { supabase } from '@/integrations/supabase/client';
export const setupEnhancedTeacherDashboard = async () => {
  try {
    // Check if tables exist, if not create them
    const { data: examTableData, error: examTableError } = await supabase
      .from('exams')
      .select('*')
      .limit(1);
    if (examTableError && examTableError.code === 'PGRST116') {
      
      // The table creation should be done via SQL migration
      // This is just a check - the actual table creation happens in SQL
      throw new Error('Please run the enhanced_teacher_dashboard_schema.sql script first');
    }
    // Check if exam_results table exists
    const { data: resultsTableData, error: resultsTableError } = await supabase
      .from('exam_results')
      .select('*')
      .limit(1);
    if (resultsTableError && resultsTableError.code === 'PGRST116') {
      throw new Error('Please run the enhanced_teacher_dashboard_schema.sql script first');
    }
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message,
      suggestion: 'Please run the enhanced_teacher_dashboard_schema.sql script in your Supabase SQL editor first.'
    };
  }
};
export const checkDatabaseSetup = async () => {
  try {
    // Test basic read operations
    const [examsResult, resultsResult] = await Promise.allSettled([
      supabase.from('exams').select('id').limit(1),
      supabase.from('exam_results').select('id').limit(1)
    ]);
    const missingTables = [];
    if (examsResult.status === 'rejected') {
      missingTables.push('exams');
    }
    if (resultsResult.status === 'rejected') {
      missingTables.push('exam_results');
    }
    return {
      ready: missingTables.length === 0,
      missingTables
    };
  } catch (error) {
    return {
      ready: false,
      error: 'Failed to check database setup'
    };
  }
};
