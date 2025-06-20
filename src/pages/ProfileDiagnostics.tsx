import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const ProfileDiagnostics = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setUserData(data.user);
    };

    checkAuth();
  }, []);

  const runDiagnostics = async () => {
    if (!userData) {
      toast({
        title: 'Error',
        description: 'You must be logged in to run diagnostics',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const userId = userData.id;
      
      // Check student profile
      const { data: studentData, error: studentError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', userId);
      
      // Check teacher profile
      const { data: teacherData, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', userId);
      
      // Check admin profile
      const { data: adminData, error: adminError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'ADMIN');
      
      setResults({
        student: {
          exists: studentData && studentData.length > 0,
          data: studentData,
          error: studentError
        },
        teacher: {
          exists: teacherData && teacherData.length > 0,
          data: teacherData,
          error: teacherError
        },
        admin: {
          exists: adminData && adminData.length > 0,
          data: adminData,
          error: adminError
        },
        metadata: userData.user_metadata
      });

      toast({
        title: 'Diagnostics Complete',
        description: 'Check the results below',
      });
    } catch (error: any) {
      console.error('Diagnostics error:', error);
      toast({
        title: 'Diagnostics Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createMissingProfile = async () => {
    if (!userData) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a profile',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const userMetadata = userData.user_metadata;
      const role = userMetadata?.role?.toUpperCase();

      if (!role || !['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
        throw new Error('Invalid or missing role in user metadata');
      }

      // This will attempt to create the profile based on user metadata
      const { data, error } = await supabase.functions.invoke('create-profile', {
        body: { userId: userData.id, metadata: userMetadata },
      });

      if (error) throw error;

      toast({
        title: 'Profile Created',
        description: 'Your profile has been created successfully',
      });

      // Refresh the diagnostics
      runDiagnostics();
    } catch (error: any) {
      console.error('Profile creation error:', error);
      toast({
        title: 'Profile Creation Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Diagnostics</CardTitle>
          <CardDescription>Check and fix profile issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userData ? (
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <h3 className="font-semibold">Logged in as:</h3>
              <p>Email: {userData.email}</p>
              <p>User ID: {userData.id}</p>
              <p>Email confirmed: {userData.email_confirmed_at ? 'Yes' : 'No'}</p>
              <p>Role: {userData.user_metadata?.role || 'Not set'}</p>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-md mb-4">
              <p className="font-semibold">Not logged in</p>
              <p>Please login to run diagnostics</p>
            </div>
          )}

          <div className="flex space-x-4">
            <Button onClick={runDiagnostics} disabled={loading || !userData}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run Diagnostics
            </Button>
            <Button onClick={createMissingProfile} disabled={loading || !userData} variant="outline">
              Create Missing Profile
            </Button>
          </div>

          {results && (
            <div className="mt-8 space-y-6">
              <h3 className="text-lg font-bold">Diagnostic Results</h3>

              <div className="space-y-4">
                <div className={`p-4 rounded-md ${results.student.exists ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <h4 className="font-semibold">Student Profile</h4>
                  <p>{results.student.exists ? 'Profile found' : 'No profile found'}</p>
                  {results.student.error && (
                    <p className="text-red-500">Error: {results.student.error.message}</p>
                  )}
                  {results.student.exists && (
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs">
                      {JSON.stringify(results.student.data, null, 2)}
                    </pre>
                  )}
                </div>

                <div className={`p-4 rounded-md ${results.teacher.exists ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <h4 className="font-semibold">Teacher Profile</h4>
                  <p>{results.teacher.exists ? 'Profile found' : 'No profile found'}</p>
                  {results.teacher.error && (
                    <p className="text-red-500">Error: {results.teacher.error.message}</p>
                  )}
                  {results.teacher.exists && (
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs">
                      {JSON.stringify(results.teacher.data, null, 2)}
                    </pre>
                  )}
                </div>

                <div className={`p-4 rounded-md ${results.admin.exists ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <h4 className="font-semibold">Admin Profile</h4>
                  <p>{results.admin.exists ? 'Profile found' : 'No profile found'}</p>
                  {results.admin.error && (
                    <p className="text-red-500">Error: {results.admin.error.message}</p>
                  )}
                  {results.admin.exists && (
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs">
                      {JSON.stringify(results.admin.data, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="p-4 rounded-md bg-blue-50">
                  <h4 className="font-semibold">User Metadata</h4>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 text-xs">
                    {JSON.stringify(results.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileDiagnostics;
