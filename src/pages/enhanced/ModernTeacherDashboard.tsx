
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
  BookOpen,
  FileText,
  Brain,
  Award,
  TrendingUp,
  Plus,
  Eye,
  BarChart3,
  Clock,
  Target,
  Zap,
  GraduationCap
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

const ModernTeacherDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    myExams: 0,
    recentResults: 0,
    avgPerformance: 0,
    pendingGrading: 0,
    activeClasses: 0
  });
  const [recentExams, setRecentExams] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      // Get teacher profile
      const { data: profile, error: profileError } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', currentUser.user.id)
        .single();

      if (profileError) throw profileError;
      setTeacherProfile(profile);

      // Get teacher's exams
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select(`
          *,
          subjects(name),
          topics(name)
        `)
        .eq('created_by', currentUser.user.id)
        .order('created_at', { ascending: false })
        .limit(8);

      if (examsError) throw examsError;
      setRecentExams(exams || []);

      // Get statistics
      const [studentsResult, myExamsResult, resultsResult] = await Promise.all([
        supabase.from('student_profiles').select('*', { count: 'exact' }).eq('status', 'APPROVED'),
        supabase.from('exams').select('*', { count: 'exact' }).eq('created_by', currentUser.user.id),
        supabase.from('exam_results').select(`
          percentage,
          exams(created_by)
        `).eq('exams.created_by', currentUser.user.id)
      ]);

      // Calculate performance data for charts
      const teacherResults = resultsResult.data?.filter(result => result.exams?.created_by === currentUser.user.id) || [];
      const avgPerformance = teacherResults.length > 0 
        ? Math.round(teacherResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / teacherResults.length)
        : 0;

      // Generate subject-wise performance data
      const subjectPerformance = exams?.reduce((acc, exam) => {
        const subject = exam.subjects?.name || 'Unknown';
        if (!acc[subject]) {
          acc[subject] = { subject, count: 0, avgScore: 0 };
        }
        acc[subject].count += 1;
        return acc;
      }, {});

      setPerformanceData(Object.values(subjectPerformance || {}));

      setStats({
        totalStudents: studentsResult.count || 0,
        myExams: myExamsResult.count || 0,
        recentResults: teacherResults.length,
        avgPerformance,
        pendingGrading: Math.floor(Math.random() * 15), // Mock data
        activeClasses: Math.floor(Math.random() * 5) + 3 // Mock data
      });
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Create New Exam",
      description: "Set up assessments for your students",
      icon: Plus,
      gradient: "from-blue-500 to-cyan-600",
      link: "/admin/exams"
    },
    {
      title: "Student Insights",
      description: "AI-powered performance analysis",
      icon: Brain,
      gradient: "from-purple-500 to-pink-600",
      link: "/teacher/insights"
    },
    {
      title: "Grade Management",
      description: "Upload and manage student marks",
      icon: FileText,
      gradient: "from-green-500 to-emerald-600",
      link: "/admin/exams"
    },
    {
      title: "Performance Analytics",
      description: "Analyze class trends and patterns",
      icon: BarChart3,
      gradient: "from-orange-500 to-red-600",
      link: "/admin/analytics"
    }
  ];

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
          <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-full">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Welcome, {teacherProfile?.full_name}!
          </h1>
        </div>
        <p className="text-muted-foreground">
          {teacherProfile?.subject_expertise} • {teacherProfile?.experience_years} years experience
        </p>
        <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
          Teacher Dashboard
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <ModernDashboardCard
          title="Active Students"
          value={stats.totalStudents}
          icon={Users}
          gradient="from-blue-500 to-cyan-600"
          description="Enrolled learners"
        />
        <ModernDashboardCard
          title="My Exams"
          value={stats.myExams}
          icon={BookOpen}
          gradient="from-green-500 to-emerald-600"
          description="Created assessments"
        />
        <ModernDashboardCard
          title="Avg Performance"
          value={`${stats.avgPerformance}%`}
          icon={Target}
          gradient="from-purple-500 to-pink-600"
          description="Class average"
        />
        <ModernDashboardCard
          title="Pending Grading"
          value={stats.pendingGrading}
          icon={Clock}
          gradient="from-orange-500 to-red-600"
          description="Needs attention"
        />
        <ModernDashboardCard
          title="Active Classes"
          value={stats.activeClasses}
          icon={Award}
          gradient="from-teal-500 to-cyan-600"
          description="Current semester"
        />
        <ModernDashboardCard
          title="Success Rate"
          value="94%"
          icon={Zap}
          gradient="from-yellow-500 to-orange-600"
          description="Student pass rate"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Distribution */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Subject Distribution
            </CardTitle>
            <CardDescription>
              Exams created by subject area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performance Overview
            </CardTitle>
            <CardDescription>
              Student performance distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Excellent (90-100%)', value: 25, color: '#10b981' },
                    { name: 'Good (80-89%)', value: 35, color: '#3b82f6' },
                    { name: 'Average (70-79%)', value: 25, color: '#f59e0b' },
                    { name: 'Below Average (<70%)', value: 15, color: '#ef4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={(entry) => `${entry.value}%`}
                >
                  {[
                    { name: 'Excellent (90-100%)', value: 25, color: '#10b981' },
                    { name: 'Good (80-89%)', value: 35, color: '#3b82f6' },
                    { name: 'Average (70-79%)', value: 25, color: '#f59e0b' },
                    { name: 'Below Average (<70%)', value: 15, color: '#ef4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Teaching Tools
          </CardTitle>
          <CardDescription>
            Essential tools for effective teaching
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
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Exams */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Recent Exams
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/exams">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentExams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentExams.slice(0, 4).map((exam) => (
                <div key={exam.id} className="p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-muted">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{exam.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{exam.subjects?.name}</span>
                        <span>•</span>
                        <span>Class {exam.class_level}</span>
                      </div>
                      {exam.topics?.name && (
                        <p className="text-sm text-muted-foreground">Topic: {exam.topics.name}</p>
                      )}
                    </div>
                    <Badge variant="outline">{exam.exam_type}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Max Marks: {exam.max_marks}</span>
                    <span className="text-muted-foreground">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Exams Created Yet</h3>
              <p className="mb-6">Start creating assessments for your students to begin teaching.</p>
              <Button asChild>
                <a href="/admin/exams">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Exam
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernTeacherDashboard;
