import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Users, Database, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function RLSDebugTool() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const { toast } = useToast();
  const runDiagnostics = async () => {
    setIsLoading(true);
    setResults(null);
    
    try {
      // Collect all diagnostic information
      const diagnostics = {
        auth: null,
        teacherProfile: null,
        studentAccess: null,
        policiesInfo: null,
        students: {
          all: null,
          approved: null,
          count: 0
        }
      };
      
      // 1. Check authentication
      const { data: userData, error: userError } = await supabase.auth.getUser();
      diagnostics.auth = {
        isAuthenticated: !!userData.user,
        user: userData.user,
        error: userError
      };
      setCurrentUser(userData.user);
      
      if (!userData.user) {
        throw new Error('Not authenticated');
      }
      
      // 2. Check teacher profile
      try {
        const { data: profile, error: profileError } = await supabase
          .from('teacher_profiles')
          .select('*')
          .eq('user_id', userData.user.id)
          .single();
          
        diagnostics.teacherProfile = {
          exists: !!profile,
          profile,
          error: profileError
        };
        setTeacherProfile(profile);
      } catch (error) {
        diagnostics.teacherProfile = {
          exists: false,
          error
        };
      }
      
      // 3. Check student profile access
      try {
        // Try a simple query first
        const { data: studentCount, error: countError } = await supabase
          .from('student_profiles')
          .select('*', { count: 'exact', head: true });
          
        diagnostics.studentAccess = {
          canAccess: !countError,
          count: studentCount?.length || 0,
          error: countError
        };
        
        // 4. Get all student profiles
        const { data: allStudents, error: allError } = await supabase
          .from('student_profiles')
          .select('id, full_name, email, status, created_at')
          .order('created_at', { ascending: false });
          
        diagnostics.students.all = {
          count: allStudents?.length || 0,
          students: allStudents,
          error: allError
        };
        
        // 5. Get only approved students
        const { data: approvedStudents, error: approvedError } = await supabase
          .from('student_profiles')
          .select('id, full_name, email, status, created_at')
          .eq('status', 'APPROVED')
          .order('created_at', { ascending: false });
          
        diagnostics.students.approved = {
          count: approvedStudents?.length || 0,
          students: approvedStudents,
          error: approvedError
        };
        
        diagnostics.students.count = approvedStudents?.length || 0;
      } catch (error) {
        diagnostics.studentAccess = {
          canAccess: false,
          error
        };
      }
      
      setResults(diagnostics);
      
      // Show toast with results
      toast({
        title: "Diagnostics Complete",
        description: `Found ${diagnostics.students.count} approved students out of ${diagnostics.students.all?.count || 0} total students.`,
      });
    } catch (error) {
      toast({
        title: "Diagnostics Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Student Access Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Teacher Dashboard Issue</AlertTitle>
          <AlertDescription>
            This tool helps diagnose why active students are not showing in your dashboard.
            It checks RLS policies and student data to identify the problem.
          </AlertDescription>
        </Alert>
        
        {results && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">              <div className="bg-muted p-3 rounded-md">
                <h3 className="text-sm font-medium mb-1">Authentication</h3>
                <Badge variant={results.auth.isAuthenticated ? "default" : "destructive"}>
                  {results.auth.isAuthenticated ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <h3 className="text-sm font-medium mb-1">Teacher Profile</h3>
                <Badge variant={results.teacherProfile.exists ? "default" : "destructive"}>
                  {results.teacherProfile.exists ? "Found" : "Not Found"}
                </Badge>
              </div>
              
              <div className="bg-muted p-3 rounded-md">
                <h3 className="text-sm font-medium mb-1">Student Access</h3>
                <Badge variant={results.studentAccess.canAccess ? "default" : "destructive"}>
                  {results.studentAccess.canAccess ? "Can Access" : "Access Denied"}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium mb-2">Student Counts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Students</span>
                    <Badge variant="outline">{results.students.all?.count || 0}</Badge>
                  </div>
                </div>
                
                <div className="border rounded-md p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Approved Students</span>
                    <Badge variant="outline">{results.students.approved?.count || 0}</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {results.students.approved?.count === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Approved Students</AlertTitle>
                <AlertDescription>
                  There are no students with 'APPROVED' status in the database. 
                  This is why no active students are showing in your dashboard.
                </AlertDescription>
              </Alert>
            )}
            
            {results.students.all?.count > 0 && results.students.approved?.count === 0 && (
              <div className="p-3 border rounded-md bg-amber-50 dark:bg-amber-950/20">
                <h3 className="font-medium mb-2">Student Status Issue Detected</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  You have {results.students.all?.count} students in the database, but none are approved.
                  Students need to have status='APPROVED' to appear as active students.
                </p>
                
                <Button variant="default" size="sm" onClick={() => window.location.href = '/admin/approvals'}>
                  <Users className="h-4 w-4 mr-2" />
                  Go to User Approvals
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={runDiagnostics} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            "Run Student Access Diagnostics"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
