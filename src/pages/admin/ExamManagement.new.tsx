import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Plus, Upload, Download, Users, Target, AlertTriangle, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import ManualMarkUpload from '@/components/ManualMarkUpload';
interface Subject {
  id: string;
  name: string;
  class_level: number;
}
interface Topic {
  id: string;
  name: string;
  chapter_number: number;
}
interface Exam {
  id: string;
  title: string;
  exam_type: string;
  class_level: number;
  max_marks: number;
  created_at: string;
  subjects: { name: string };
  topics: { name: string };
}
interface Student {
  id: string;
  full_name: string;
  class_level: number;
  roll_number?: string; // Optional since some students might not have it yet
}
type ExamType = 'JEE' | 'NEET' | 'CET' | 'Boards';
const ExamManagement = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [createExamOpen, setCreateExamOpen] = useState(false);
  const [markResultsOpen, setMarkResultsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [customSubject, setCustomSubject] = useState('');
  const [newSubjectId, setNewSubjectId] = useState<string | null>(null);
  const [exportingExamId, setExportingExamId] = useState<string | null>(null);
  const [uploadingResults, setUploadingResults] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [manualEntryMode, setManualEntryMode] = useState(false);
  
  const [examForm, setExamForm] = useState({
    title: '',
    subjectId: '',
    topicId: '',
    examType: '' as ExamType | '',
    classLevel: '11',
    maxMarks: '100'
  });
  const { toast } = useToast();
  const examTypes: ExamType[] = ['JEE', 'NEET', 'CET', 'Boards'];
  useEffect(() => {
    fetchData();
  }, []);
  
  // Fetch data from the server
  const fetchData = async () => {
    // Implement your fetchData logic here
  };
  // Fetch topics for a subject
  const fetchTopics = async (subjectId: string) => {
    // Implement your fetchTopics logic here
  };
  
  // Handle subject change
  const handleSubjectChange = (subjectId: string) => {
    // Implement your handleSubjectChange logic here
  };
  
  // Handle create exam form submission
  const handleCreateExam = async (e: React.FormEvent) => {
    // Implement your handleCreateExam logic here
  };
  
  // Handle CSV upload
  const handleCsvUpload = async () => {
    // Implement your handleCsvUpload logic here
  };
  
  // Download sample CSV
  const downloadSampleCsv = () => {
    // Implement your downloadSampleCsv logic here
  };
  
  // Export exam results
  const exportExamResults = async (examId: string) => {
    // Implement your exportExamResults logic here
  };
  
  // Handle adding custom subject
  const handleAddCustomSubject = async () => {
    // Implement your handleAddCustomSubject logic here
  };
  
  // Validate CSV format
  const validateCsvFormat = (file: File): Promise<boolean> => {
    // Implement your validateCsvFormat logic here
    return Promise.resolve(true);
  };
  
  if (loading) {
    return <div className="flex justify-center p-8">Loading exam management...</div>;
  }
  
  return (
    <div className="space-y-6">
      {exams.length === 0 && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Database Setup Required</AlertTitle>
          <AlertDescription>
            There was a problem loading the exam data. Please contact your administrator to run the exam tables setup script.
            <div className="mt-4">
              <Button asChild>
                <a href="/admin/exams?setup=true">
                  Retry Loading Exams
                </a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Management</h2>
          <p className="text-gray-600">Create and manage exams and results</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createExamOpen} onOpenChange={setCreateExamOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
              </DialogHeader>
              
              {/* Create Exam Form */}
            </DialogContent>
          </Dialog>
          <Dialog open={markResultsOpen} onOpenChange={setMarkResultsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Results
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Upload Exam Results</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="examSelect">Select Exam *</Label>                  
                  <Select value={selectedExam} onValueChange={setSelectedExam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.length === 0 ? (
                        <SelectItem value="no-exams" disabled>No exams available - create one first</SelectItem>
                      ) : (
                        exams.map(exam => (
                          <SelectItem key={exam.id} value={exam.id}>
                            {exam.title} - {exam.subjects?.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-amber-600 mt-1">
                    Note: Uploading results to an exam that already has results may create duplicates.
                  </p>
                </div>
                <Tabs defaultValue="csv" onValueChange={(value) => setManualEntryMode(value === 'manual')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="csv">CSV Upload</TabsTrigger>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="csv" className="pt-4">
                    <div>
                      <Label htmlFor="csvFile">CSV File *</Label>                  
                      <Input
                        id="csvFile"
                        type="file"
                        accept=".csv"
                        onChange={async (e) => {
                          const file = e.target.files?.[0] || null;
                          setCsvFile(file);
                          setCsvError(null); // Reset error state
                          
                          if (file) {
                            try {
                              await validateCsvFormat(file);
                              // Show success message for valid file
                              toast({
                                title: "Valid CSV",
                                description: "CSV format validated successfully",
                                variant: "default"
                              });
                            } catch (error: any) {
                              setCsvError(error.message);
                              toast({
                                title: "Invalid CSV",
                                description: error.message,
                                variant: "destructive"
                              });
                              setCsvFile(null);
                              e.target.value = '';
                            }
                          }
                        }}                    
                        className={csvError ? "border-red-500" : csvFile ? "border-green-500" : ""}
                      />
                      {csvError ? (
                        <p className="text-sm text-red-500 mt-1">{csvError}</p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">
                          CSV should contain columns: student_id, marks
                        </p>
                      )}
                      {csvFile && !csvError && (
                        <p className="text-sm text-green-600 mt-1">
                          File ready for upload: {csvFile.name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 my-4">
                      <Button onClick={downloadSampleCsv} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Sample CSV                  
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={handleCsvUpload} 
                      className="w-full" 
                      disabled={uploadingResults || !csvFile || csvError || !selectedExam}
                    >
                      {uploadingResults ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        "Upload Results"
                      )}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="manual" className="pt-4">
                    {selectedExam ? (
                      <ManualMarkUpload 
                        students={students} 
                        examId={selectedExam} 
                        onSuccess={() => {
                          setMarkResultsOpen(false);
                          fetchData();
                        }}
                      />
                    ) : (
                      <div className="text-center py-4 text-amber-600">
                        Please select an exam first to add marks manually
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            All Exams
          </CardTitle>
        </CardHeader>
        <CardContent>
          {exams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No exams created yet
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div key={exam.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{exam.title}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div><strong>Subject:</strong> {exam.subjects?.name}</div>
                        <div><strong>Type:</strong> {exam.exam_type}</div>
                        <div><strong>Class:</strong> {exam.class_level}</div>
                        <div><strong>Max Marks:</strong> {exam.max_marks}</div>
                      </div>
                      {exam.topics?.name && (
                        <div className="text-sm text-gray-600">
                          <strong>Topic:</strong> {exam.topics.name}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Created: {new Date(exam.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => exportExamResults(exam.id)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={exportingExamId === exam.id}
                    >
                      {exportingExamId === exam.id ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          Export Results
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
export default ExamManagement;
