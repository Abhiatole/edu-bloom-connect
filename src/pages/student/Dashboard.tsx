import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Calendar, Bell, Award, Users, DollarSign, Brain, Target } from 'lucide-react';
import GradeView from '@/components/student/GradeView';
import AttendanceManager from '@/components/attendance/AttendanceManager';
import TimetableManager from '@/components/schedule/TimetableManager';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import PerformancePrediction from '@/components/ai/PerformancePrediction';
import FeesManagement from '@/components/fees/FeesManagement';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { title: 'Overall Grade', value: '85.7%', icon: Award, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Attendance', value: '94%', icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Subjects', value: '6', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Rank', value: '#12', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'grades', label: 'My Grades', icon: Award },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'timetable', label: 'Timetable', icon: BookOpen },
    { id: 'ai-insights', label: 'Performance Insights', icon: Brain },
    { id: 'fees', label: 'Fees & Payments', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const recentGrades = [
    { subject: 'Mathematics', grade: 'A-', score: 88, date: '2024-01-15' },
    { subject: 'Physics', grade: 'B+', score: 82, date: '2024-01-12' },
    { subject: 'Chemistry', grade: 'A', score: 92, date: '2024-01-10' },
    { subject: 'English', grade: 'B', score: 78, date: '2024-01-08' }
  ];

  const upcomingEvents = [
    { title: 'Physics Test', date: '2024-01-20', type: 'exam' },
    { title: 'Math Assignment Due', date: '2024-01-18', type: 'assignment' },
    { title: 'Parent-Teacher Meeting', date: '2024-01-22', type: 'meeting' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your academic progress with AI-powered insights</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setActiveTab('ai-insights')}>
            <Brain className="h-4 w-4 mr-2" />
            View AI Insights
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('grades')}>
            <Award className="h-4 w-4 mr-2" />
            View Grades
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

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Grades</CardTitle>
                  <CardDescription>Your latest academic performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentGrades.map((grade, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{grade.subject}</h4>
                          <p className="text-sm text-gray-600">Score: {grade.score}%</p>
                          <p className="text-xs text-gray-500">{grade.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{grade.grade}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Performance Insights</CardTitle>
                  <CardDescription>Personalized recommendations for improvement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                    <Target className="h-8 w-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium text-blue-900">Predicted Grade: A-</h4>
                      <p className="text-sm text-blue-700">Keep up the excellent work in Mathematics!</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
                    <Brain className="h-8 w-8 text-yellow-500" />
                    <div>
                      <h4 className="font-medium text-yellow-900">Study Recommendation</h4>
                      <p className="text-sm text-yellow-700">Focus more on Physics concepts for better results</p>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => setActiveTab('ai-insights')}>
                    View Detailed AI Analysis
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Important dates and deadlines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingEvents.map((event, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        event.type === 'exam' ? 'bg-red-500' :
                        event.type === 'assignment' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">{event.date}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('fees')}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Pay Fees Online
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('attendance')}>
                    <Calendar className="h-4 w-4 mr-2" />
                    View Attendance
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('timetable')}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Class Schedule
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'grades' && <GradeView />}
      {activeTab === 'attendance' && <AttendanceManager />}
      {activeTab === 'timetable' && <TimetableManager />}
      {activeTab === 'ai-insights' && <PerformancePrediction />}
      {activeTab === 'fees' && <FeesManagement />}
      {activeTab === 'notifications' && <NotificationCenter />}
    </div>
  );
};

export default StudentDashboard;
