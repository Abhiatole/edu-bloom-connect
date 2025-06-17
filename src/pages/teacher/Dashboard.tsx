import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, ClipboardCheck, TrendingUp, UserPlus, FileText, Calendar, Bell, BarChart3 } from 'lucide-react';
import StudentEnrollment from '@/components/teacher/StudentEnrollment';
import AttendanceManager from '@/components/attendance/AttendanceManager';
import TimetableManager from '@/components/schedule/TimetableManager';
import PDFReportGenerator from '@/components/reports/PDFReportGenerator';
import NotificationCenter from '@/components/notifications/NotificationCenter';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { title: 'My Students', value: '42', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Subjects Teaching', value: '3', icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Tests Graded', value: '28', icon: ClipboardCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Avg Class Score', value: '87%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const recentTests = [
    { subject: 'Mathematics', test: 'Algebra Quiz', students: 15, avgScore: 85, date: '2024-01-15' },
    { subject: 'Physics', test: 'Mechanics Test', students: 12, avgScore: 78, date: '2024-01-12' },
    { subject: 'Mathematics', test: 'Geometry Assignment', students: 18, avgScore: 92, date: '2024-01-10' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your classes and students</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setActiveTab('students')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Enroll Student
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('reports')}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bg}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Test Results</CardTitle>
                <CardDescription>Latest graded assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{test.test}</h4>
                        <p className="text-sm text-gray-600">{test.subject}</p>
                        <p className="text-xs text-gray-500">{test.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{test.avgScore}%</p>
                        <p className="text-sm text-gray-500">{test.students} students</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common teaching tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('students')}>
                  <Users className="h-4 w-4 mr-2" />
                  View All Students
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('attendance')}>
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Mark Attendance
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('reports')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Reports
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('timetable')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Timetable
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'students' && <StudentEnrollment />}
      {activeTab === 'attendance' && <AttendanceManager />}
      {activeTab === 'timetable' && <TimetableManager />}
      {activeTab === 'reports' && <PDFReportGenerator />}
      {activeTab === 'notifications' && <NotificationCenter />}
    </div>
  );
};

export default TeacherDashboard;
