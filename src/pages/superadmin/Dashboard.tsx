import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Settings,
  UserCheck,
  FileText,
  BarChart3,
  Brain,
  Clock,
  Award,
  AlertCircle
} from 'lucide-react';
const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalExams: 0,
    pendingApprovals: 0,
    approvedStudents: 0,
    approvedTeachers: 0,
    recentExams: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  useEffect(() => {
    fetchDashboardStats();
  }, []);
  const fetchDashboardStats = async () => {
    try {
      const [
        studentsResult,
        teachersResult,
        examsResult,
        pendingStudentsResult,
        pendingTeachersResult,
        approvedStudentsResult,
        approvedTeachersResult
      ] = await Promise.all([
        supabase.from('student_profiles').select('*', { count: 'exact' }),
        supabase.from('teacher_profiles').select('*', { count: 'exact' }),
        supabase.from('exams').select('*', { count: 'exact' }),
        supabase.from('student_profiles').select('*', { count: 'exact' }).eq('status', 'PENDING'),
        supabase.from('teacher_profiles').select('*', { count: 'exact' }).eq('status', 'PENDING'),
        supabase.from('student_profiles').select('*', { count: 'exact' }).eq('status', 'APPROVED'),
        supabase.from('teacher_profiles').select('*', { count: 'exact' }).eq('status', 'APPROVED')
      ]);
      // Get recent exams (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: recentExamsCount } = await supabase
        .from('exams')
        .select('*', { count: 'exact' })
        .gte('created_at', weekAgo.toISOString());
      setStats({
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalExams: examsResult.count || 0,
        pendingApprovals: (pendingStudentsResult.count || 0) + (pendingTeachersResult.count || 0),
        approvedStudents: approvedStudentsResult.count || 0,
        approvedTeachers: approvedTeachersResult.count || 0,
        recentExams: recentExamsCount || 0
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const quickActions = [
    {
      title: "User Approvals",
      description: "Review and approve pending registrations",
      icon: UserCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/admin/approvals",
      count: stats.pendingApprovals
    },
    {
      title: "Exam Management",
      description: "Create and manage exams and results",
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/admin/exams",
      count: stats.totalExams
    },
    {
      title: "Analytics Dashboard",
      description: "View comprehensive platform analytics",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/admin/analytics",
      count: null
    },
    {
      title: "Student Insights",
      description: "AI-powered student performance analysis",
      icon: Brain,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/teacher/insights",
      count: null
    }
  ];
  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard...</div>;
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600">Manage and monitor the entire EduGrowHub platform</p>
        </div>
        <Badge className="bg-red-100 text-red-800">
          Super Admin
        </Badge>
      </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
                <p className="text-xs text-gray-500">{stats.approvedStudents} approved</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalTeachers}</p>
                <p className="text-xs text-gray-500">{stats.approvedTeachers} approved</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalExams}</p>
                <p className="text-xs text-gray-500">{stats.recentExams} this week</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</p>
                <p className="text-xs text-gray-500">Require attention</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Access key administrative functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-3`}>
                      <action.icon className={`h-6 w-6 ${action.color}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                    {action.count !== null && (
                      <Badge variant="outline" className="text-xs">
                        {action.count} items
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.pendingApprovals > 0 ? (
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-orange-800">User Approvals Required</p>
                    <p className="text-sm text-orange-600">{stats.pendingApprovals} users awaiting approval</p>
                  </div>
                  <Link to="/admin/approvals">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      Review
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No pending actions
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Users</span>
                <Badge className="bg-green-100 text-green-800">
                  {stats.approvedStudents + stats.approvedTeachers}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Recent Exams</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {stats.recentExams}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">System Status</span>
                <Badge className="bg-green-100 text-green-800">
                  Operational
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default SuperAdminDashboard;
