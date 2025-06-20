
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, BookOpen, Award, Target, BarChart3 } from 'lucide-react';

interface ExamData {
  id: string;
  title: string;
  max_marks: number;
  class_level: number;
  exam_type: string;
  created_at: string;
}

interface AnalyticsData {
  examPerformance: any[];
  gradeDistribution: any[];
  classPerformance: any[];
  subjectAnalysis: any[];
}

const Analytics = () => {
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [exams, setExams] = useState<ExamData[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    examPerformance: [],
    gradeDistribution: [],
    classPerformance: [],
    subjectAnalysis: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam || selectedClass !== 'all') {
      fetchAnalytics();
    }
  }, [selectedExam, selectedClass]);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('id, title, max_marks, class_level, exam_type, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching exams:', error);
        setExams([]);
      } else {
        setExams(data || []);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('exam_results')
        .select(`
          marks_obtained,
          percentage,
          grade,
          exams!inner(
            title,
            max_marks,
            class_level,
            exam_type
          )
        `);

      if (selectedExam) {
        query = query.eq('exam_id', selectedExam);
      }

      if (selectedClass !== 'all') {
        query = query.eq('exams.class_level', parseInt(selectedClass));
      }

      const { data: results, error } = await query;

      if (error) {
        console.error('Error fetching analytics:', error);
        return;
      }

      // Process exam performance data
      const examPerformance = results?.map(result => ({
        exam: result.exams?.title || 'Unknown',
        averageScore: result.percentage || (result.marks_obtained / (result.exams?.max_marks || 100)) * 100,
        totalMarks: result.exams?.max_marks || 100
      })) || [];

      // Process grade distribution
      const gradeCount = results?.reduce((acc: any, result) => {
        const grade = result.grade || 'N/A';
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
      }, {}) || {};

      const gradeDistribution = Object.entries(gradeCount).map(([grade, count]) => ({
        grade,
        count,
        percentage: Math.round(((count as number) / (results?.length || 1)) * 100)
      }));

      // Process class performance
      const classGroups = results?.reduce((acc: any, result) => {
        const classLevel = result.exams?.class_level || 0;
        if (!acc[classLevel]) {
          acc[classLevel] = { total: 0, count: 0 };
        }
        acc[classLevel].total += result.percentage || (result.marks_obtained / (result.exams?.max_marks || 100)) * 100;
        acc[classLevel].count += 1;
        return acc;
      }, {}) || {};

      const classPerformance = Object.entries(classGroups).map(([classLevel, data]: [string, any]) => ({
        class: `Class ${classLevel}`,
        average: Math.round(data.total / data.count),
        students: data.count
      }));

      setAnalyticsData({
        examPerformance,
        gradeDistribution,
        classPerformance,
        subjectAnalysis: [] // This would need subject data from the exam
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (loading && exams.length === 0) {
    return <div className="flex justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Performance Analytics</h2>
          <p className="text-gray-600">Comprehensive analysis of student performance</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          Analytics Dashboard
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Exam (All Exams)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Exams</SelectItem>
                  {exams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title} (Class {exam.class_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="9">Class 9</SelectItem>
                  <SelectItem value="10">Class 10</SelectItem>
                  <SelectItem value="11">Class 11</SelectItem>
                  <SelectItem value="12">Class 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-blue-600">{exams.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Performance</p>
                <p className="text-2xl font-bold text-green-600">
                  {analyticsData.examPerformance.length > 0 
                    ? Math.round(analyticsData.examPerformance.reduce((sum, exam) => sum + exam.averageScore, 0) / analyticsData.examPerformance.length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analyticsData.classPerformance.reduce((sum, cls) => sum + cls.students, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {analyticsData.gradeDistribution.length > 0
                    ? Math.round(analyticsData.gradeDistribution
                        .filter(grade => !['F', 'N/A'].includes(grade.grade))
                        .reduce((sum, grade) => sum + grade.percentage, 0))
                    : 0}%
                </p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Distribution of grades across selected exams</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsData.gradeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ grade, percentage }) => `${grade}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Class Performance</CardTitle>
            <CardDescription>Average performance by class level</CardDescription>
          </CardHeader>
          <CardContent>
            {analyticsData.classPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.classPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="class" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="average" fill="#3b82f6" name="Average Score %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Exam Performance Trend */}
      {analyticsData.examPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Exam Performance Overview</CardTitle>
            <CardDescription>Performance across different exams</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={analyticsData.examPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="exam" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageScore" fill="#10b981" name="Average Score %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
