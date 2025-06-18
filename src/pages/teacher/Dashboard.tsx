import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  FileText,
  Brain,
  Award,
  TrendingUp,
  Plus,
  Eye,
  BarChart3
} from 'lucide-react';

const TeacherDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    myExams: 0,
    recentResults: 0,
    avgPerformance: 0
  });
  const [recentExams, setRecentExams] = useState([]);
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
        .limit(5);

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

      // Calculate average performance for teacher's exams
      const teacherResults = resultsResult.data?.filter(result => result.exams?.created_by === currentUser.user.id) || [];
      const avgPerformance = teacherResults.length > 0 
        ? Math.round(teacherResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / teacherResults.length)
        : 0;

      setStats({
        totalStudents: studentsResult.count || 0,
        myExams: myExamsResult.count || 0,
        recentResults: teacherResults.length,
        avgPerformance
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
      description: "Set up a new exam for your students",
      icon: Plus,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/admin/exams"
    },
    {
      title: "Student Insights",
      description: "View AI-powered student performance analysis",
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/teacher/insights"
    },
    {
      title: "View All Exams",
      description: "Manage your existing exams and results",
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/admin/exams"
    },
    {
      title: "Performance Analytics",
      description: "Analyze class performance and trends",
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/admin/analytics"
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
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {teacherProfile?.full_name} • {teacherProfile?.subject_expertise}
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          Teacher
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Exams</p>
                <p className="text-2xl font-bold text-green-600">{stats.myExams}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Exam Results</p>
                <p className="text-2xl font-bold text-purple-600">{stats.recentResults}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold text-orange-600">{stats.avgPerformance}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks for effective teaching management
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
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Exams */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recent Exams
            </CardTitle>
            <Link to="/admin/exams">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentExams.length > 0 ? (
            <div className="space-y-4">
              {recentExams.map((exam) => (
                <div key={exam.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{exam.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span>{exam.subjects?.name}</span>
                        <span>•</span>
                        <span>{exam.exam_type}</span>
                        <span>•</span>
                        <span>Class {exam.class_level}</span>
                        <span>•</span>
                        <span>{exam.max_marks} marks</span>
                      </div>
                      {exam.topics?.name && (
                        <p className="text-sm text-gray-500 mt-1">Topic: {exam.topics.name}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Created: {new Date(exam.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {exam.exam_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Exams Created Yet</h3>
              <p className="mb-4">Start by creating your first exam for students.</p>
              <Link to="/admin/exams">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Exam
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
