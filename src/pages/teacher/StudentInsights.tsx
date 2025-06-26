import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Target, TrendingUp, AlertTriangle, BookOpen, RefreshCw } from 'lucide-react';
interface Student {
  id: string;
  full_name: string;
  class_level: number;
}
interface ExamResult {
  marks_obtained: number;
  percentage: number;
  exams: {
    title: string;
    max_marks: number;
    subject_id: string;
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
  last_analyzed: string;
  subjects: {
    name: string;
  };
}
const StudentInsights = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [insights, setInsights] = useState<StudentInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    fetchStudents();
  }, []);
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentData();
    }
  }, [selectedStudent]);
  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('id, full_name, class_level')
        .eq('status', 'APPROVED')
        .order('full_name');
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
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
      const [resultsResult, insightsResult] = await Promise.all([
        supabase
          .from('exam_results')
          .select(`
            marks_obtained,
            percentage,
            exams(
              title,
              max_marks,
              subject_id,
              subjects(name)
            )
          `)
          .eq('student_id', selectedStudent),
        supabase
          .from('student_insights')
          .select(`
            *,
            subjects(name)
          `)
          .eq('student_id', selectedStudent)
      ]);
      if (resultsResult.error) throw resultsResult.error;
      if (insightsResult.error) throw insightsResult.error;
      setExamResults(resultsResult.data || []);
      setInsights(insightsResult.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive"
      });
    }
  };
  const generateAIInsights = async () => {
    if (!selectedStudent) return;
    setGeneratingInsights(true);
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');
      // Group exam results by subject
      const subjectPerformance: { [key: string]: { scores: number[]; subjectId: string } } = {};
      
      examResults.forEach(result => {
        if (result.exams?.subjects?.name) {
          const subject = result.exams.subjects.name;
          if (!subjectPerformance[subject]) {
            subjectPerformance[subject] = { scores: [], subjectId: result.exams.subject_id };
          }
          subjectPerformance[subject].scores.push(result.percentage || 0);
        }
      });
      // Generate insights for each subject
      const insightsToInsert = [];
      
      for (const [subject, data] of Object.entries(subjectPerformance)) {
        const averageScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
        const trend = data.scores.length > 1 ? 
          (data.scores[data.scores.length - 1] > data.scores[0] ? 'improving' : 'declining') : 
          'stable';
        // Simple AI logic for generating insights
        let strengthLevel = Math.round(averageScore / 20); // Convert to 1-5 scale
        strengthLevel = Math.max(1, Math.min(5, strengthLevel));
        const weakAreas = [];
        const strongAreas = [];
        const focusTopics = [];
        let recommendations = '';
        if (averageScore < 40) {
          weakAreas.push('Basic concepts', 'Problem solving');
          focusTopics.push('Fundamental concepts', 'Practice problems');
          recommendations = `${subject}: Focus on strengthening fundamental concepts. Regular practice is recommended.`;
        } else if (averageScore < 70) {
          weakAreas.push('Advanced topics');
          strongAreas.push('Basic concepts');
          focusTopics.push('Advanced problems', 'Application-based questions');
          recommendations = `${subject}: Good foundation. Work on advanced topics and application-based problems.`;
        } else {
          strongAreas.push('Concepts', 'Problem solving');
          focusTopics.push('Complex problems', 'Time management');
          recommendations = `${subject}: Excellent performance. Focus on complex problems and exam strategies.`;
        }
        // Check if insight already exists for this student and subject
        const existingInsight = insights.find(insight => 
          insight.subjects?.name === subject
        );
        if (existingInsight) {
          // Update existing insight
          await supabase
            .from('student_insights')
            .update({
              strength_level: strengthLevel,
              weak_areas: weakAreas,
              strong_areas: strongAreas,
              focus_topics: focusTopics,
              performance_trend: trend,
              ai_recommendations: recommendations,
              last_analyzed: new Date().toISOString()
            })
            .eq('id', existingInsight.id);
        } else {
          // Create new insight
          insightsToInsert.push({
            student_id: selectedStudent,
            subject_id: data.subjectId,
            strength_level: strengthLevel,
            weak_areas: weakAreas,
            strong_areas: strongAreas,
            focus_topics: focusTopics,
            performance_trend: trend,
            ai_recommendations: recommendations
          });
        }
      }
      if (insightsToInsert.length > 0) {
        const { error } = await supabase
          .from('student_insights')
          .insert(insightsToInsert);
        if (error) throw error;
      }
      toast({
        title: "Success",
        description: "AI insights generated successfully"
      });
      fetchStudentData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate insights",
        variant: "destructive"
      });
    } finally {
      setGeneratingInsights(false);
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
  if (loading) {
    return <div className="flex justify-center p-8">Loading student insights...</div>;
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Insights</h2>
          <p className="text-gray-600">AI-powered performance analysis and recommendations</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {students.map(student => (
                <SelectItem key={student.id} value={student.id}>
                  {student.full_name} (Class {student.class_level})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedStudent && (
            <Button 
              onClick={generateAIInsights} 
              disabled={generatingInsights}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${generatingInsights ? 'animate-spin' : ''}`} />
              Generate AI Insights
            </Button>
          )}
        </div>
      </div>
      {selectedStudent ? (
        <div className="space-y-6">
          {/* Performance Overview */}
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
                  <BarChart className="h-5 w-5" />
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
          </div>
          {/* AI Insights */}
          {insights.length > 0 ? (
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
                        <BookOpen className="h-4 w-4" />
                        Strong Areas
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
                        Areas for Improvement
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
                        Focus Topics
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
                    <div className="text-xs text-gray-500">
                      Last analyzed: {insight.last_analyzed ? new Date(insight.last_analyzed).toLocaleDateString() : 'Not available'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No AI Insights Available</h3>
                <p className="text-gray-500 mb-4">
                  Generate AI insights to get detailed performance analysis and recommendations.
                </p>
                <Button 
                  onClick={generateAIInsights} 
                  disabled={generatingInsights}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Generate AI Insights
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a Student</h3>
            <p className="text-gray-500">
              Choose a student from the dropdown to view their performance insights and AI analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default StudentInsights;
