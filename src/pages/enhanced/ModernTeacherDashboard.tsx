
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
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
  GraduationCap
} from 'lucide-react';

interface TeacherStats {
  totalStudents: number;
  myExams: number;
  recentResults: number;
  avgPerformance: number;
}

interface ExamData {
  id: string;
  title: string;
  exam_type: string;
  class_level: number;
  max_marks: number;
  created_at: string;
  subjects?: {
    name: string;
  } | null;
}

interface TeacherProfile {
  full_name: string;
  subject_expertise: string;
  experience_years: number;
}

const ModernTeacherDashboard = () => {
  const [stats, setStats] = useState<TeacherStats>({
    totalStudents: 0,
    myExams: 0,
    recentResults: 0,
    avgPerformance: 0
  });
  const [recentExams, setRecentExams] = useState<ExamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
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

      // Get teacher's exams with subject information
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .select(`
          id,
          title,
          exam_type,
          class_level,
          max_marks,
          created_at,
          subjects!exams_subject_id_fkey(name)
        `)
        .eq('created_by_teacher_id', currentUser.user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (examsError) {
        console.error('Error fetching exams:', examsError);
        setRecentExams([]);
      } else {
        // Transform the data to match expected structure
        const transformedExams = exams?.map(exam => ({
          ...exam,
          subjects: exam.subjects || null
        })) || [];
        setRecentExams(transformedExams);
      }

      // Get statistics
      const [studentsResult, myExamsResult] = await Promise.all([
        supabase.from('student_profiles').select('*', { count: 'exact' }).eq('status', 'APPROVED'),
        supabase.from('exams').select('*', { count: 'exact' }).eq('created_by_teacher_id', currentUser.user.id)
      ]);

      // Get exam results for teacher's exams with proper calculation
      const { data: resultsData } = await supabase
        .from('exam_results')
        .select(`
          marks_obtained,
          exam_id,
          exams!inner(
            created_by_teacher_id,
            max_marks
          )
        `)
        .eq('exams.created_by_teacher_id', currentUser.user.id);

      const teacherResults = resultsData || [];
      const avgPerformance = teacherResults.length > 0 
        ? Math.round(teacherResults.reduce((sum, result) => {
            const percentage = result.exams?.max_marks 
              ? (result.marks_obtained / result.exams.max_marks) * 100 
              : 0;
            return sum + percentage;
          }, 0) / teacherResults.length)
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
      gradient: "from-blue-500 to-cyan-600",
      link: "/admin/exams"
    },
    {
      title: "Student Insights",
      description: "View AI-powered student performance analysis",
      icon: Brain,
      gradient: "from-purple-500 to-pink-600",
      link: "/teacher/insights"
    },
    {
      title: "View All Exams",
      description: "Manage your existing exams and results",
      icon: BookOpen,
      gradient: "from-green-500 to-emerald-600",
      link: "/admin/exams"
    },
    {
      title: "Performance Analytics",
      description: "Analyze class performance and trends",
      icon: BarChart3,
      gradient: "from-orange-500 to-red-600",
      link: "/admin/analytics"
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
      {/* Modern Header */}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalStudents}</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Exams</p>
                <p className="text-2xl font-bold text-green-600">{stats.myExams}</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Exam Results</p>
                <p className="text-2xl font-bold text-purple-600">{stats.recentResults}</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Performance</p>
                <p className="text-2xl font-bold text-orange-600">{stats.avgPerformance}%</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-full">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Essential teaching tools and management features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link}>
                <ModernActionCard
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  gradient={action.gradient}
                />
              </Link>
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
            <Link to="/admin/exams">
              <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50">
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
                <Card key={exam.id} className="bg-gradient-to-r from-muted/30 to-muted/10 border-muted">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">{exam.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{exam.subjects?.name || 'Unknown Subject'}</span>
                          <span>•</span>
                          <span>{exam.exam_type}</span>
                          <span>•</span>
                          <span>Class {exam.class_level}</span>
                          <span>•</span>
                          <span>{exam.max_marks} marks</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(exam.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-background">
                        {exam.exam_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Exams Created Yet</h3>
              <p className="mb-6">Start by creating your first exam for students.</p>
              <Link to="/admin/exams">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
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

export default ModernTeacherDashboard;
