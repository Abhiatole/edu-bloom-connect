
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Brain, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PerformancePrediction = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('performance_predictions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPredictions(data || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast({
        title: "Error",
        description: "Failed to load performance predictions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePrediction = async (studentId: string, subject: string) => {
    try {
      // Mock AI prediction logic - in real app would use ML model
      const mockPrediction = {
        student_id: studentId,
        subject: subject,
        predicted_grade: Math.random() * 40 + 60, // 60-100 range
        confidence_score: Math.random() * 0.3 + 0.7, // 0.7-1.0 range
        risk_level: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
      };

      const { error } = await supabase
        .from('performance_predictions')
        .insert([mockPrediction]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Performance prediction generated successfully"
      });
      
      fetchPredictions();
    } catch (error) {
      console.error('Error generating prediction:', error);
      toast({
        title: "Error",
        description: "Failed to generate prediction",
        variant: "destructive"
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
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
    return <div className="flex justify-center p-8">Loading predictions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Performance Insights</h2>
          <p className="text-gray-600">Predictive analytics for student success</p>
        </div>
        <Button onClick={() => generatePrediction('student-id', 'Mathematics')}>
          <Brain className="h-4 w-4 mr-2" />
          Generate Prediction
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
                  {predictions.filter(p => p.risk_level === 'high').length}
                </p>
                <p className="text-sm text-gray-500">High Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {predictions.length > 0 
                    ? Math.round(predictions.reduce((acc, p) => acc + (p.confidence_score || 0), 0) / predictions.length * 100)
                    : 0}%
                </p>
                <p className="text-sm text-gray-500">Prediction Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Trending Up</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {predictions.filter(p => (p.predicted_grade || 0) > 80).length}
                </p>
                <p className="text-sm text-gray-500">High Performers</p>
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
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Student risk levels by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.slice(0, 5).map((prediction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{prediction.subject}</p>
                    <p className="text-sm text-gray-500">Grade: {prediction.predicted_grade?.toFixed(1)}%</p>
                  </div>
                  <Badge className={getRiskColor(prediction.risk_level)}>
                    {prediction.risk_level?.toUpperCase()}
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
