import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, AlertCircle, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
interface Exam {
  id: string;
  title: string;
  max_marks: number;
}
interface Student {
  id: string;
  enrollment_no: string;
  display_name?: string;
  full_name?: string;
}
interface MarkEntry {
  examId: string;
  studentId: string;
  marks: number;
  remarks: string;
  grade: string;
}
interface ManualMarkUploadProps {
  exams: Exam[];
  students: Student[];
  onSuccess: () => void;
}
// CSV upload related interfaces
interface CSVRow {
  enrollmentNo: string;
  marks: number;
  remarks?: string;
}
interface UploadStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}
const ManualMarkUpload: React.FC<ManualMarkUploadProps> = ({ exams, students, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('manual');
  const [csvExamId, setCsvExamId] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVRow[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    errors: []
  });
  const [processingCsv, setProcessingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [markEntry, setMarkEntry] = useState<MarkEntry>({
    examId: '',
    studentId: '',
    marks: 0,
    remarks: '',
    grade: '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!markEntry.examId || !markEntry.studentId) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Please select both exam and student.',
        });
        setLoading(false);
        return;
      }
      const selectedExam = exams.find(e => e.id === markEntry.examId);
      if (!selectedExam) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Selected exam not found.',
        });
        setLoading(false);
        return;
      }
      // Validate marks
      if (markEntry.marks < 0 || markEntry.marks > selectedExam.max_marks) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: `Marks must be between 0 and ${selectedExam.max_marks}.`,
        });
        setLoading(false);
        return;
      }
      
      // Check if entry already exists
      const { data: existingResult } = await supabase
        .from('exam_results')
        .select('*')
        .eq('exam_id', markEntry.examId)
        .eq('student_id', markEntry.studentId)
        .single();      
      
      let operation;
      if (existingResult) {
        // Update existing result
        const { data: currentUser } = await supabase.auth.getUser();
        
        // Build update object with only fields that are likely to exist
        const updateData: any = {
          marks_obtained: markEntry.marks,
          examiner_id: currentUser.user?.id,
          updated_at: new Date().toISOString()
        };
        
        // Only add optional fields if they exist in the component state
        if (markEntry.grade) {
          // First try to use grade, fallback to setting it in percentage
          try {
            const percentage = (markEntry.marks / selectedExam.max_marks) * 100;
            updateData.percentage = parseFloat(percentage.toFixed(2));
          } catch (e) {
          }
        }
        
        if (markEntry.remarks) {
          // Try to set remarks, fallback to feedback if that field exists
          updateData.remarks = markEntry.remarks;
        }
        
        // Add status field if the component is using it
        updateData.status = 'GRADED';
        
        operation = supabase
          .from('exam_results')
          .update(updateData)
          .eq('id', existingResult.id);      } else {
        // Insert new result
        const { data: currentUser } = await supabase.auth.getUser();
        
        // Build insert object with only fields that are likely to exist
        const insertData: any = {
          exam_id: markEntry.examId,
          student_id: markEntry.studentId,
          marks_obtained: markEntry.marks,
          examiner_id: currentUser.user?.id,
          submitted_at: new Date().toISOString()
        };
        
        // Calculate percentage for the grade
        try {
          const percentage = (markEntry.marks / selectedExam.max_marks) * 100;
          insertData.percentage = parseFloat(percentage.toFixed(2));
        } catch (e) {
        }
        
        // Only add optional fields if they exist in the component state
        if (markEntry.remarks) {
          insertData.remarks = markEntry.remarks;
        }
        
        // Add status field
        insertData.status = 'GRADED';
        
        operation = supabase
          .from('exam_results')
          .insert(insertData);
      }      const { error } = await operation;
      if (error) {
        
        // Provide more specific error message
        let errorMessage = 'Failed to save marks.';
        
        if (error.message) {
          // Check for specific error types and provide more helpful messages
          if (error.message.includes('foreign key constraint')) {
            errorMessage = 'Failed to save: There may be an issue with the exam or student reference.';
          } else if (error.message.includes('violates unique constraint')) {
            errorMessage = 'A result for this student and exam already exists.';
          } else if (error.message.includes('null value')) {
            errorMessage = 'Missing required field: ' + error.message;
          } else {
            errorMessage = `Error: ${error.message}`;
          }
        }
        
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        });
        return;
      }
      toast({
        title: 'Success',
        description: 'Marks saved successfully!',
      });
      // Reset form
      setMarkEntry({
        examId: markEntry.examId, // Keep the same exam selected
        studentId: '',
        marks: 0,
        remarks: '',
        grade: '',
      });
      // Notify parent component
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };
  // Generate grade based on percentage
  const calculateGrade = (marks: number, maxMarks: number) => {
    const percentage = (marks / maxMarks) * 100;
    
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };
  const handleMarksChange = (marks: number) => {
    const selectedExam = exams.find(e => e.id === markEntry.examId);
    if (!selectedExam) return;
    
    const grade = calculateGrade(marks, selectedExam.max_marks);
    setMarkEntry(prev => ({ ...prev, marks, grade }));
  };
  // Generate and download sample CSV file
  const downloadSampleCSV = () => {
    const selectedExam = exams.find(e => e.id === csvExamId);
    const maxMarks = selectedExam?.max_marks || 100;
    
    // Create header row
    const headerRow = 'enrollment_no,marks,remarks';
      // Get real students for the sample
    const realStudents = students.slice(0, 5);
    
    // Use real students, or fallback to generic ones if not enough students
    const sampleRows = [];
    
    // Add rows using real student data
    for (let i = 0; i < Math.min(5, realStudents.length); i++) {
      const student = realStudents[i];
      const marks = Math.floor(maxMarks * (0.65 + (i * 0.05))); // Varying marks
      const remarks = [
        "Excellent work",
        "Good effort but needs improvement", 
        "Outstanding performance", 
        "Average work, can improve",
        "Good understanding of concepts"
      ][i];
      
      // Include both enrollment number and student name
      sampleRows.push(`${student.enrollment_no},${marks},"${remarks} for ${student.display_name}"`);
    }
      // If we don't have 5 real students, add generic ones with a clear prefix
    for (let i = realStudents.length; i < 5; i++) {
      const marks = Math.floor(maxMarks * (0.65 + (i * 0.05)));
      const remarks = [
        "Excellent work",
        "Good effort but needs improvement", 
        "Outstanding performance", 
        "Average work, can improve",
        "Good understanding of concepts"
      ][i];
      
      // Use 'EXAMPLE' prefix to make it clear these aren't real enrollment numbers
      sampleRows.push(`EXAMPLE${1000 + i},${marks},"${remarks}"`);
    }
    
    // Combine header and rows
    const csvContent = [headerRow, ...sampleRows].join('\n');
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const examName = selectedExam?.title || 'exam';
    const safeExamName = examName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Set up and trigger download
    link.href = url;
    link.setAttribute('download', `sample_${safeExamName}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // CSV file handling functions
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    parseCSV(file);
  };
  
  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n');
        
        // Get header row and validate expected columns
        const header = rows[0].split(',').map(col => col.trim().toLowerCase());
        
        // Check for required columns
        const enrollmentColIndex = header.findIndex(col => 
          col === 'enrollment_no' || col === 'enrollmentno' || col === 'enrollment' || col === 'student_id'
        );
        
        const marksColIndex = header.findIndex(col => 
          col === 'marks' || col === 'marks_obtained' || col === 'score'
        );
        
        const remarksColIndex = header.findIndex(col => 
          col === 'remarks' || col === 'comments' || col === 'feedback'
        );
        
        if (enrollmentColIndex === -1 || marksColIndex === -1) {
          toast({
            variant: 'destructive',
            title: 'Invalid CSV Format',
            description: 'CSV must include columns for enrollment number and marks.'
          });
          setCsvFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        
        // Parse data rows
        const parsedRows: CSVRow[] = [];
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue; // Skip empty rows
          
          const columns = rows[i].split(',').map(col => col.trim());
            // Only process rows with enrollment number and marks
          if (columns[enrollmentColIndex] && columns[marksColIndex]) {
            // Clean enrollment number by removing quotes and extra whitespace
            const cleanEnrollmentNo = columns[enrollmentColIndex]
              .replace(/['"]/g, '') // Remove quotes
              .trim(); // Remove whitespace
              
            // Clean remarks by removing quotes if they exist
            const cleanRemarks = remarksColIndex !== -1 && columns[remarksColIndex] 
              ? columns[remarksColIndex].replace(/^"(.*)"$/, '$1') // Remove surrounding quotes
              : undefined;
            
            parsedRows.push({
              enrollmentNo: cleanEnrollmentNo,
              marks: parseInt(columns[marksColIndex]) || 0,
              remarks: cleanRemarks
            });
          }
        }
        
        setCsvPreview(parsedRows);
        
        // Show preview message
        toast({
          title: 'CSV Preview Ready',
          description: `Found ${parsedRows.length} valid records to import.`
        });
        
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'CSV Parsing Error',
          description: 'Could not parse the CSV file. Please check the format.'
        });
        setCsvFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    reader.readAsText(file);
  };
  // Process CSV upload
  const handleProcessCsv = async () => {
    if (!csvExamId || !csvFile || csvPreview.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select an exam and upload a valid CSV file.'
      });
      return;
    }
    
    setProcessingCsv(true);
    setUploadStatus({
      total: csvPreview.length,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    });
    
    const selectedExam = exams.find(e => e.id === csvExamId);
    if (!selectedExam) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selected exam not found.'
      });
      setProcessingCsv(false);
      return;
    }
    
    // Get current user for examiner_id
    const { data: currentUser } = await supabase.auth.getUser();
    
    // Process each row
    for (const row of csvPreview) {      // Find student by enrollment number
      const student = students.find(s => {
        // Normalize the enrollment numbers for comparison
        const normalizedEnrollment = s.enrollment_no.trim().toLowerCase();
        const normalizedRowEnrollment = row.enrollmentNo.trim().toLowerCase();
        
        return normalizedEnrollment === normalizedRowEnrollment || 
               normalizedEnrollment === normalizedRowEnrollment.replace(/\s+/g, '') || // Remove spaces
               normalizedEnrollment.replace(/\s+/g, '') === normalizedRowEnrollment; // Compare without spaces
      });
      
      if (!student) {
        setUploadStatus(prev => ({
          ...prev,
          processed: prev.processed + 1,
          failed: prev.failed + 1,
          errors: [...prev.errors, `No student found with enrollment number "${row.enrollmentNo}"`]
        }));
        continue;
      }
      
      // Validate marks
      if (row.marks < 0 || row.marks > selectedExam.max_marks) {
        setUploadStatus(prev => ({
          ...prev,
          processed: prev.processed + 1,
          failed: prev.failed + 1,
          errors: [...prev.errors, `Invalid marks (${row.marks}) for student ${row.enrollmentNo}. Must be between 0 and ${selectedExam.max_marks}.`]
        }));
        continue;
      }
      
      // Check if entry already exists
      const { data: existingResult } = await supabase
        .from('exam_results')
        .select('*')
        .eq('exam_id', csvExamId)
        .eq('student_id', student.id)
        .single();
      
      try {
        let operation;
          if (existingResult) {
          // Update existing result
          const updateData = {
              marks_obtained: row.marks,
              examiner_id: currentUser.user?.id,
              remarks: row.remarks || null,
              status: 'GRADED'
          };
          
          // Only add updated_at if it exists in the schema
          try {
            // Check if the field exists in the existing result
            if ('updated_at' in existingResult) {
              updateData['updated_at'] = new Date().toISOString();
            }
          } catch (e) {
          }
          
          operation = supabase
            .from('exam_results')
            .update(updateData)
            .eq('id', existingResult.id);
        } else {
          // Insert new result
          const insertData = {
              exam_id: csvExamId,
              student_id: student.id,
              marks_obtained: row.marks,
              examiner_id: currentUser.user?.id,
              remarks: row.remarks || null,
              status: 'GRADED'
          };
          
          // Only add submitted_at if it's used in the schema
          try {
            // We'll assume submitted_at exists if any row has it
            if ('submitted_at' in existingResult || Object.keys(existingResult).includes('submitted_at')) {
              insertData['submitted_at'] = new Date().toISOString();
            }
          } catch (e) {
          }
          
          operation = supabase
            .from('exam_results')
            .insert(insertData);
        }
          const { error } = await operation;
        
        if (error) {
          
          // Provide more specific error messages
          let errorMessage = error.message;
          
          if (error.message.includes('could not find') || error.message.includes('Could not find')) {
            errorMessage = `Schema error: ${error.message}. The database schema might have changed.`;
          } else if (error.message.includes('foreign key constraint')) {
            errorMessage = `Reference error: ${error.message}`;
          } else if (error.message.includes('violates unique constraint')) {
            errorMessage = `Duplicate record: ${error.message}`;
          }
          
          setUploadStatus(prev => ({
            ...prev,
            processed: prev.processed + 1,
            failed: prev.failed + 1,
            errors: [...prev.errors, `Error for ${row.enrollmentNo}: ${errorMessage}`]
          }));
        } else {
          setUploadStatus(prev => ({
            ...prev,
            processed: prev.processed + 1,
            successful: prev.successful + 1
          }));
        }
      } catch (error) {
        setUploadStatus(prev => ({
          ...prev,
          processed: prev.processed + 1,
          failed: prev.failed + 1,
          errors: [...prev.errors, `Unexpected error for ${row.enrollmentNo}`]
        }));
      }
    }
    
    setProcessingCsv(false);
    
    // Show final status
    toast({
      title: 'Upload Complete',
      description: `Successfully processed ${uploadStatus.successful} of ${uploadStatus.total} records.`,
      variant: uploadStatus.failed > 0 ? 'destructive' : 'default'
    });
    
    // If everything was successful, notify parent
    if (uploadStatus.failed === 0 && uploadStatus.successful > 0) {
      onSuccess();
    }
  };
  
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Tabs defaultValue="manual" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exam">Exam</Label>
                  <Select
                    value={markEntry.examId}
                    onValueChange={(value) => setMarkEntry(prev => ({ ...prev, examId: value }))}
                  >
                    <SelectTrigger id="exam">
                      <SelectValue placeholder="Select an exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map(exam => (
                        <SelectItem key={exam.id} value={exam.id}>
                          {exam.title} (Max: {exam.max_marks})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                  <div className="space-y-2">
                  <Label htmlFor="student">Student</Label>
                  <Select
                    value={markEntry.studentId}
                    onValueChange={(value) => setMarkEntry(prev => ({ ...prev, studentId: value }))}
                  >
                    <SelectTrigger id="student">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.display_name || 'Student'} • {student.enrollment_no}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="marks">Marks</Label>
                  <Input
                    id="marks"
                    type="number"
                    min={0}
                    max={exams.find(e => e.id === markEntry.examId)?.max_marks || 100}
                    value={markEntry.marks}
                    onChange={(e) => handleMarksChange(parseInt(e.target.value) || 0)}
                    required
                  />
                  {markEntry.examId && (
                    <p className="text-sm text-muted-foreground">
                      Max marks: {exams.find(e => e.id === markEntry.examId)?.max_marks || 'N/A'}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks (Optional)</Label>
                  <Input
                    id="remarks"
                    value={markEntry.remarks}
                    onChange={(e) => setMarkEntry(prev => ({ ...prev, remarks: e.target.value }))}
                  />
                </div>
                
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Marks'
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="csv">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csvExam">Select Exam</Label>
                <Select
                  value={csvExamId}
                  onValueChange={setCsvExamId}
                >
                  <SelectTrigger id="csvExam">
                    <SelectValue placeholder="Select an exam" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map(exam => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.title} (Max: {exam.max_marks})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="csvFile">Upload CSV File</Label>
                  <div className="flex space-x-2">
                    {csvExamId && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={downloadSampleCSV}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download Sample CSV
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // Show enrollment IDs in a toast for easy access
                        if (students.length === 0) {
                          toast({
                            title: "No Students Found",
                            description: "There are no students in the system.",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Limit to first 20 for UI purposes
                        const enrollmentsList = students.slice(0, 20).map(s => s.enrollment_no);
                        
                        // Create a more detailed view with enrollment and display name
                        const studentDetails = students.slice(0, 20).map(
                          s => `${s.enrollment_no} (${s.display_name || 'Unknown'})`
                        );
                        
                        toast({
                          title: `Available Student IDs (${students.length} total)`,
                          description: (
                            <div className="mt-2 max-h-[200px] overflow-y-auto">
                              <p className="mb-1 text-xs text-muted-foreground">
                                Here are the first {Math.min(20, students.length)} student enrollment IDs:
                              </p>
                              <ul className="list-disc list-inside text-sm">
                                {studentDetails.map((detail, idx) => (
                                  <li key={idx}>{detail}</li>
                                ))}
                              </ul>
                              {students.length > 20 && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  ...and {students.length - 20} more
                                </p>
                              )}
                            </div>
                          ),
                          duration: 10000, // longer duration to give time to read
                        });
                        
                        // Also log to console for copy-paste
                      }}
                      className="flex items-center gap-1"
                    >
                      View Student IDs
                    </Button>
                  </div>
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleCsvFileChange}
                  />
                </div>
                  <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>CSV Format Guide</AlertTitle>
                  <AlertDescription>
                    <p>CSV file must include the following columns:</p>
                    <ul className="list-disc list-inside pl-4 mt-1">
                      <li><code>enrollment_no</code> - Student enrollment number (must match exactly what's in the system)</li>
                      <li><code>marks</code> - Marks obtained (numeric value between 0 and max marks)</li>
                      <li><code>remarks</code> - Optional comments (text in quotes)</li>
                    </ul>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Note: The sample CSV contains real enrollment numbers from your system. If you're testing, 
                      please ensure enrollment numbers match existing students.
                    </p>
                  </AlertDescription>
                </Alert>
              </div>
              
              {csvFile && csvPreview.length > 0 && (
                <>
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Preview: {csvPreview.length} records</h4>
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-sm">                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Student</th>
                            <th className="text-left p-2">Enrollment No.</th>
                            <th className="text-left p-2">Marks</th>
                            <th className="text-left p-2">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.slice(0, 5).map((row, idx) => {
                            // Find matching student for this row
                            const student = students.find(s => {
                              const normalizedEnrollment = s.enrollment_no.trim().toLowerCase();
                              const normalizedRowEnrollment = row.enrollmentNo.trim().toLowerCase();
                              return normalizedEnrollment === normalizedRowEnrollment;
                            });
                            
                            return (
                              <tr key={idx} className="border-b">
                                <td className="p-2">
                                  {student ? student.display_name : "Not found"}
                                </td>
                                <td className="p-2">{row.enrollmentNo}</td>
                                <td className="p-2">{row.marks}</td>
                                <td className="p-2">{row.remarks || '-'}</td>
                              </tr>
                            );
                          })}
                          {csvPreview.length > 5 && (
                            <tr>
                              <td colSpan={3} className="p-2 text-center text-muted-foreground">
                                + {csvPreview.length - 5} more records
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleProcessCsv} 
                    disabled={processingCsv || !csvExamId}
                    className="w-full"
                  >
                    {processingCsv ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing... ({uploadStatus.processed}/{uploadStatus.total})
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Process CSV Upload
                      </>
                    )}
                  </Button>
                </>
              )}
              
              {uploadStatus.processed > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Upload Results</h4>
                  <div className="space-y-2">
                    <p>Total: {uploadStatus.total}</p>
                    <p>Successful: {uploadStatus.successful}</p>
                    <p>Failed: {uploadStatus.failed}</p>
                    
                    {uploadStatus.errors.length > 0 && (
                      <div className="mt-2">
                        <h5 className="font-medium text-destructive">Errors:</h5>
                        <ul className="list-disc list-inside pl-4 mt-1 max-h-40 overflow-y-auto text-sm">
                          {uploadStatus.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
export default ManualMarkUpload;
