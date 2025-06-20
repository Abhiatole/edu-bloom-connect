
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  BookOpen,
  Trophy,
  TrendingUp,
  Target,
  Award,
  User
} from 'lucide-react';

interface ExamResult {
  id: string;
  marks_obtained: number;
  percentage: number;
  grade: string;
  exams: {
    title: string;
    max_marks: number;
    subject: string;
  };
  submitted_at: string;
}

interface StudentStats {
  totalExams: number;
  averageScore: number;
  highestScore: number;
  currentGrade: string;
}

const StudentDashboard = () => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    totalExams: 0,
    averageScore: 0,
    highestScore: 0,
    currentGrade: 'N/A'
  });
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');

      // Get student profile
      const { data: profile, error: profileError } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', currentUser.user.id)
        .single();

      if (profileError) throw profileError;
      setStudentProfile(profile);

      // Get exam results
      const { data: examResults, error: resultsError } = await supabase
        .from('exam_results')
        .select(`
          id,
          marks_obtained,
          grade,
          submitted_at,
          exams!inner(
            title,
            max_marks,
            subject
          )
        `)
        .eq('student_id', currentUser.user.id)
        .order('submitted_at', { ascending: false });

      if (resultsError) throw resultsError;

      // Calculate percentages and transform results
      const transformedResults: ExamResult[] = examResults?.map(result => ({
        ...result,
        percentage: result.exams?.max_marks ? Math.round((result.marks_obtained / result.exams.max_marks) * 100) : 0
      })) || [];

      setResults(transformedResults);

      // Calculate statistics
      const totalExams = transformedResults.length;
      const averageScore = totalExams > 0 
        ? Math.round(transformedResults.reduce((sum, result) => sum + result.percentage, 0) / totalExams)
        : 0;
      const highestScore = totalExams > 0 
        ? Math.max(...transformedResults.map(result => result.percentage))
        : 0;
      const latestGrade = transformedResults.length > 0 ? transformedResults[0].grade : 'N/A';

      setStats({
        totalExams,
        averageScore,
        highestScore,
        currentGrade: latestGrade
      });

    } catch (error) {
      console.error('Error fetching student data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'bg-green-600 text-white';
      case 'A': return 'bg-green-500 text-white';
      case 'B+': return 'bg-blue-500 text-white';
      case 'B': return 'bg-blue-400 text-white';
      case 'C+': return 'bg-yellow-500 text-white';
      case 'C': return 'bg-yellow-400 text-black';
      case 'D': return 'bg-orange-500 text-white';
      default: return 'bg-red-500 text-white';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {studentProfile?.full_name} • Class {studentProfile?.class_level}
          </p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          <User className="h-4 w-4 mr-1" />
          Student
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md: grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalExams}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-green-600">{stats.averageScore}%</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Highest Score</p>
                <p className="text-2xl font-bold text-purple-600">{stats.highestScore}%</p>
              </div>
              <Trophy className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Latest Grade</p>
                <p className="text-2xl font-bold text-orange-600">{stats.currentGrade}</p>
              </div>
              <Award className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Exam Results
          </CardTitle>
          <CardDescription>
            Your latest examination performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.slice(0, 5).map((result) => (
                <div key={result.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{result.exams?.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{result.exams?.subject}</span>
                        <span>•</span>
                        <span>{result.marks_obtained}/{result.exams?.max_marks} marks</span>
                        <span>•</span>
                        <span>{new Date(result.submitted_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Score:</span>
                          <Progress value={result.percentage} className="w-24" />
                          <span className="text-sm font-bold">{result.percentage}%</span>
                        </div>
                        <Badge className={getGradeBadgeColor(result.grade)}>
                          Grade {result.grade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Exam Results Yet</h3>
              <p className="mb-4">Your exam results will appear here once you take your first exam.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
