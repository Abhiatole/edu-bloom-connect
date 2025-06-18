
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, AlertTriangle, 
  Download, Filter, Calendar, Award 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState({
    topPerformers: [],
    absentStudents: [],
    feeDefaulters: [],
    coursePopularity: []
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedMetric]);

  const fetchAnalyticsData = async () => {
    try {
      // In a real app, these would be complex queries or cached analytics
      const mockData = {
        topPerformers: [
          { name: 'Alice Johnson', grade: 96.5, subject: 'Mathematics', trend: 'up' },
          { name: 'Bob Smith', grade: 94.2, subject: 'Science', trend: 'up' },
          { name: 'Carol Brown', grade: 92.8, subject: 'English', trend: 'stable' },
          { name: 'David Wilson', grade: 91.5, subject: 'History', trend: 'up' },
          { name: 'Emma Davis', grade: 90.3, subject: 'Physics', trend: 'down' }
        ],
        absentStudents: [
          { name: 'John Doe', absences: 12, percentage: 65, riskLevel: 'high' },
          { name: 'Jane Smith', absences: 8, percentage: 78, riskLevel: 'medium' },
          { name: 'Mike Johnson', absences: 6, percentage: 85, riskLevel: 'low' },
          { name: 'Sarah Wilson', absences: 10, percentage: 72, riskLevel: 'medium' },
          { name: 'Tom Brown', absences: 15, percentage: 58, riskLevel: 'high' }
        ],
        feeDefaulters: [
          { name: 'Parent A', student: 'Student A', amount: 1200, daysOverdue: 15 },
          { name: 'Parent B', student: 'Student B', amount: 800, daysOverdue: 8 },
          { name: 'Parent C', student: 'Student C', amount: 1500, daysOverdue: 22 },
          { name: 'Parent D', student: 'Student D', amount: 600, daysOverdue: 5 },
          { name: 'Parent E', student: 'Student E', amount: 900, daysOverdue: 12 }
        ],
        coursePopularity: [
          { course: 'Mathematics', enrolled: 120, completed: 95, rating: 4.5 },
          { course: 'Science', enrolled: 105, completed: 88, rating: 4.3 },
          { course: 'English', enrolled: 98, completed: 92, rating: 4.2 },
          { course: 'History', enrolled: 85, completed: 78, rating: 4.0 },
          { course: 'Physics', enrolled: 75, completed: 65, rating: 4.1 }
        ]
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const data = JSON.stringify(analyticsData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Analytics data exported successfully"
    });
  };

  const performanceChartData = [
    { month: 'Jan', mathematics: 85, science: 82, english: 78, history: 80 },
    { month: 'Feb', mathematics: 87, science: 84, english: 80, history: 82 },
    { month: 'Mar', mathematics: 89, science: 86, english: 82, history: 84 },
    { month: 'Apr', mathematics: 91, science: 88, english: 84, history: 86 },
    { month: 'May', mathematics: 93, science: 90, english: 86, history: 88 }
  ];

  const attendanceDistribution = [
    { name: 'Excellent (95-100%)', value: 35, color: '#10b981' },
    { name: 'Good (85-94%)', value: 40, color: '#3b82f6' },
    { name: 'Average (75-84%)', value: 20, color: '#f59e0b' },
    { name: 'Poor (<75%)', value: 5, color: '#ef4444' }
  ];

  const feeCollectionData = [
    { month: 'Jan', collected: 85000, pending: 15000 },
    { month: 'Feb', collected: 92000, pending: 8000 },
    { month: 'Mar', collected: 88000, pending: 12000 },
    { month: 'Apr', collected: 95000, pending: 5000 },
    { month: 'May', collected: 90000, pending: 10000 }
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex space-x-3">
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
                <p className="text-sm text-green-600">+5.2% this month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Award className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">87.3%</p>
                <p className="text-sm text-green-600">+2.1% improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fee Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">$450K</p>
                <p className="text-sm text-gray-500">90% collected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">At-Risk Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">23</p>
                <p className="text-sm text-red-600">Needs attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Subject-wise performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="mathematics" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="science" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="english" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="history" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
            <CardDescription>Student attendance categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={attendanceDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {attendanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Collection Trends</CardTitle>
            <CardDescription>Monthly fee collection vs pending amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={feeCollectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="collected" fill="#10b981" name="Collected" />
                <Bar dataKey="pending" fill="#ef4444" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Popularity</CardTitle>
            <CardDescription>Enrollment and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.coursePopularity.map((course, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{course.course}</h4>
                    <p className="text-sm text-gray-500">
                      {course.enrolled} enrolled • {course.completed} completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{course.rating}/5</p>
                    <p className="text-sm text-gray-500">
                      {Math.round((course.completed / course.enrolled) * 100)}% completion
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Highest achieving students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.topPerformers.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{student.name}</h4>
                    <p className="text-sm text-gray-500">{student.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{student.grade}%</p>
                    <TrendingUp className="h-4 w-4 text-green-500 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Alerts</CardTitle>
            <CardDescription>Students with attendance issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.absentStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{student.name}</h4>
                    <p className="text-sm text-gray-500">{student.absences} absences</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{student.percentage}%</p>
                    <Badge className={getRiskColor(student.riskLevel)}>
                      {student.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Defaulters</CardTitle>
            <CardDescription>Outstanding fee payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.feeDefaulters.map((defaulter, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{defaulter.student}</h4>
                    <p className="text-sm text-gray-500">{defaulter.daysOverdue} days overdue</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">${defaulter.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
