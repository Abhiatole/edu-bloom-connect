
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Award, TrendingUp, Calendar, Star, Clock } from 'lucide-react';

const StudentDashboard = () => {
  const subjects = [
    { name: 'Mathematics', grade: 'A-', progress: 85, color: 'bg-blue-500' },
    { name: 'Science', grade: 'B+', progress: 78, color: 'bg-green-500' },
    { name: 'English', grade: 'A', progress: 92, color: 'bg-purple-500' },
    { name: 'History', grade: 'B', progress: 74, color: 'bg-orange-500' }
  ];

  const upcomingTests = [
    { subject: 'Mathematics', date: '2024-01-20', type: 'Quiz' },
    { subject: 'Science', date: '2024-01-22', type: 'Midterm' },
    { subject: 'English', date: '2024-01-25', type: 'Essay' }
  ];

  const achievements = [
    { title: 'Perfect Attendance', description: 'No absences this month', icon: Award },
    { title: 'Top Performer', description: 'Highest score in Mathematics', icon: Star },
    { title: 'Consistent Progress', description: 'Steady improvement across subjects', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your academic progress</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          View Schedule
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall GPA</p>
                <p className="text-3xl font-bold text-gray-900">3.7</p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Tests</p>
                <p className="text-3xl font-bold text-gray-900">28</p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Achievements</p>
                <p className="text-3xl font-bold text-gray-900">12</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Progress</CardTitle>
            <CardDescription>Your current grades and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {subjects.map((subject, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{subject.name}</span>
                    <span className="text-lg font-bold text-gray-900">{subject.grade}</span>
                  </div>
                  <Progress value={subject.progress} className="h-2" />
                  <p className="text-sm text-gray-600">{subject.progress}% completed</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tests</CardTitle>
            <CardDescription>Stay prepared for your assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{test.subject}</p>
                    <p className="text-sm text-gray-600">{test.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{test.date}</p>
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="h-3 w-3 mr-1" />
                      In {Math.ceil(Math.random() * 7)} days
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Tests
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
          <CardDescription>Your accomplishments and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="p-2 rounded-full bg-white">
                  <achievement.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{achievement.title}</p>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
