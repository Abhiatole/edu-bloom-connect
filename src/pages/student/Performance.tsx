
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Target, TrendingUp, AlertTriangle, BookOpen, Award, Calendar } from 'lucide-react';

interface ExamResult {
  id: string;
  marks_obtained: number;
  percentage: number;
  submitted_at: string;
  exams: {
    title: string;
    max_marks: number;
    exam_type: string;
    subjects: {
      name: string;
    };
  };
}

interface StudentInsight {
  id: string;
  strength_level: number;
  weak_areas: string[];
  strong_areas: string[];
  focus_topics: string[];
  performance_trend: string;
  ai_recommendations: string;
  subjects: {
    name: string;
  };
}

const Performance = () => {
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [insights, setInsights] = useState<StudentInsight[]>([]);
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
        .order('submitted_at', { ascending: false });

      if (resultsError) throw resultsError;

      // Get AI insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('student_insights')
        .select(`
          *,
          subjects(name)
        `)
        .eq('student_id', profile.id);

      if (insightsError) throw insightsError;

      setExamResults(results || []);
      setInsights(insightsData || []);
    } catch (error: any) {
      console.error('Error fetching student data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load performance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSubjectPerformanceData = () => {
    const subjectData: { [key: string]: number[] } = {};
    
    examResults.forEach(result => {
      if (result.exams?.subjects?.name) {
        const subject = result.exams.subjects.name;
        if (!subjectData[subject]) {
          subjectData[subject] = [];
        }
        subjectData[subject].push(result.percentage || 0);
      }
    });

    return Object.entries(subjectData).map(([subject, scores]) => ({
      subject,
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      fullMark: 100
    }));
  };

  const getPerformanceTrend = () => {
    return examResults
      .slice(0, 10)
      .reverse()
      .map((result, index) => ({
        exam: `Exam ${index + 1}`,
        score: result.percentage || 0,
        subject: result.exams?.subjects?.name || 'Unknown'
      }));
  };

  const getOverallStats = () => {
    if (examResults.length === 0) return { average: 0, highest: 0, lowest: 0, totalExams: 0 };

    const scores = examResults.map(r => r.percentage || 0);
    return {
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      totalExams: examResults.length
    };
  };

  const getStrengthLevelColor = (level: number) => {
    if (level >= 4) return 'bg-green-100 text-green-800';
    if (level >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  const stats = getOverallStats();

  if (loading) {
    return <div className="flex justify-center p-8">Loading performance data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Performance</h2>
          <p className="text-gray-600">Track your academic progress and insights</p>
        </div>
        {studentProfile && (
          <div className="text-right">
            <div className="text-sm text-gray-500">Class {studentProfile.class_level}</div>
            <div className="font-semibold">{studentProfile.full_name}</div>
          </div>
        )}
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-blue-600">{stats.average}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Highest Score</p>
                <p className="text-2xl font-bold text-green-600">{stats.highest}%</p>
              </div>
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lowest Score</p>
                <p className="text-2xl font-bold text-red-600">{stats.lowest}%</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalExams}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {examResults.length > 0 ? (
        <>
          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Subject Performance Radar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={getSubjectPerformanceData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Average Score"
                      dataKey="average"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getPerformanceTrend()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="exam" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Subject-wise Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Subject-wise Average Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getSubjectPerformanceData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                  <Bar dataKey="average" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Exam Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Exam Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {examResults.slice(0, 5).map((result) => (
                  <div key={result.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{result.exams?.title}</h3>
                        <div className="text-sm text-gray-600">
                          {result.exams?.subjects?.name} • {result.exams?.exam_type}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(result.submitted_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {result.percentage ? Math.round(result.percentage) : Math.round((result.marks_obtained / (result.exams?.max_marks || 100)) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {result.marks_obtained}/{result.exams?.max_marks} marks
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Exam Results Yet</h3>
            <p className="text-gray-500">
              Your exam results will appear here once you start taking exams.
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            AI-Powered Insights
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      {insight.subjects?.name} Analysis
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStrengthLevelColor(insight.strength_level)}>
                        Level {insight.strength_level}/5
                      </Badge>
                      {getTrendIcon(insight.performance_trend)}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4" />
                      Your Strengths
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {insight.strong_areas?.map((area, index) => (
                        <Badge key={index} variant="outline" className="text-green-700 border-green-700">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-700 flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Areas to Improve
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {insight.weak_areas?.map((area, index) => (
                        <Badge key={index} variant="outline" className="text-red-700 border-red-700">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-700 flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4" />
                      Focus Areas
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {insight.focus_topics?.map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-blue-700 border-blue-700">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-purple-700 mb-2">AI Recommendations</h4>
                    <p className="text-sm text-gray-700 bg-purple-50 p-3 rounded-lg">
                      {insight.ai_recommendations}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
