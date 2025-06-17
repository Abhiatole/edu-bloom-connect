
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, Award, TrendingUp, Bell, Download } from 'lucide-react';
import GradeView from '@/components/student/GradeView';
import StudentProgressChart from '@/components/charts/StudentProgressChart';

const StudentDashboard = () => {
  const studentName = "Alex Johnson";
  
  const stats = [
    { title: 'Current GPA', value: '3.8', icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Courses Enrolled', value: '6', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Assignments Due', value: '3', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Class Rank', value: '12th', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' }
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
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

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

      {/* Detailed Grade View */}
      <GradeView />
    </div>
  );
};

export default StudentDashboard;
