import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Target,
  Award,
  TrendingUp,
  Brain,
  Calendar,
  Eye,
  BarChart3,
  GraduationCap,
  Users,
  Star,
  Zap
} from 'lucide-react';
import { FinalRegistrationService } from '@/services/finalRegistrationService';

const EnhancedStudentDashboard = () => {
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    highestScore: 0,
    recentExams: 0,
    improvement: 0,
    rank: 0
  });
  const [recentResults, setRecentResults] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [enrollments, setEnrollments] = useState({ subjects: [], batches: [] });
  const { toast } = useToast();

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      // Get student profile
      const { data: profile, error: profileError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', currentUser.user.id)
        .single();

      if (profileError) throw profileError;
      setStudentProfile(profile);      // Get exam results with performance data
      const { data: results, error: resultsError } = await supabase
        .from('exam_results')
        .select(`
          *,
          exams(
            title,
            max_marks,
            exam_type,
            subjects(name)
          )
        `)
        .eq('student_id', profile.id)
        .order('submitted_at', { ascending: false })
        .limit(10);

      if (resultsError) throw resultsError;
      setRecentResults(results || []);

      // Get AI insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('student_insights')
        .select(`
          *,
          subjects(name)
        `)
        .eq('student_id', profile.id);

      if (insightsError) throw insightsError;
      setInsights(insightsData || []);

      // Calculate enhanced statistics
      const allResults = results || [];
      const scores = allResults.map(r => r.percentage || ((r.marks_obtained / (r.exams?.max_marks || 100)) * 100));
      
      // Calculate improvement trend
      const recentScores = scores.slice(0, 3);
      const olderScores = scores.slice(3, 6);
      const improvement = recentScores.length > 0 && olderScores.length > 0 
        ? Math.round(((recentScores.reduce((a, b) => a + b, 0) / recentScores.length) - 
                     (olderScores.reduce((a, b) => a + b, 0) / olderScores.length)))
        : 0;

      setStats({
        totalExams: allResults.length,
        averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        highestScore: scores.length > 0 ? Math.round(Math.max(...scores)) : 0,
        recentExams: allResults.filter(r => {
          const examDate = new Date(r.submitted_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return examDate >= weekAgo;
        }).length,
        improvement,
        rank: Math.max(1, Math.ceil(Math.random() * 50)) // Mock rank for demo
      });

    } catch (error) {
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
      title: "Performance Analytics",
      description: "Detailed performance analysis and trends",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/student/performance"
    },
    {
      title: "AI Study Insights",
      description: "Personalized learning recommendations",
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/student/performance"
    },
    {
      title: "Exam History",
      description: "View complete exam results and patterns",
      icon: Eye,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/student/performance"
    },
    {
      title: "Progress Tracking",
      description: "Monitor your academic journey",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      link: "/student/performance"
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
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <Star className="h-6 w-6 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome back, {studentProfile?.full_name}!
          </h1>
        </div>
        <p className="text-muted-foreground">
          Class {studentProfile?.class_level} • Your learning journey continues
        </p>
        <div className="flex flex-col items-center space-y-2">
          <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            Student Dashboard
          </Badge>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold">Enrollment ID:</span> {studentProfile?.enrollment_no}
          </div>
        </div>

        {/* Enrolled Subjects and Batches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
          {/* Enrolled Subjects */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Enrolled Subjects ({enrollments.subjects.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {enrollments.subjects.map((subject: any) => (
                    <Badge key={subject.id} variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {subject.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No subjects enrolled yet</p>
              )}
            </CardContent>
          </Card>

          {/* Enrolled Batches */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Enrolled Batches ({enrollments.batches.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrollments.batches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {enrollments.batches.map((batch: any) => (
                    <Badge key={batch.id} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {batch.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No batches enrolled yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Exams</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalExams}</p>
                <p className="text-xs text-blue-500 dark:text-blue-400">Completed assessments</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Average Score</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.averageScore}%</p>
                {stats.improvement !== 0 && (
                  <p className={`text-xs flex items-center gap-1 ${
                    stats.improvement > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <TrendingUp className="h-3 w-3" />
                    {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                  </p>
                )}
              </div>
              <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Highest Score</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.highestScore}%</p>
                <p className="text-xs text-purple-500 dark:text-purple-400">Personal best</p>
              </div>
              <Award className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Recent Exams</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.recentExams}</p>
                <p className="text-xs text-orange-500 dark:text-orange-400">This week</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-600 dark:text-teal-400">Class Rank</p>
                <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">#{stats.rank}</p>
                <p className="text-xs text-teal-500 dark:text-teal-400">Estimated position</p>
              </div>
              <Users className="h-8 w-8 text-teal-600 dark:text-teal-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Study Streak</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">7 days</p>
                <p className="text-xs text-yellow-500 dark:text-yellow-400">Keep it up!</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Access your most-used features and tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link} className="block">
                <Card className={`hover:shadow-md transition-shadow cursor-pointer ${action.bgColor} border-0`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{action.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Results and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Recent Results
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/student/performance">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentResults.length > 0 ? (
              <div className="space-y-4">
                {recentResults.slice(0, 3).map((result: any) => (
                  <div key={result.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{result.exams?.title}</h4>
                        <p className="text-sm text-muted-foreground">{result.exams?.subjects?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(result.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {result.percentage ? Math.round(result.percentage) : Math.round((result.marks_obtained / (result.exams?.max_marks || 100)) * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.marks_obtained}/{result.exams?.max_marks}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No exam results yet</p>
                <p className="text-sm">Your results will appear here after taking exams</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights Preview */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Study Insights
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/student/performance">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.slice(0, 2).map((insight: any) => (
                  <div key={insight.id} className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{insight.subjects?.name}</h4>
                      <Badge className={`text-xs ${
                        insight.strength_level >= 4 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        insight.strength_level >= 3 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        Level {insight.strength_level}/5
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {insight.ai_recommendations?.substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>AI insights will appear after exams</p>
                <p className="text-sm">Personalized study recommendations coming soon</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedStudentDashboard;
