import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserCheck, Shield, X } from 'lucide-react';
import RLSErrorBoundary from '@/components/RLSErrorBoundary';
const TeacherApprovalTool = () => {
  const [pendingTeachers, setPendingTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const { toast } = useToast();
  useEffect(() => {
    fetchPendingTeachers();
  }, []);
  const fetchPendingTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('status', 'PENDING');
      
      if (error) throw error;
      
      setPendingTeachers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load pending teachers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const approveTeacher = async (teacherId: string) => {
    setApproving(teacherId);
    try {
      const { error } = await supabase
        .from('teacher_profiles')
        .update({ status: 'APPROVED' })
        .eq('user_id', teacherId);
      
      if (error) throw error;
      
      toast({
        title: "Teacher Approved",
        description: "Teacher has been approved successfully",
      });
      
      fetchPendingTeachers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve teacher",
        variant: "destructive"
      });
    } finally {
      setApproving(null);
    }
  };
  const approveAllTeachers = async () => {
    if (pendingTeachers.length === 0) return;
    
    setLoading(true);
    try {
      const teacherIds = pendingTeachers.map(teacher => teacher.user_id);
      
      const { error } = await supabase
        .from('teacher_profiles')
        .update({ status: 'APPROVED' })
        .in('user_id', teacherIds);
      
      if (error) throw error;
      
      toast({
        title: "All Teachers Approved",
        description: `Successfully approved ${teacherIds.length} teachers`,
      });
      
      fetchPendingTeachers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve teachers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <RLSErrorBoundary>
      <Card className="w-full">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Teacher Approval Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingTeachers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No pending teacher approvals</p>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {pendingTeachers.length} teacher{pendingTeachers.length !== 1 ? 's' : ''} pending approval
                </p>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={approveAllTeachers}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Approve All
                </Button>
              </div>
              
              <div className="space-y-3">
                {pendingTeachers.map((teacher) => (
                  <div 
                    key={teacher.user_id} 
                    className="p-3 border rounded-lg flex justify-between items-center hover:bg-accent/20"
                  >
                    <div>
                      <div className="font-medium flex items-center">
                        {teacher.full_name}
                        <Badge variant="outline" className="ml-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                          Pending
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {teacher.subject_expertise || 'No subject specified'} • {teacher.experience_years || '0'} years exp.
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => approveTeacher(teacher.user_id)}
                      disabled={approving === teacher.user_id}
                      className="bg-green-100 hover:bg-green-200 text-green-800"
                    >
                      {approving === teacher.user_id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-800"></div>
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      <span className="ml-1">Approve</span>
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </RLSErrorBoundary>
  );
};
export default TeacherApprovalTool;
