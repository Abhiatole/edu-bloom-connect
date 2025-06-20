
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ModernDashboardCard } from '@/components/enhanced/ModernDashboardCard';
import {
  BookOpen,
  Trophy,
  TrendingUp,
  Target,
  Clock,
  Award,
  Star,
  GraduationCap
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

interface ExamResult {
  id: string;
  marks_obtained: number;
  percentage: number;
  grade: string;
  exams: {
    title: string;
    max_marks: number;
    subjects?: {
      name: string;
    };
  };
  submitted_at: string;
}

interface StudentStats {
  totalExams: number;
  averageScore: number;
  highestScore: number;
  currentRank: number;
}

const ModernStudentDashboard = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    totalExams: 0,
    averageScore: 0,
    highestScore: 0,
    currentRank: 1
  });
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<any>(null);
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

      // Get exam results with calculated percentages
      const { data: examResults, error: resultsError } = await supabase
        .from('exam_results')
        .select(`
          id,
          marks_obtained,
          grade,
          submitted_at,
          exams!inner(
            title,
            max_marks,
            subjects(name)
          )
        `)
        .eq('student_id', currentUser.user.id)
        .order('submitted_at', { ascending: false });

      if (resultsError) throw resultsError;

      // Calculate percentages and transform results
      const transformedResults: ExamResult[] = examResults?.map(result => ({
        ...result,
        percentage: result.exams?.max_marks ? Math.round((result.marks_obtained / result.exams.max_marks) * 100) : 0
      })) || [];

      setResults(transformedResults);

      // Calculate statistics
      const totalExams = transformedResults.length;
      const averageScore = totalExams > 0 
        ? Math.round(transformedResults.reduce((sum, result) => sum + result.percentage, 0) / totalExams)
        : 0;
      const highestScore = totalExams > 0 
        ? Math.max(...transformedResults.map(result => result.percentage))
        : 0;

      setStats({
        totalExams,
        averageScore,
        highestScore,
        currentRank: Math.floor(Math.random() * 10) + 1 // Mock ranking
      });

      // Prepare performance trend data
      const performanceTrend = transformedResults
        .slice(0, 6)
        .reverse()
        .map((result, index) => ({
          exam: result.exams?.title?.substring(0, 10) + '...' || `Exam ${index + 1}`,
          score: result.percentage,
          maxMarks: result.exams?.max_marks || 100
        }));

      setPerformanceData(performanceTrend);

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

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-600';
      case 'A': return 'bg-green-500';
      case 'B+': return 'bg-blue-500';
      case 'B': return 'bg-blue-400';
      case 'C+': return 'bg-yellow-500';
      case 'C': return 'bg-yellow-400';
      case 'D': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

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
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome, {studentProfile?.full_name}!
          </h1>
        </div>
        <p className="text-muted-foreground">
          Class {studentProfile?.class_level} • Academic Dashboard
        </p>
        <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
          Student Dashboard
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          description="Overall performance"
        />
        <ModernDashboardCard
          title="Highest Score"
          value={`${stats.highestScore}%`}
          icon={Trophy}
          gradient="from-yellow-500 to-orange-600"
          description="Best achievement"
        />
        <ModernDashboardCard
          title="Class Rank"
          value={`#${stats.currentRank}`}
          icon={Award}
          gradient="from-purple-500 to-pink-600"
          description="Current position"
        />
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Performance Trend
            </CardTitle>
            <CardDescription>
              Your recent exam performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="exam" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No performance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              Subject Performance
            </CardTitle>
            <CardDescription>
              Performance across different subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="exam" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            Recent Exam Results
          </CardTitle>
          <CardDescription>
            Your latest examination performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.slice(0, 5).map((result) => (
                <div key={result.id} className="p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 border border-muted">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{result.exams?.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{result.exams?.subjects?.name}</span>
                        <span>•</span>
                        <span>{result.marks_obtained}/{result.exams?.max_marks} marks</span>
                        <span>•</span>
                        <span>{new Date(result.submitted_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Score:</span>
                          <Progress value={result.percentage} className="w-20" />
                          <span className="text-sm font-bold">{result.percentage}%</span>
                        </div>
                        <Badge className={`${getGradeBadgeColor(result.grade)} text-white`}>
                          Grade {result.grade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Exam Results Yet</h3>
              <p className="mb-6">Your exam results will appear here once you take your first exam.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernStudentDashboard;
