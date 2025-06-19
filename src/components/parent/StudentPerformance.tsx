
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BookOpen, Target, Award } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

interface StudentPerformanceProps {
  studentId: string;
}

export const StudentPerformance: React.FC<StudentPerformanceProps> = ({ studentId }) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [recentExams, setRecentExams] = useState([]);
  const [stats, setStats] = useState({
    averageScore: 0,
    totalExams: 0,
    improvement: 0,
    rank: 0
  });

  useEffect(() => {
    // Mock data for demonstration
    const mockPerformanceData = [
      { month: 'Jan', score: 75, subject: 'Math' },
      { month: 'Feb', score: 82, subject: 'Physics' },
      { month: 'Mar', score: 78, subject: 'Chemistry' },
      { month: 'Apr', score: 85, subject: 'Math' },
      { month: 'May', score: 88, subject: 'Physics' },
      { month: 'Jun', score: 91, subject: 'Chemistry' }
    ];

    const mockRecentExams = [
      { id: 1, subject: 'Mathematics', score: 88, maxScore: 100, date: '2024-01-15', type: 'Test' },
      { id: 2, subject: 'Physics', score: 92, maxScore: 100, date: '2024-01-12', type: 'Quiz' },
      { id: 3, subject: 'Chemistry', score: 85, maxScore: 100, date: '2024-01-10', type: 'Test' }
    ];

    const mockStats = {
      averageScore: 88,
      totalExams: 15,
      improvement: 12,
      rank: 8
    };

    setPerformanceData(mockPerformanceData);
    setRecentExams(mockRecentExams);
    setStats(mockStats);
  }, [studentId]);

  return (
    <div className="space-y-6">
      {/* Performance Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold text-green-600">{stats.averageScore}%</p>
              </div>
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class Rank</p>
                <p className="text-2xl font-bold text-blue-600">#{stats.rank}</p>
              </div>
              <Award className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Performance Trend
          </CardTitle>
          <CardDescription>
            Academic performance over the past 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Exams */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            Recent Exam Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <h4 className="font-medium">{exam.subject}</h4>
                  <p className="text-sm text-muted-foreground">
                    {exam.type} • {new Date(exam.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {Math.round((exam.score / exam.maxScore) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {exam.score}/{exam.maxScore}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
