import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ModernDashboardCard } from '@/components/enhanced/ModernDashboardCard';
import { ModernActionCard } from '@/components/enhanced/ModernActionCard';
import {
  BookOpen,
  Target,
  Award,
  TrendingUp,
  Brain,
  Calendar,
  Eye,
  BarChart3,
  Star,
  Clock,
  Zap
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
const ModernStudentDashboard = () => {
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
  const [performanceData, setPerformanceData] = useState([]);
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
      // Get exam results with performance data
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
      // Generate performance chart data
      const chartData = (results || []).slice(0, 6).reverse().map((result, index) => ({
        exam: `Exam ${index + 1}`,
        score: result.percentage || ((result.marks_obtained / (result.exams?.max_marks || 100)) * 100),
        subject: result.exams?.subjects?.name
      }));
      setPerformanceData(chartData);
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
      gradient: "from-blue-500 to-cyan-600",
      link: "/student/performance"
    },
    {
      title: "AI Study Insights",
      description: "Personalized learning recommendations",
      icon: Brain,
      gradient: "from-purple-500 to-pink-600",
      link: "/student/performance"
    },
    {
      title: "Exam History",
      description: "View complete exam results and patterns",
      icon: Eye,
      gradient: "from-green-500 to-emerald-600",
      link: "/student/performance"
    },
    {
      title: "Progress Tracker",
      description: "Monitor your academic journey",
      icon: TrendingUp,
      gradient: "from-orange-500 to-red-600",
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
      {/* Welcome Header */}      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <Star className="h-6 w-6 text-white" />
          </div>
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
      </div>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <ModernDashboardCard
          title="Total Exams"
          value={stats.totalExams}
          icon={BookOpen}
          gradient="from-blue-500 to-cyan-600"
          description="Completed assessments"
        />
        <ModernDashboardCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon={Target}
          gradient="from-green-500 to-emerald-600"
          trend={{ value: Math.abs(stats.improvement), isPositive: stats.improvement >= 0 }}
        />
        <ModernDashboardCard
          title="Highest Score"
          value={`${stats.highestScore}%`}
          icon={Award}
          gradient="from-purple-500 to-pink-600"
          description="Personal best"
        />
        <ModernDashboardCard
          title="Recent Exams"
          value={stats.recentExams}
          icon={Calendar}
          gradient="from-orange-500 to-red-600"
          description="This week"
        />
        <ModernDashboardCard
          title="Class Rank"
          value={`#${stats.rank}`}
          icon={TrendingUp}
          gradient="from-teal-500 to-cyan-600"
          description="Estimated position"
        />
        <ModernDashboardCard
          title="Study Streak"
          value="7 days"
          icon={Zap}
          gradient="from-yellow-500 to-orange-600"
          description="Keep it up!"
        />
      </div>
      {/* Performance Chart */}
      {performanceData.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Performance Trend
            </CardTitle>
            <CardDescription>
              Your recent exam performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="exam" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [`${Math.round(value as number)}%`, 'Score']}
                  labelFormatter={(label) => `Exam: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorScore)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Access your learning tools and insights
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
      {/* Recent Results and AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Recent Results
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <a href="/student/performance">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentResults.length > 0 ? (
              <div className="space-y-4">
                {recentResults.slice(0, 3).map((result) => (
                  <div key={result.id} className="p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-muted">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h4 className="font-medium">{result.exams?.title}</h4>
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
                <a href="/student/performance">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.slice(0, 2).map((insight) => (
                  <div key={insight.id} className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border border-purple-200 dark:border-purple-800">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">{insight.subjects?.name}</h4>
                      <Badge className={`text-xs ${
                        insight.strength_level >= 4 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        insight.strength_level >= 3 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        Level {insight.strength_level}/5
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {insight.ai_recommendations?.substring(0, 120)}...
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">AI Insights Coming Soon</p>
                <p className="text-sm">Complete more exams to unlock personalized insights</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default ModernStudentDashboard;
