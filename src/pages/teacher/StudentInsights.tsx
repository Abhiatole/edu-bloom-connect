
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, Users, Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface ExamResult {
  marks_obtained: number;
  percentage: number;
  exams: {
    title: string;
    max_marks: number;
    class_level: number;
  };
}

interface StudentInsight {
  id: string;
  student_id: string;
  subject: string;
  performance_level: string;
  strength_level: number;
  weak_areas: string[];
  strong_areas: string[];
  focus_topics: string[];
  performance_trend: string;
  ai_recommendations: string;
  last_analyzed: string;
}

interface StudentInfo {
  student_id: string;
  full_name: string;
  class_level: number;
  averageScore: number;
  totalExams: number;
}

const StudentInsights = () => {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [insights, setInsights] = useState<StudentInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const subjects = [
    { value: 'all', label: 'All Subjects' },
    { value: 'Physics', label: 'Physics' },
    { value: 'Chemistry', label: 'Chemistry' },
    { value: 'Mathematics', label: 'Mathematics' },
    { value: 'Biology', label: 'Biology' },
    { value: 'English', label: 'English' },
    { value: 'Other', label: 'Other' }
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentData();
    }
  }, [selectedStudent, selectedSubject]);

  const fetchStudents = async () => {
    try {
      // Get all students with their exam results
      const { data: studentProfiles, error: profilesError } = await supabase
        .from('student_profiles')
        .select('user_id, full_name, class_level')
        .eq('status', 'APPROVED');

      if (profilesError) throw profilesError;

      // Get exam results for each student to calculate averages
      const studentsWithStats = await Promise.all(
        studentProfiles?.map(async (student) => {
          const { data: results } = await supabase
            .from('exam_results')
            .select(`
              marks_obtained,
              exams!inner(max_marks)
            `)
            .eq('student_id', student.user_id);

          const totalExams = results?.length || 0;
          const averageScore = results && results.length > 0
            ? Math.round(results.reduce((sum, result) => {
                const percentage = (result.marks_obtained / (result.exams?.max_marks || 100)) * 100;
                return sum + percentage;
              }, 0) / results.length)
            : 0;

          return {
            student_id: student.user_id,
            full_name: student.full_name,
            class_level: student.class_level,
            averageScore,
            totalExams
          };
        }) || []
      );

      setStudents(studentsWithStats);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // Fetch exam results for the selected student
      let resultsQuery = supabase
        .from('exam_results')
        .select(`
          marks_obtained,
          exams!inner(
            title,
            max_marks,
            class_level,
            subject
          )
        `)
        .eq('student_id', selectedStudent);

      if (selectedSubject !== 'all') {
        resultsQuery = resultsQuery.eq('exams.subject', selectedSubject as any);
      }

      const { data: results, error: resultsError } = await resultsQuery;

      if (resultsError) {
        console.error('Error fetching exam results:', resultsError);
        setExamResults([]);
      } else {
        // Calculate percentages
        const resultsWithPercentage = results?.map(result => ({
          ...result,
          percentage: Math.round((result.marks_obtained / (result.exams?.max_marks || 100)) * 100)
        })) || [];
        setExamResults(resultsWithPercentage);
      }

      // Fetch student insights
      let insightsQuery = supabase
        .from('student_insights')
        .select('*')
        .eq('student_id', selectedStudent);

      if (selectedSubject !== 'all') {
        insightsQuery = insightsQuery.eq('subject', selectedSubject as any);
      }

      const { data: insightsData, error: insightsError } = await insightsQuery;

      if (insightsError) {
        console.error('Error fetching insights:', insightsError);
        setInsights([]);
      } else {
        setInsights(insightsData || []);
      }

    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceBadge = (level: string) => {
    switch (level) {
      case 'Excellent':
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
      case 'Good':
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
      case 'Average':
        return <Badge className="bg-yellow-100 text-yellow-800">Average</Badge>;
      case 'Below Average':
        return <Badge className="bg-orange-100 text-orange-800">Below Average</Badge>;
      case 'Poor':
        return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  const selectedStudentInfo = students.find(s => s.student_id === selectedStudent);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Student Insights</h2>
          <p className="text-gray-600">AI-powered analysis of student performance</p>
        </div>
        <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
          <Brain className="h-4 w-4" />
          AI Analytics
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Student & Subject
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.student_id} value={student.student_id}>
                      {student.full_name} (Class {student.class_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.value} value={subject.value}>
                      {subject.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedStudentInfo && (
        <>
          {/* Student Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Student Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-blue-600">{selectedStudentInfo.averageScore}%</h3>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-green-600">{selectedStudentInfo.totalExams}</h3>
                  <p className="text-sm text-gray-600">Total Exams</p>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-purple-600">Class {selectedStudentInfo.class_level}</h3>
                  <p className="text-sm text-gray-600">Current Class</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Analysis */}
          {insights.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insights.map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{insight.subject}</span>
                      {getPerformanceBadge(insight.performance_level)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {getTrendIcon(insight.performance_trend)}
                      {insight.performance_trend || 'Stable'} trend
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Strength Level</span>
                        <span className="text-sm text-gray-600">{insight.strength_level}/5</span>
                      </div>
                      <Progress value={(insight.strength_level / 5) * 100} />
                    </div>

                    {insight.strong_areas && insight.strong_areas.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Strong Areas
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {insight.strong_areas.map((area, index) => (
                            <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {insight.weak_areas && insight.weak_areas.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          Areas for Improvement
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {insight.weak_areas.map((area, index) => (
                            <Badge key={index} variant="outline" className="text-orange-700 border-orange-300">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {insight.ai_recommendations && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <Brain className="h-4 w-4 text-purple-600" />
                          AI Recommendations
                        </h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {insight.ai_recommendations}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-400 border-t pt-2">
                      Last analyzed: {new Date(insight.last_analyzed).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Recent Exam Results */}
          {examResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Exam Performance</CardTitle>
                <CardDescription>
                  Latest exam results for {selectedStudentInfo.full_name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {examResults.slice(0, 5).map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <h4 className="font-medium">{result.exams?.title}</h4>
                        <p className="text-sm text-gray-600">
                          {result.marks_obtained}/{result.exams?.max_marks} marks
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{result.percentage}%</div>
                        <Progress value={result.percentage} className="w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {insights.length === 0 && examResults.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                <p className="text-gray-600">
                  No performance data or insights available for this student and subject combination.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {loading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
};

export default StudentInsights;
