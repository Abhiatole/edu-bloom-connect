import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface DatabaseStats {
  userProfiles: number;
  studentProfiles: number;
  teacherProfiles: number;
  exams: number;
  examResults: number;
  studentInsights: number;
  feeStructures: number;
  feePayments: number;
  timetables: number;
  parentLinks: number;
  securityLogs: number;
}
export const useDatabase = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const fetchDatabaseStats = async () => {
    try {
      const [
        userProfilesResult,
        studentProfilesResult,
        teacherProfilesResult,
        examsResult,
        examResultsResult,
        studentInsightsResult,
        feeStructuresResult,
        feePaymentsResult,
        timetablesResult,
        parentLinksResult,
        securityLogsResult
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact' }),
        supabase.from('student_profiles').select('*', { count: 'exact' }),
        supabase.from('teacher_profiles').select('*', { count: 'exact' }),
        supabase.from('exams').select('*', { count: 'exact' }),
        supabase.from('exam_results').select('*', { count: 'exact' }),
        supabase.from('student_insights').select('*', { count: 'exact' }),
        supabase.from('fee_structures').select('*', { count: 'exact' }),
        supabase.from('fee_payments').select('*', { count: 'exact' }),
        supabase.from('timetables').select('*', { count: 'exact' }),
        supabase.from('parent_links').select('*', { count: 'exact' }),
        supabase.from('security_logs').select('*', { count: 'exact' })
      ]);
      setStats({
        userProfiles: userProfilesResult.count || 0,
        studentProfiles: studentProfilesResult.count || 0,
        teacherProfiles: teacherProfilesResult.count || 0,
        exams: examsResult.count || 0,
        examResults: examResultsResult.count || 0,
        studentInsights: studentInsightsResult.count || 0,
        feeStructures: feeStructuresResult.count || 0,
        feePayments: feePaymentsResult.count || 0,
        timetables: timetablesResult.count || 0,
        parentLinks: parentLinksResult.count || 0,
        securityLogs: securityLogsResult.count || 0
      });
    } catch (error) {
      toast({
        title: "Database Error",
        description: "Failed to fetch database statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDatabaseStats();
  }, []);
  return { stats, loading, refetch: fetchDatabaseStats };
};
