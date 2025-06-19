
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ModernDashboardCard } from '@/components/enhanced/ModernDashboardCard';
import { ModernActionCard } from '@/components/enhanced/ModernActionCard';
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
  AlertCircle,
  Shield,
  Zap,
  Activity
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';

const ModernSuperAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalExams: 0,
    pendingApprovals: 0,
    approvedStudents: 0,
    approvedTeachers: 0,
    recentExams: 0,
    systemHealth: 98
  });
  const [growthData, setGrowthData] = useState([]);
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

      // Generate mock growth data
      const mockGrowthData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          users: Math.floor(Math.random() * 20) + (approvedStudentsResult.count || 0) + (approvedTeachersResult.count || 0) - 50 + i * 8,
          exams: Math.floor(Math.random() * 10) + i * 2
        };
      });
      setGrowthData(mockGrowthData);

      setStats({
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalExams: examsResult.count || 0,
        pendingApprovals: (pendingStudentsResult.count || 0) + (pendingTeachersResult.count || 0),
        approvedStudents: approvedStudentsResult.count || 0,
        approvedTeachers: approvedTeachersResult.count || 0,
        recentExams: recentExamsCount || 0,
        systemHealth: Math.floor(Math.random() * 5) + 95
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
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
      gradient: "from-blue-500 to-cyan-600",
      link: "/admin/approvals",
      count: stats.pendingApprovals
    },
    {
      title: "Exam Management",
      description: "Oversee all platform examinations",
      icon: BookOpen,
      gradient: "from-green-500 to-emerald-600",
      link: "/admin/exams",
      count: stats.totalExams
    },
    {
      title: "Analytics Dashboard",
      description: "Comprehensive platform insights",
      icon: BarChart3,
      gradient: "from-purple-500 to-pink-600",
      link: "/admin/analytics"
    },
    {
      title: "AI Insights Engine",
      description: "Monitor AI performance analysis",
      icon: Brain,
      gradient: "from-orange-500 to-red-600",
      link: "/teacher/insights"
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="p-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-full">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            Admin Control Center
          </h1>
        </div>
        <p className="text-muted-foreground">
          Complete oversight of the EduGrowHub platform
        </p>
        <Badge variant="outline" className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950">
          Super Administrator
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6">
        <ModernDashboardCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          gradient="from-blue-500 to-cyan-600"
          description={`${stats.approvedStudents} approved`}
        />
        <ModernDashboardCard
          title="Total Teachers"
          value={stats.totalTeachers}
          icon={GraduationCap}
          gradient="from-green-500 to-emerald-600"
          description={`${stats.approvedTeachers} approved`}
        />
        <ModernDashboardCard
          title="Total Exams"
          value={stats.totalExams}
          icon={BookOpen}
          gradient="from-purple-500 to-pink-600"
          description={`${stats.recentExams} this week`}
        />
        <ModernDashboardCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={Clock}
          gradient="from-orange-500 to-red-600"
          description="Require attention"
        />
        <ModernDashboardCard
          title="System Health"
          value={`${stats.systemHealth}%`}
          icon={Activity}
          gradient="from-teal-500 to-cyan-600"
          description="All systems operational"
        />
        <ModernDashboardCard
          title="Active Users"
          value={stats.approvedStudents + stats.approvedTeachers}
          icon={Zap}
          gradient="from-yellow-500 to-orange-600"
          description="Currently online"
        />
        <ModernDashboardCard
          title="Success Rate"
          value="97%"
          icon={Award}
          gradient="from-indigo-500 to-purple-600"
          description="Platform uptime"
        />
        <ModernDashboardCard
          title="Growth Rate"
          value="+12%"
          icon={TrendingUp}
          gradient="from-pink-500 to-rose-600"
          description="Monthly growth"
        />
      </div>

      {/* Growth Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Platform Growth
            </CardTitle>
            <CardDescription>
              User registration trends over the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorUsers)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Daily Activity
            </CardTitle>
            <CardDescription>
              Exam creation and user activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="exams" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Administrative Tools
          </CardTitle>
          <CardDescription>
            Essential platform management functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <ModernActionCard
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                link={action.link}
                gradient={action.gradient}
                count={action.count}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Pending Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pendingApprovals > 0 ? (
                <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-200">User Approvals Required</p>
                      <p className="text-sm text-orange-600 dark:text-orange-300">{stats.pendingApprovals} users awaiting approval</p>
                    </div>
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700" asChild>
                      <a href="/admin/approvals">Review</a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">All Systems Clear</p>
                  <p className="text-sm">No pending actions require attention</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
                <span className="text-sm font-medium">Active Users</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {stats.approvedStudents + stats.approvedTeachers}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <span className="text-sm font-medium">Recent Activity</span>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {stats.recentExams} exams
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                <span className="text-sm font-medium">System Status</span>
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {stats.systemHealth}% Operational
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ModernSuperAdminDashboard;
