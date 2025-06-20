
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Filter, Download, Users, TrendingDown, TrendingUp, Award } from 'lucide-react';

interface StudentResult {
  id: string;
  student_id: string;
  marks_obtained: number;
  percentage: number;
  student_name: string;
  class_level: number;
  exam_title: string;
  max_marks: number;
}

const StudentCategorization = () => {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<StudentResult[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [exams, setExams] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchResults();
    }
  }, [selectedExam]);

  useEffect(() => {
    applyFilter();
  }, [results, selectedFilter]);

  const fetchExams = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) return;

      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('created_by_teacher_id', currentUser.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchResults = async () => {
    try {
      // Get exam details
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select('title, total_marks, max_marks')
        .eq('id', selectedExam)
        .single();
      
      if (examError) throw examError;

      // Get exam results with calculated percentage
      const { data: resultsData, error: resultsError } = await supabase
        .from('exam_results')
        .select('*, percentage')
        .eq('exam_id', selectedExam);

      if (resultsError) throw resultsError;

      // Get student profiles separately
      const studentIds = resultsData?.map(r => r.student_id) || [];
      const { data: studentProfiles, error: profilesError } = await supabase
        .from('student_profiles')
        .select('user_id, full_name, class_level')
        .in('user_id', studentIds);

      if (profilesError) throw profilesError;

      // Transform and merge the data
      const transformedResults = resultsData?.map(result => {
        const studentProfile = studentProfiles?.find(p => p.user_id === result.student_id);
        return {
          id: result.id,
          student_id: result.student_id,
          marks_obtained: result.marks_obtained,
          percentage: result.percentage || (result.marks_obtained / (examData.max_marks || examData.total_marks)) * 100,
          student_name: studentProfile?.full_name || `Student ${result.student_id.substring(0, 8)}`,
          class_level: studentProfile?.class_level || 0,
          exam_title: examData.title,
          max_marks: examData.max_marks || examData.total_marks
        };
      }) || [];

      // Sort by percentage descending
      transformedResults.sort((a, b) => b.percentage - a.percentage);
      
      setResults(transformedResults);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast({
        title: "Error",
        description: "Failed to load exam results",
        variant: "destructive"
      });
    }
  };

  const applyFilter = () => {
    let filtered = [...results];

    switch (selectedFilter) {
      case 'below30':
        filtered = results.filter(r => r.percentage < 30);
        break;
      case 'below50':
        filtered = results.filter(r => r.percentage < 50);
        break;
      case 'below60':
        filtered = results.filter(r => r.percentage < 60);
        break;
      case 'top3':
        filtered = results.slice(0, 3);
        break;
      case 'top10':
        filtered = results.slice(0, 10);
        break;
      default:
        filtered = results;
    }

    setFilteredResults(filtered);
  };

  const downloadCSV = () => {
    if (filteredResults.length === 0) {
      toast({
        title: "Warning",
        description: "No data to export",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Student Name', 'Class', 'Marks Obtained', 'Max Marks', 'Percentage', 'Category'];
    const csvData = filteredResults.map(result => [
      result.student_name,
      result.class_level,
      result.marks_obtained,
      result.max_marks,
      result.percentage.toFixed(2) + '%',
      getPerformanceCategory(result.percentage)
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_results_${selectedFilter}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `Exported ${filteredResults.length} student results`
    });
  };

  const getPerformanceCategory = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Average';
    if (percentage >= 50) return 'Below Average';
    if (percentage >= 30) return 'Poor';
    return 'Very Poor';
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge className="bg-green-600">Excellent</Badge>;
    if (percentage >= 75) return <Badge className="bg-blue-600">Good</Badge>;
    if (percentage >= 60) return <Badge className="bg-yellow-600">Average</Badge>;
    if (percentage >= 50) return <Badge className="bg-orange-600">Below Average</Badge>;
    if (percentage >= 30) return <Badge className="bg-red-600">Poor</Badge>;
    return <Badge className="bg-gray-600">Very Poor</Badge>;
  };

  const filterOptions = [
    { value: 'all', label: 'All Students', icon: Users },
    { value: 'below30', label: 'Below 30%', icon: TrendingDown },
    { value: 'below50', label: 'Below 50%', icon: TrendingDown },
    { value: 'below60', label: 'Below 60%', icon: TrendingDown },
    { value: 'top3', label: 'Top 3 Performers', icon: Award },
    { value: 'top10', label: 'Top 10 Performers', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Student Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.title} - Class {exam.class_level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={downloadCSV} disabled={filteredResults.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
          </div>

          {filteredResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Results ({filteredResults.length} students)
                </h3>
                <div className="text-sm text-gray-600">
                  Average: {(filteredResults.reduce((sum, r) => sum + r.percentage, 0) / filteredResults.length).toFixed(1)}%
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result, index) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">#{index + 1}</TableCell>
                        <TableCell>{result.student_name}</TableCell>
                        <TableCell>{result.class_level}</TableCell>
                        <TableCell>
                          {result.marks_obtained}/{result.max_marks}
                        </TableCell>
                        <TableCell>{result.percentage.toFixed(1)}%</TableCell>
                        <TableCell>{getPerformanceBadge(result.percentage)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentCategorization;
