import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Brain, BookOpen, GraduationCap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { generateAndSaveStudentInsights } from '@/services/openaiService';
interface StudentData {
  id: string;
  name: string;
  examScores: number[];
  subjects: string[];
  attendanceRate: number;
  recentPerformance: string;
}
// Sample student data - in a real app, this would come from the database
const sampleStudents: StudentData[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'John Smith',
    examScores: [85, 92, 78, 88],
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    attendanceRate: 92,
    recentPerformance: 'Good performance in Mathematics, struggles with Chemistry concepts'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Emily Johnson',
    examScores: [95, 88, 92, 90],
    subjects: ['Biology', 'Chemistry', 'Physics'],
    attendanceRate: 98,
    recentPerformance: 'Excellent in Biology, good understanding of scientific concepts'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Michael Brown',
    examScores: [72, 68, 75, 70],
    subjects: ['English', 'Mathematics', 'Computer Science'],
    attendanceRate: 85,
    recentPerformance: 'Improving in Mathematics, needs support with English composition'
  }
];
const AIStudentInsights = () => {
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<boolean | null>(null);
  const { toast } = useToast();
  const generateInsights = async (student: StudentData) => {
    setSelectedStudent(student);
    setLoading(true);
    setResponse('');
    setError('');
    setSaveStatus(null);
    
    try {
      const result = await generateAndSaveStudentInsights(
        student.id,
        {
          examScores: student.examScores,
          subjects: student.subjects,
          attendanceRate: student.attendanceRate,
          recentPerformance: student.recentPerformance
        }
      );
      
      if (result.isError) {
        setError(result.errorMessage || 'Failed to generate insights');
        toast({
          title: "Error",
          description: result.errorMessage || "Failed to generate insights",
          variant: "destructive"
        });
      } else {
        setResponse(result.content);
        setSaveStatus(result.savedToDatabase);
        
        if (!result.savedToDatabase) {          toast({
            title: "Warning",
            description: result.errorMessage || "Generated insights but failed to save to database",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: "Generated and saved insights for " + student.name,
          });
        }
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container mx-auto py-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5 text-purple-500" />
            AI Student Performance Insights
          </CardTitle>
          <CardDescription>
            Generate AI-powered insights for student performance and save them to the database
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {sampleStudents.map((student) => (
              <Card key={student.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {student.name}
                    <Badge variant="outline" className="ml-2">
                      {Math.round(student.examScores.reduce((a, b) => a + b, 0) / student.examScores.length)}% Avg
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Subjects: {student.subjects.join(", ")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xs text-muted-foreground mb-4">
                    Attendance: {student.attendanceRate}% | Exams: {student.examScores.join(", ")}
                  </div>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => generateInsights(student)}
                    disabled={loading && selectedStudent?.id === student.id}
                  >
                    {loading && selectedStudent?.id === student.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Generate Insights
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {response && (
            <Card className="mt-4 border-t">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Insights for {selectedStudent?.name}
                  {saveStatus !== null && (
                    saveStatus ? (
                      <Badge className="ml-auto bg-green-100 text-green-800 flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Saved to Database
                      </Badge>
                    ) : (
                      <Badge className="ml-auto bg-yellow-100 text-yellow-800 flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Saved
                      </Badge>
                    )
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                  {response}
                </div>
              </CardContent>
            </Card>
          )}
          
          {error && (
            <Card className="mt-4 border-t border-red-200">
              <CardContent className="p-4">
                <div className="bg-red-50 p-4 rounded-md text-red-800 flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Error</p>
                    <p className="text-sm">{error}</p>
                    <p className="text-sm mt-2">
                      To fix this error, please follow the instructions in the{' '}
                      <a 
                        href="#" 
                        className="text-blue-600 underline"
                        onClick={(e) => {
                          e.preventDefault();
                          toast({
                            title: "Fix Instructions",
                            description: "Run the FIX_STUDENT_INSIGHTS_RLS.sql script in your Supabase SQL Editor",
                          });
                        }}
                      >
                        STUDENT_INSIGHTS_RLS_FIX_GUIDE.md
                      </a>{' '}
                      file.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default AIStudentInsights;
