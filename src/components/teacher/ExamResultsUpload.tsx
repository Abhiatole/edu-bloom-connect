import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileSpreadsheet, UserCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ManualResultEntry from '@/components/teacher/ManualResultEntry';
import * as XLSX from 'xlsx';
interface ExamResultsUploadProps {
  exams: Array<{
    id: string;
    title: string;
    subject: string;
    max_marks: number;
  }>;
  students: Array<{
    id: string;
    enrollment_no: string;
    full_name: string;
  }>;
  onResultsUploaded: () => void;
}
interface ExcelRow {
  enrollment_no: string;
  student_name: string;
  subject: string;
  exam_name: string;
  marks: number;
  feedback?: string;
}
const ExamResultsUpload: React.FC<ExamResultsUploadProps> = ({ 
  exams, 
  students, 
  onResultsUploaded 
}) => {
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'manual' | 'excel'>('manual');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    valid: ExcelRow[];
    invalid: Array<{ row: number; error: string; data: any }>;
  } | null>(null);
  const { toast } = useToast();
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload only Excel (.xlsx or .xls) files",
          variant: "destructive"
        });
        return;
      }
      
      setExcelFile(file);
      setValidationResults(null);
    }
  };
  const parseExcelFile = async (file: File): Promise<ExcelRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with header row
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            throw new Error('Excel file must have at least 2 rows (header + data)');
          }
          
          const headers = (jsonData[0] as string[]).map(h => h.toString().trim().toLowerCase());
          
          // Expected headers
          const requiredHeaders = ['enrollment_no', 'student_name', 'subject', 'exam_name', 'marks'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
          }
          
          const results: ExcelRow[] = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            const rowData = jsonData[i] as any[];
            if (!rowData || rowData.length === 0) continue;
            
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = rowData[index] ? rowData[index].toString().trim() : '';
            });
            
            if (!row.enrollment_no) continue; // Skip empty rows
            
            results.push({
              enrollment_no: row.enrollment_no,
              student_name: row.student_name || '',
              subject: row.subject || '',
              exam_name: row.exam_name || '',
              marks: parseFloat(row.marks) || 0,
              feedback: row.feedback || ''
            });
          }
          
          resolve(results);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };
  const validateExcelData = async () => {
    if (!excelFile || !selectedExam) {
      toast({
        title: "Validation Error",
        description: "Please select an exam and upload an Excel file",
        variant: "destructive"
      });
      return;
    }
    setUploading(true);
    try {
      const parsedData = await parseExcelFile(excelFile);
      const selectedExamData = exams.find(e => e.id === selectedExam);
      
      if (!selectedExamData) {
        throw new Error('Selected exam not found');
      }
      const valid: ExcelRow[] = [];
      const invalid: Array<{ row: number; error: string; data: any }> = [];
      parsedData.forEach((row, index) => {
        const student = students.find(s => s.enrollment_no === row.enrollment_no);
        
        if (!student) {
          invalid.push({
            row: index + 2, // +2 because of header and 0-based index
            error: `Student with enrollment ${row.enrollment_no} not found`,
            data: row
          });
          return;
        }
        if (!row.marks || isNaN(row.marks) || row.marks < 0 || row.marks > selectedExamData.max_marks) {
          invalid.push({
            row: index + 2,
            error: `Invalid marks: ${row.marks}. Must be between 0 and ${selectedExamData.max_marks}`,
            data: row
          });
          return;
        }
        valid.push(row);
      });
      setValidationResults({ valid, invalid });
      
      if (invalid.length > 0) {
        toast({
          title: "Validation Issues Found",
          description: `${invalid.length} rows have issues. Please review before uploading.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Validation Successful",
          description: `${valid.length} rows are ready for upload`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to validate Excel file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const uploadValidatedResults = async () => {
    if (!validationResults?.valid.length || !selectedExam) return;
    setUploading(true);
    try {
      const selectedExamData = exams.find(e => e.id === selectedExam);
      if (!selectedExamData) throw new Error('Exam not found');
      const resultsToUpload = validationResults.valid.map(row => {
        const student = students.find(s => s.enrollment_no === row.enrollment_no);
        if (!student) return null;
        return {
          exam_id: selectedExam,
          student_id: student.id,
          enrollment_no: row.enrollment_no,
          student_name: student.full_name,
          subject: selectedExamData.subject,
          exam_name: selectedExamData.title,
          marks_obtained: row.marks,
          max_marks: selectedExamData.max_marks,
          feedback: row.feedback || '',
          created_at: new Date().toISOString()
        };
      }).filter(Boolean);
      const { error } = await supabase
        .from('exam_results')
        .upsert(resultsToUpload, {
          onConflict: 'exam_id,student_id'
        });
      if (error) throw error;
      toast({
        title: "Success",
        description: `Uploaded results for ${resultsToUpload.length} students`,
      });
      // Reset form
      setExcelFile(null);
      setValidationResults(null);
      setSelectedExam('');
      onResultsUploaded();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload results",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  const downloadSampleExcel = () => {
    const headers = ['enrollment_no', 'student_name', 'subject', 'exam_name', 'marks', 'feedback'];
    const sampleData = students.slice(0, 3).map(student => [
      student.enrollment_no,
      student.full_name,
      'Mathematics', // Sample subject
      'Sample Exam',
      85, // Sample marks
      'Good performance' // Sample feedback
    ]);
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Exam Results');
    
    XLSX.writeFile(workbook, 'exam_results_sample.xlsx');
  };
  return (
    <div className="space-y-6">
      {/* Exam Selection */}
      <div>
        <Label htmlFor="exam-select">Select Exam *</Label>
        <Select value={selectedExam} onValueChange={setSelectedExam}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an exam to enter results for" />
          </SelectTrigger>
          <SelectContent>
            {exams.map(exam => (
              <SelectItem key={exam.id} value={exam.id}>
                {exam.title} - {exam.subject} (Max: {exam.max_marks} marks)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Upload Method Selection */}
      <Tabs value={uploadMode} onValueChange={(value) => setUploadMode(value as 'manual' | 'excel')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">
            <UserCheck className="h-4 w-4 mr-2" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="excel">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel Upload
          </TabsTrigger>
        </TabsList>
        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-4">
          {selectedExam ? (
            <ManualResultEntry
              examId={selectedExam}
              students={students}
              onResultAdded={onResultsUploaded}
            />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select an exam first to enter results manually.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        {/* Excel Upload Tab */}
        <TabsContent value="excel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Excel Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sample Download */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Download sample format:</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={downloadSampleExcel}
                >
                  Download Sample Excel
                </Button>
              </div>
              {/* File Upload */}
              <div>
                <Label htmlFor="excel-file">Upload Excel File</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="excel-file" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {excelFile ? excelFile.name : 'Drop Excel file here or click to upload'}
                        </span>
                        <input
                          id="excel-file"
                          type="file"
                          className="hidden"
                          accept=".xlsx,.xls"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Excel files (.xlsx, .xls) only
                    </p>
                  </div>
                </div>
              </div>
              {/* Validation and Upload */}
              {excelFile && selectedExam && (
                <div className="space-y-4">
                  <Button 
                    onClick={validateExcelData}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? 'Validating...' : 'Validate Data'}
                  </Button>
                  {/* Validation Results */}
                  {validationResults && (
                    <div className="space-y-4">
                      {validationResults.invalid.length > 0 && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-medium mb-2">
                              {validationResults.invalid.length} rows have issues:
                            </div>
                            <ul className="list-disc list-inside text-sm">
                              {validationResults.invalid.slice(0, 5).map((item, index) => (
                                <li key={index}>Row {item.row}: {item.error}</li>
                              ))}
                              {validationResults.invalid.length > 5 && (
                                <li>... and {validationResults.invalid.length - 5} more</li>
                              )}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                      {validationResults.valid.length > 0 && (
                        <Alert>
                          <UserCheck className="h-4 w-4" />
                          <AlertDescription>
                            {validationResults.valid.length} rows are valid and ready for upload.
                          </AlertDescription>
                        </Alert>
                      )}
                      {validationResults.valid.length > 0 && validationResults.invalid.length === 0 && (
                        <Button 
                          onClick={uploadValidatedResults}
                          disabled={uploading}
                          className="w-full"
                        >
                          {uploading ? 'Uploading...' : `Upload ${validationResults.valid.length} Results`}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default ExamResultsUpload;
