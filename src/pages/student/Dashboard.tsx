
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, TrendingUp, Award, Calendar, Eye, Download } from 'lucide-react';
import GradeView from '@/components/student/GradeView';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { title: 'Current GPA', value: '3.7', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Subjects Enrolled', value: '6', icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Tests Completed', value: '14', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Attendance', value: '94%', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'grades', label: 'My Grades', icon: Award }
  ];

  const upcomingTests = [
    { subject: 'Mathematics', test: 'Calculus Exam', date: '2024-01-20', time: '10:00 AM' },
    { subject: 'Physics', test: 'Thermodynamics Quiz', date: '2024-01-22', time: '2:00 PM' },
    { subject: 'Chemistry', test: 'Organic Chemistry Lab', date: '2024-01-25', time: '9:00 AM' }
  ];

  const currentSubjects = [
    { name: 'Mathematics', teacher: 'Mr. Johnson', progress: 75, nextClass: 'Today 10:00 AM' },
    { name: 'Physics', teacher: 'Dr. Smith', progress: 68, nextClass: 'Tomorrow 2:00 PM' },
    { name: 'Chemistry', teacher: 'Ms. Wilson', progress: 82, nextClass: 'Friday 9:00 AM' },
    { name: 'Biology', teacher: 'Dr. Brown', progress: 71, nextClass: 'Monday 11:00 AM' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your academic progress</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setActiveTab('grades')}>
            <Eye className="h-4 w-4 mr-2" />
            View Grades
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Subjects */}
            <Card>
              <CardHeader>
                <CardTitle>Current Subjects</CardTitle>
                <CardDescription>Your enrolled courses and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentSubjects.map((subject, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{subject.name}</h4>
                          <p className="text-sm text-gray-600">by {subject.teacher}</p>
                        </div>
                        <span className="text-sm font-medium text-blue-600">{subject.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${subject.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">Next class: {subject.nextClass}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Tests */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tests</CardTitle>
                <CardDescription>Your scheduled assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingTests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{test.test}</h4>
                        <p className="text-sm text-gray-600">{test.subject}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{test.date}</p>
                        <p className="text-xs text-gray-500">{test.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'grades' && <GradeView />}
    </div>
  );
};

export default StudentDashboard;
