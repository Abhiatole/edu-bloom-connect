
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, User, CheckCircle, XCircle, AlertTriangle, Users, RefreshCw } from 'lucide-react';

interface AdminStatus {
  hasAdmin: boolean;
  adminCount: number;
  pendingStudents: number;
  pendingTeachers: number;
  totalPending: number;
  adminDetails?: {
    email: string;
    fullName: string;
    createdAt: string;
  }[];
}

const AdminChecker = () => {
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    setLoading(true);
    try {
      // Check for admin users in user_profiles
      const { data: adminProfiles, error: adminError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'ADMIN')
        .order('created_at', { ascending: false });

      if (adminError) throw adminError;

      // Check pending users
      const [pendingStudentsResult, pendingTeachersResult] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact' }).eq('status', 'PENDING').eq('role', 'STUDENT'),
        supabase.from('user_profiles').select('*', { count: 'exact' }).eq('status', 'PENDING').eq('role', 'TEACHER')
      ]);

      const pendingStudents = pendingStudentsResult.count || 0;
      const pendingTeachers = pendingTeachersResult.count || 0;

      setStatus({
        hasAdmin: (adminProfiles?.length || 0) > 0,
        adminCount: adminProfiles?.length || 0,
        pendingStudents,
        pendingTeachers,
        totalPending: pendingStudents + pendingTeachers,
        adminDetails: adminProfiles?.map(admin => ({
          email: admin.email,
          fullName: admin.full_name,
          createdAt: admin.created_at
        }))
      });

    } catch (error: any) {
      console.error('Error checking admin status:', error);
      toast({
        title: "Error",
        description: "Failed to check admin status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const bulkApproveAll = async () => {
    if (!status?.totalPending) return;

    setChecking(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('You must be logged in as admin to approve users');
      }

      // Check if current user is admin
      const { data: adminProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', currentUser.user.id)
        .eq('role', 'ADMIN')
        .single();

      if (!adminProfile) {
        throw new Error('You must be logged in as an admin to approve users');
      }

      const updates = [];

      if (status.pendingStudents > 0) {
        updates.push(
          supabase.from('user_profiles')
            .update({
              status: 'APPROVED'
            })
            .eq('status', 'PENDING')
            .eq('role', 'STUDENT')
        );
      }

      if (status.pendingTeachers > 0) {
        updates.push(
          supabase.from('user_profiles')
            .update({
              status: 'APPROVED'
            })
            .eq('status', 'PENDING')
            .eq('role', 'TEACHER')
        );
      }

      const results = await Promise.all(updates);
      
      // Check for errors
      results.forEach(result => {
        if (result.error) throw result.error;
      });

      toast({
        title: "Bulk Approval Complete!",
        description: `Approved ${status.totalPending} users successfully.`,
      });

      // Refresh status
      checkAdminStatus();

    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve users",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Checking admin status...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Status Check
            </CardTitle>
            <CardDescription>
              Verify admin setup and manage pending user approvals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Admin Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className={status?.hasAdmin ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Admin Status</p>
                      <p className={`text-lg font-bold ${status?.hasAdmin ? 'text-green-600' : 'text-red-600'}`}>
                        {status?.hasAdmin ? 'Admin Exists' : 'No Admin Found'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {status?.adminCount} admin(s) configured
                      </p>
                    </div>
                    {status?.hasAdmin ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className={status?.totalPending ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Pending Approvals</p>
                      <p className={`text-lg font-bold ${status?.totalPending ? 'text-yellow-600' : 'text-gray-600'}`}>
                        {status?.totalPending || 0} Users
                      </p>
                      <p className="text-xs text-gray-500">
                        {status?.pendingStudents} students, {status?.pendingTeachers} teachers
                      </p>
                    </div>
                    <Users className={`h-8 w-8 ${status?.totalPending ? 'text-yellow-600' : 'text-gray-400'}`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Admin Details */}
            {status?.adminDetails && status.adminDetails.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Existing Admins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {status.adminDetails.map((admin, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{admin.fullName}</p>
                          <p className="text-sm text-gray-600">{admin.email}</p>
                          <p className="text-xs text-gray-400">
                            Created: {new Date(admin.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="default">Admin</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-4">
              {!status?.hasAdmin && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>No Admin Found!</strong>
                    <br />
                    You need to create a Super Admin account to manage user approvals.
                    <br />
                    <br />
                    <strong>Solutions:</strong>
                    <br />
                    1. Run the SQL script: <code>CHECK_AND_CREATE_ADMIN.sql</code>
                    <br />
                    2. Or go to: <a href="/setup-admin" className="text-blue-600 underline">/setup-admin</a>
                  </AlertDescription>
                </Alert>
              )}

              {status?.hasAdmin && status.totalPending > 0 && (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{status.totalPending} users are waiting for approval!</strong>
                    <br />
                    Use the buttons below to approve them or go to the detailed approval interface.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-3">
                <Button onClick={checkAdminStatus} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>

                {status?.hasAdmin && (
                  <>
                    <Button asChild>
                      <a href="/admin/approvals">
                        <User className="h-4 w-4 mr-2" />
                        Detailed Approvals
                      </a>
                    </Button>

                    <Button asChild variant="outline">
                      <a href="/quick-approvals">
                        Quick Approvals
                      </a>
                    </Button>

                    {status.totalPending > 0 && (
                      <Button 
                        onClick={bulkApproveAll}
                        disabled={checking}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {checking ? 'Approving...' : `Approve All (${status.totalPending})`}
                      </Button>
                    )}
                  </>
                )}

                {!status?.hasAdmin && (
                  <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <a href="/setup-admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Create Super Admin
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {status?.hasAdmin && status.totalPending === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  🎉 <strong>All set!</strong> You have admin access and no pending approvals.
                  <br />
                  Your user approval system is fully operational.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminChecker;
