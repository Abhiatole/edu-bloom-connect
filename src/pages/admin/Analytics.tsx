
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Users, GraduationCap, BookOpen, TrendingUp, Award, AlertCircle } from 'lucide-react';

interface AnalyticsData {
  totalStudents: number;
  totalTeachers: number;
  totalExams: number;
  pendingApprovals: number;
  registrationTrend: Array<{ date: string; students: number; teachers: number }>;
  approvalStatus: Array<{ name: string; value: number; color: string }>;
  subjectDistribution: Array<{ subject: string; count: number }>;
  classDistribution: Array<{ class: string; count: number }>;
  examPerformance: Array<{ exam: string; average: number; count: number }>;
}

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData>({
    totalStudents: 0,
    totalTeachers: 0,
    totalExams: 0,
    pendingApprovals: 0,
    registrationTrend: [],
    approvalStatus: [],
    subjectDistribution: [],
    classDistribution: [],
    examPerformance: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch basic counts
      const [studentsResult, teachersResult, examsResult, pendingStudentsResult, pendingTeachersResult] = await Promise.all([
        supabase.from('student_profiles').select('*', { count: 'exact' }),
        supabase.from('teacher_profiles').select('*', { count: 'exact' }),
        supabase.from('exams').select('*', { count: 'exact' }),
        supabase.from('student_profiles').select('*', { count: 'exact' }).eq('status', 'PENDING'),
        supabase.from('teacher_profiles').select('*', { count: 'exact' }).eq('status', 'PENDING')
      ]);

      // Fetch approval status data
      const [approvedStudents, rejectedStudents, approvedTeachers, rejectedTeachers] = await Promise.all([
        supabase.from('student_profiles').select('*', { count: 'exact' }).eq('status', 'APPROVED'),
        supabase.from('student_profiles').select('*', { count: 'exact' }).eq('status', 'REJECTED'),
        supabase.from('teacher_profiles').select('*', { count: 'exact' }).eq('status', 'APPROVED'),
        supabase.from('teacher_profiles').select('*', { count: 'exact' }).eq('status', 'REJECTED')
      ]);

      // Fetch subject distribution
      const { data: subjectData } = await supabase
        .from('teacher_profiles')
        .select('subject_expertise')
        .eq('status', 'APPROVED');

      // Fetch class distribution
      const { data: classData } = await supabase
        .from('student_profiles')
        .select('class_level')
        .eq('status', 'APPROVED');

      // Fetch exam performance
      const { data: examResults } = await supabase
        .from('exam_results')
        .select(`
          marks_obtained,
          exams(title, max_marks)
        `);

      // Process subject distribution
      const subjectCounts: { [key: string]: number } = {};
      subjectData?.forEach(item => {
        subjectCounts[item.subject_expertise] = (subjectCounts[item.subject_expertise] || 0) + 1;
      });

      // Process class distribution
      const classCounts: { [key: string]: number } = {};
      classData?.forEach(item => {
        const className = `Class ${item.class_level}`;
        classCounts[className] = (classCounts[className] || 0) + 1;
      });

      // Process exam performance
      const examPerformanceMap: { [key: string]: { total: number; count: number } } = {};
      examResults?.forEach(result => {
        if (result.exams) {
          const examTitle = result.exams.title;
          const percentage = (result.marks_obtained / result.exams.max_marks) * 100;
          
          if (!examPerformanceMap[examTitle]) {
            examPerformanceMap[examTitle] = { total: 0, count: 0 };
          }
          examPerformanceMap[examTitle].total += percentage;
          examPerformanceMap[examTitle].count += 1;
        }
      });

      // Generate mock registration trend data for the last 7 days
      const registrationTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        registrationTrend.push({
          date: date.toLocaleDateString(),
          students: Math.floor(Math.random() * 10) + 1,
          teachers: Math.floor(Math.random() * 5) + 1
        });
      }

      setData({
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalExams: examsResult.count || 0,
        pendingApprovals: (pendingStudentsResult.count || 0) + (pendingTeachersResult.count || 0),
        registrationTrend,
        approvalStatus: [
          { name: 'Approved Students', value: approvedStudents.count || 0, color: '#10b981' },
          { name: 'Pending Students', value: pendingStudentsResult.count || 0, color: '#f59e0b' },
          { name: 'Rejected Students', value: rejectedStudents.count || 0, color: '#ef4444' },
          { name: 'Approved Teachers', value: approvedTeachers.count || 0, color: '#06b6d4' },
          { name: 'Pending Teachers', value: pendingTeachersResult.count || 0, color: '#8b5cf6' },
          { name: 'Rejected Teachers', value: rejectedTeachers.count || 0, color: '#ec4899' }
        ],
        subjectDistribution: Object.entries(subjectCounts).map(([subject, count]) => ({
          subject,
          count
        })),
        classDistribution: Object.entries(classCounts).map(([className, count]) => ({
          class: className,
          count
        })),
        examPerformance: Object.entries(examPerformanceMap).map(([exam, data]) => ({
          exam: exam.substring(0, 20) + (exam.length > 20 ? '...' : ''),
          average: Math.round(data.total / data.count),
          count: data.count
        })).slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p className="text-gray-600">Overview of platform performance and metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">{data.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-green-600">{data.totalTeachers}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-purple-600">{data.totalExams}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-orange-600">{data.pendingApprovals}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Registration Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="students" stroke="#3b82f6" strokeWidth={2} name="Students" />
                <Line type="monotone" dataKey="teachers" stroke="#10b981" strokeWidth={2} name="Teachers" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={data.approvalStatus.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {data.approvalStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subject Distribution (Teachers)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.subjectDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Class Distribution (Students)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.classDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Exam Performance */}
      {data.examPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Recent Exam Performance (Average %)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.examPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="exam" />
                <YAxis />
                <Tooltip formatter={(value, name) => [`${value}%`, 'Average Score']} />
                <Bar dataKey="average" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Analytics;
