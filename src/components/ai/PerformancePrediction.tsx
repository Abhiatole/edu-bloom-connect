
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Brain, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PerformancePrediction = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('student_insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast({
        title: "Error",
        description: "Failed to load performance insights",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async (studentId: string, subject: string) => {
    try {
      // Generate AI insight based on existing student performance
      const mockInsight = {
        student_id: studentId,
        subject: subject as 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' | 'English' | 'Computer Science' | 'Other',
        topic: 'General Performance',
        performance_level: Math.random() > 0.7 ? 'Excellent' : Math.random() > 0.4 ? 'Good' : 'Average' as 'Excellent' | 'Good' | 'Average' | 'Below Average' | 'Poor',
        strengths: ['Problem solving', 'Conceptual understanding'],
        weaknesses: ['Time management', 'Complex calculations'],
        ai_comment: 'Student shows consistent improvement in recent assessments.',
        recommendations: 'Focus on practice problems and time management techniques.'
      };

      const { error } = await supabase
        .from('student_insights')
        .insert([mockInsight]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Performance insight generated successfully"
      });
      
      fetchInsights();
    } catch (error) {
      console.error('Error generating insight:', error);
      toast({
        title: "Error",
        description: "Failed to generate insight",
        variant: "destructive"
      });
    }
  };

  const getRiskColor = (performance: string) => {
    switch (performance) {
      case 'Poor': return 'bg-red-100 text-red-800 border-red-200';
      case 'Below Average': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Average': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Good': return 'bg-green-100 text-green-800 border-green-200';
      case 'Excellent': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const mockChartData = [
    { month: 'Jan', predicted: 75, actual: 72 },
    { month: 'Feb', predicted: 78, actual: 76 },
    { month: 'Mar', predicted: 82, actual: 80 },
    { month: 'Apr', predicted: 85, actual: null },
    { month: 'May', predicted: 87, actual: null },
  ];

  if (loading) {
    return <div className="flex justify-center p-8">Loading insights...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Performance Insights</h2>
          <p className="text-gray-600">Analytics for student success</p>
        </div>
        <Button onClick={() => generateInsight('sample-student-id', 'Mathematics')}>
          <Brain className="h-4 w-4 mr-2" />
          Generate Insight
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">At-Risk Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {insights.filter(i => i.performance_level === 'Poor' || i.performance_level === 'Below Average').length}
                </p>
                <p className="text-sm text-gray-500">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {insights.filter(i => i.performance_level === 'Excellent' || i.performance_level === 'Good').length}
                </p>
                <p className="text-sm text-gray-500">High Achievers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{insights.length}</p>
                <p className="text-sm text-gray-500">Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trend Analysis</CardTitle>
            <CardDescription>Predicted vs Actual Performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} name="Predicted" />
                <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>Student performance levels by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.slice(0, 5).map((insight, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{insight.subject}</p>
                    <p className="text-sm text-gray-500">Topic: {insight.topic || 'General'}</p>
                  </div>
                  <Badge className={getRiskColor(insight.performance_level)}>
                    {insight.performance_level?.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformancePrediction;
