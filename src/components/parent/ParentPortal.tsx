
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { User, GraduationCap, DollarSign, Bell, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ParentPortal = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childData, setChildData] = useState({
    performance: [],
    attendance: [],
    fees: [],
    notifications: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchChildrenData();
  }, []);

  const fetchChildrenData = async () => {
    try {
      // Fetch parent's children
      const { data: childrenData, error: childrenError } = await supabase
        .from('parent_students')
        .select(`
          *,
          student:student_id (*)
        `)
        .eq('parent_id', 'current-parent-id'); // In real app, get from auth

      if (childrenError) throw childrenError;

      setChildren(childrenData || []);
      
      if (childrenData && childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
        await fetchChildDetails(childrenData[0].student_id);
      }
    } catch (error) {
      console.error('Error fetching children data:', error);
      toast({
        title: "Error",
        description: "Failed to load children data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChildDetails = async (studentId: string) => {
    try {
      const [performanceResult, attendanceResult, feesResult, notificationsResult] = await Promise.all([
        supabase.from('performance_predictions').select('*').eq('student_id', studentId),
        supabase.from('attendance').select('*').eq('student_id', studentId),
        supabase.from('fee_payments').select('*').eq('student_id', studentId),
        supabase.from('push_notifications').select('*').eq('user_id', studentId)
      ]);

      setChildData({
        performance: performanceResult.data || [],
        attendance: attendanceResult.data || [],
        fees: feesResult.data || [],
        notifications: notificationsResult.data || []
      });
    } catch (error) {
      console.error('Error fetching child details:', error);
    }
  };

  // Mock data for demonstration
  const mockPerformanceData = [
    { subject: 'Mathematics', grade: 85, trend: 'up' },
    { subject: 'Science', grade: 92, trend: 'up' },
    { subject: 'English', grade: 78, trend: 'down' },
    { subject: 'History', grade: 88, trend: 'stable' }
  ];

  const mockAttendanceData = [
    { month: 'Jan', attendance: 95 },
    { month: 'Feb', attendance: 88 },
    { month: 'Mar', attendance: 92 },
    { month: 'Apr', attendance: 96 },
    { month: 'May', attendance: 90 }
  ];

  const attendancePieData = [
    { name: 'Present', value: 85, color: '#10b981' },
    { name: 'Absent', value: 10, color: '#ef4444' },
    { name: 'Late', value: 5, color: '#f59e0b' }
  ];

  if (loading) {
    return <div className="flex justify-center p-8">Loading parent portal...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Parent Portal</h2>
          <p className="text-gray-600">Monitor your child's academic progress</p>
        </div>
        <div className="flex space-x-2">
          {children.map((child, index) => (
            <Button
              key={child.id}
              variant={selectedChild?.id === child.id ? "default" : "outline"}
              onClick={() => {
                setSelectedChild(child);
                fetchChildDetails(child.student_id);
              }}
            >
              <User className="h-4 w-4 mr-2" />
              Child {index + 1}
            </Button>
          ))}
        </div>
      </div>

      {selectedChild && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
            <TabsTrigger value="notifications">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Overall Grade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">85.8%</p>
                      <p className="text-sm text-green-600">+2.3% this month</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">92%</p>
                      <p className="text-sm text-gray-500">18/20 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Fees Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">$1,200</p>
                      <p className="text-sm text-orange-600">Due in 7 days</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Bell className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold text-gray-900">3</p>
                      <p className="text-sm text-red-600">New notifications</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Performance</CardTitle>
                  <CardDescription>Subject-wise grade trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockPerformanceData.map((subject, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="font-medium">{subject.subject}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold">{subject.grade}%</span>
                          {subject.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {subject.trend === 'down' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attendance Overview</CardTitle>
                  <CardDescription>Monthly attendance distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        dataKey="value"
                        data={attendancePieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {attendancePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Tracking</CardTitle>
                <CardDescription>Detailed academic performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={mockAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Details</CardTitle>
                <CardDescription>Daily attendance tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 text-center">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="font-medium text-gray-600 p-2">{day}</div>
                  ))}
                  {Array.from({ length: 30 }, (_, i) => (
                    <div key={i} className={`p-2 rounded ${
                      Math.random() > 0.1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {i + 1}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Management</CardTitle>
                <CardDescription>Payment history and pending fees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { description: 'Semester Fee', amount: 1200, status: 'pending', due: '2024-02-15' },
                    { description: 'Lab Fee', amount: 200, status: 'paid', due: '2024-01-15' },
                    { description: 'Library Fee', amount: 50, status: 'paid', due: '2024-01-10' }
                  ].map((fee, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{fee.description}</h4>
                        <p className="text-sm text-gray-500">Due: {fee.due}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-bold">${fee.amount}</span>
                        <Badge className={fee.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {fee.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications & Alerts</CardTitle>
                <CardDescription>Important updates about your child</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: 'Test Result Published', message: 'Mathematics test results are now available', time: '2 hours ago', type: 'info' },
                    { title: 'Fee Reminder', message: 'Semester fee payment due in 7 days', time: '1 day ago', type: 'warning' },
                    { title: 'Attendance Alert', message: 'Attendance below 90% threshold', time: '2 days ago', type: 'error' },
                    { title: 'Parent-Teacher Meeting', message: 'Scheduled for next Friday at 3 PM', time: '3 days ago', type: 'info' }
                  ].map((notification, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        notification.type === 'error' ? 'bg-red-500' :
                        notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ParentPortal;
