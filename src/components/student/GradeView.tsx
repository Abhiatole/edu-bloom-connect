
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, TrendingUp, Award, Calendar } from 'lucide-react';

const GradeView = () => {
  const grades = [
    { 
      id: 1, 
      subject: 'Mathematics', 
      test: 'Algebra Test', 
      score: 85, 
      maxScore: 100, 
      grade: 'B+', 
      date: '2024-01-15',
      teacher: 'Mr. Johnson'
    },
    { 
      id: 2, 
      subject: 'Physics', 
      test: 'Mechanics Quiz', 
      score: 92, 
      maxScore: 100, 
      grade: 'A-', 
      date: '2024-01-12',
      teacher: 'Dr. Smith'
    },
    { 
      id: 3, 
      subject: 'Chemistry', 
      test: 'Organic Chemistry', 
      score: 78, 
      maxScore: 100, 
      grade: 'B', 
      date: '2024-01-10',
      teacher: 'Ms. Wilson'
    },
    { 
      id: 4, 
      subject: 'Mathematics', 
      test: 'Geometry Test', 
      score: 88, 
      maxScore: 100, 
      grade: 'B+', 
      date: '2024-01-08',
      teacher: 'Mr. Johnson'
    }
  ];

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateAverage = () => {
    const total = grades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 100, 0);
    return (total / grades.length).toFixed(1);
  };

  const subjectAverages = grades.reduce((acc, grade) => {
    if (!acc[grade.subject]) {
      acc[grade.subject] = { total: 0, count: 0, scores: [] };
    }
    acc[grade.subject].total += (grade.score / grade.maxScore) * 100;
    acc[grade.subject].count += 1;
    acc[grade.subject].scores.push(grade.score);
    return acc;
  }, {} as Record<string, { total: number; count: number; scores: number[] }>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Grades</h2>
        <p className="text-gray-600">Track your academic performance</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Average</p>
                <p className="text-3xl font-bold text-gray-900">{calculateAverage()}%</p>
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
                <p className="text-sm font-medium text-gray-600">Total Tests</p>
                <p className="text-3xl font-bold text-gray-900">{grades.length}</p>
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
                <p className="text-sm font-medium text-gray-600">Best Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.max(...grades.map(g => (g.score / g.maxScore) * 100)).toFixed(0)}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-50">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Results</CardTitle>
            <CardDescription>Your latest test scores and grades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {grades.map((grade) => (
                <div key={grade.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{grade.test}</h4>
                      <Badge className={getGradeColor(grade.grade)}>
                        {grade.grade}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{grade.subject}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(grade.date).toLocaleDateString()}
                      </span>
                      <span>by {grade.teacher}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-lg font-bold ${getScoreColor(grade.score, grade.maxScore)}`}>
                      {grade.score}/{grade.maxScore}
                    </p>
                    <p className="text-sm text-gray-500">
                      {((grade.score / grade.maxScore) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Average performance by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(subjectAverages).map(([subject, data]) => {
                const average = data.total / data.count;
                return (
                  <div key={subject} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{subject}</span>
                      <span className={`font-semibold ${getScoreColor(average, 100)}`}>
                        {average.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          average >= 90 ? 'bg-green-500' :
                          average >= 80 ? 'bg-blue-500' :
                          average >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(average, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{data.count} test(s) completed</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GradeView;
