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
  BarChart3
} from 'lucide-react';

const StudentDashboard = () => {
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    highestScore: 0,
    recentExams: 0
  });
  const [recentResults, setRecentResults] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
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
      setStudentProfile(profile);

      // Get exam results
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
        .limit(5);

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

      // Calculate statistics
      const allResults = results || [];
      const scores = allResults.map(r => r.percentage || ((r.marks_obtained / (r.exams?.max_marks || 100)) * 100));
      
      setStats({
        totalExams: allResults.length,
        averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        highestScore: scores.length > 0 ? Math.round(Math.max(...scores)) : 0,
        recentExams: allResults.filter(r => {
          const examDate = new Date(r.submitted_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return examDate >= weekAgo;
        }).length
      });
    } catch (error) {
      console.error('Error fetching student data:', error);
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
      title: "View Performance",
      description: "Detailed performance analysis and trends",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/student/performance"
    },
    {
      title: "AI Insights",
      description: "Personalized learning recommendations",
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      link: "/student/performance"
    },
    {
      title: "All Results",
      description: "View complete exam history",
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
    return <div className="flex justify-center p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {studentProfile?.full_name} • Class {studentProfile?.class_level}
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          Student
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalExams}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-green-600">{stats.averageScore}%</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Highest Score</p>
                <p className="text-2xl font-bold text-purple-600">{stats.highestScore}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Exams</p>
                <p className="text-2xl font-bold text-orange-600">{stats.recentExams}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Track your academic progress and performance
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

      {/* Recent Results and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Results
              </CardTitle>
              <Link to="/student/performance">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentResults.length > 0 ? (
              <div className="space-y-3">
                {recentResults.map((result) => (
                  <div key={result.id} className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{result.exams?.title}</h4>
                        <p className="text-sm text-gray-600">{result.exams?.subjects?.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(result.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {result.percentage ? Math.round(result.percentage) : Math.round((result.marks_obtained / (result.exams?.max_marks || 100)) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {result.marks_obtained}/{result.exams?.max_marks}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No exam results yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights Preview */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Insights
              </CardTitle>
              <Link to="/student/performance">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <div className="space-y-3">
                {insights.slice(0, 2).map((insight) => (
                  <div key={insight.id} className="border rounded-lg p-3 bg-purple-50">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{insight.subjects?.name}</h4>
                      <Badge className={`text-xs ${
                        insight.strength_level >= 4 ? 'bg-green-100 text-green-800' :
                        insight.strength_level >= 3 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Level {insight.strength_level}/5
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">
                      {insight.ai_recommendations?.substring(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Brain className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">AI insights will appear after exams</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
