
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, ClipboardList, BookOpen, Award, Bell, Calendar } from 'lucide-react';

const TeacherDashboard = () => {
  const quickStats = [
    { title: 'My Students', value: '32', icon: UserPlus, color: 'text-blue-600' },
    { title: 'Pending Grades', value: '8', icon: ClipboardList, color: 'text-orange-600' },
    { title: 'Active Courses', value: '3', icon: BookOpen, color: 'text-green-600' },
    { title: 'Achievements', value: '15', icon: Award, color: 'text-purple-600' }
  ];

  const recentStudents = [
    { name: 'Alice Johnson', email: 'alice@example.com', course: 'Mathematics', status: 'Active' },
    { name: 'Bob Smith', email: 'bob@example.com', course: 'Mathematics', status: 'Active' },
    { name: 'Carol Wilson', email: 'carol@example.com', course: 'Science', status: 'Pending' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your students and courses</p>
        </div>
        <div className="flex space-x-3">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Enroll Student
          </Button>
          <Button variant="outline">
            <ClipboardList className="h-4 w-4 mr-2" />
            Record Marks
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Students</CardTitle>
            <CardDescription>Students enrolled in your courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentStudents.map((student, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.email}</p>
                    <p className="text-xs text-blue-600">{student.course}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    student.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {student.status}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Students
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Enroll New Student
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <ClipboardList className="h-4 w-4 mr-2" />
              Enter Test Scores
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Assessment
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Send Notifications
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
