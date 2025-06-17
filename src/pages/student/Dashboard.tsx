import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Award, TrendingUp, Bell, Download, Clock, CheckCircle } from 'lucide-react';
import GradeView from '@/components/student/GradeView';
import StudentProgressChart from '@/components/charts/StudentProgressChart';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const studentName = "Alex Johnson";
  
  const stats = [
    { title: 'Current GPA', value: '3.8', icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Courses Enrolled', value: '6', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Assignments Due', value: '3', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Attendance Rate', value: '95%', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  const progressData = [
    { assignment: 'Quiz 1', score: 85, average: 78 },
    { assignment: 'Project 1', score: 92, average: 84 },
    { assignment: 'Midterm', score: 88, average: 82 },
    { assignment: 'Quiz 2', score: 95, average: 79 },
    { assignment: 'Project 2', score: 90, average: 85 },
  ];

  const upcomingAssignments = [
    { title: 'Mathematics Assignment', dueDate: '2024-01-20', subject: 'Mathematics' },
    { title: 'History Essay', dueDate: '2024-01-22', subject: 'History' },
    { title: 'Science Lab Report', dueDate: '2024-01-25', subject: 'Science' }
  ];

  const recentGrades = [
    { subject: 'Mathematics', assignment: 'Chapter 5 Quiz', grade: 'A-', score: 90 },
    { subject: 'English', assignment: 'Essay Analysis', grade: 'B+', score: 87 },
    { subject: 'Science', assignment: 'Lab Experiment', grade: 'A', score: 94 }
  ];

  const attendanceData = [
    { date: '2024-01-15', subject: 'Mathematics', status: 'present' },
    { date: '2024-01-15', subject: 'English', status: 'present' },
    { date: '2024-01-14', subject: 'Science', status: 'present' },
    { date: '2024-01-14', subject: 'History', status: 'late' },
    { date: '2024-01-13', subject: 'Mathematics', status: 'present' }
  ];

  const timetable = [
    { day: 'Monday', time: '09:00-10:30', subject: 'Mathematics', room: 'Room 101' },
    { day: 'Monday', time: '10:45-12:15', subject: 'English', room: 'Room 102' },
    { day: 'Monday', time: '13:00-14:30', subject: 'Science', room: 'Lab 201' },
    { day: 'Tuesday', time: '09:00-10:30', subject: 'History', room: 'Room 103' },
    { day: 'Tuesday', time: '10:45-12:15', subject: 'Geography', room: 'Room 104' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'attendance', label: 'Attendance', icon: CheckCircle },
    { id: 'timetable', label: 'Timetable', icon: Calendar }
  ];

  const getAttendanceIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'late': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {studentName}!</h1>
          <p className="text-gray-600 mt-2">Here's your academic progress overview</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button onClick={() => setActiveTab('grades')}>
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

          {/* Progress Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Progress</CardTitle>
              <CardDescription>Your performance compared to class average</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentProgressChart data={progressData} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Assignments</CardTitle>
                <CardDescription>Stay on top of your deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingAssignments.map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900">{assignment.title}</h4>
                        <p className="text-sm text-gray-600">{assignment.subject}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{assignment.dueDate}</p>
                        <p className="text-xs text-gray-500">Due date</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Grades */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Grades</CardTitle>
                <CardDescription>Your latest assessment results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentGrades.map((grade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900">{grade.assignment}</h4>
                        <p className="text-sm text-gray-600">{grade.subject}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{grade.grade}</p>
                        <p className="text-xs text-gray-500">{grade.score}%</p>
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

      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Record</CardTitle>
              <CardDescription>Your attendance history and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendanceData.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getAttendanceIcon(record.status)}
                      <div>
                        <h4 className="font-medium text-gray-900">{record.subject}</h4>
                        <p className="text-sm text-gray-600">{record.date}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getAttendanceColor(record.status)}`}>
                      {record.status}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'timetable' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Class Timetable</CardTitle>
              <CardDescription>Your weekly class schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timetable.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.subject}</h4>
                      <p className="text-sm text-gray-600">{item.day} - {item.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{item.room}</p>
                      <p className="text-xs text-gray-500">Location</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
