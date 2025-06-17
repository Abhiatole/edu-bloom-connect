
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, BarChart3, Calendar, Users } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'student' | 'attendance' | 'performance';
}

const PDFReportGenerator = () => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes: ReportType[] = [
    {
      id: 'student-performance',
      title: 'Student Performance Report',
      description: 'Individual student test scores and progress',
      icon: BarChart3,
      category: 'student'
    },
    {
      id: 'attendance-summary',
      title: 'Attendance Summary',
      description: 'Class or student attendance statistics',
      icon: Calendar,
      category: 'attendance'
    },
    {
      id: 'class-performance',
      title: 'Class Performance Analytics',
      description: 'Overall class performance with charts',
      icon: Users,
      category: 'performance'
    },
    {
      id: 'comprehensive-report',
      title: 'Comprehensive Student Report',
      description: 'Complete student profile with all metrics',
      icon: FileText,
      category: 'student'
    }
  ];

  const classes = [
    { id: 'grade-10a', name: 'Grade 10A' },
    { id: 'grade-10b', name: 'Grade 10B' },
    { id: 'grade-11a', name: 'Grade 11A' },
    { id: 'grade-11b', name: 'Grade 11B' }
  ];

  const students = [
    { id: '1', name: 'John Doe', class: 'grade-10a' },
    { id: '2', name: 'Jane Smith', class: 'grade-10a' },
    { id: '3', name: 'Mike Johnson', class: 'grade-10b' },
    { id: '4', name: 'Sarah Wilson', class: 'grade-11a' }
  ];

  const generatePDF = async () => {
    setIsGenerating(true);
    
    // Simulate PDF generation
    setTimeout(() => {
      const reportData = {
        type: selectedReport,
        class: selectedClass,
        student: selectedStudent,
        dateRange: dateRange,
        timestamp: new Date().toISOString()
      };
      
      console.log('Generating PDF with data:', reportData);
      
      // In a real implementation, you would:
      // 1. Send this data to your backend
      // 2. Generate PDF using a library like jsPDF or call a backend service
      // 3. Download the generated PDF
      
      // Mock download
      const link = document.createElement('a');
      link.href = '#';
      link.download = `report-${selectedReport}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setIsGenerating(false);
    }, 2000);
  };

  const getFilteredStudents = () => {
    if (!selectedClass) return students;
    return students.filter(student => student.class === selectedClass);
  };

  const isGenerateDisabled = () => {
    if (!selectedReport) return true;
    
    const report = reportTypes.find(r => r.id === selectedReport);
    if (!report) return true;
    
    // Check requirements based on report category
    if (report.category === 'student' && !selectedStudent) return true;
    if ((report.category === 'attendance' || report.category === 'performance') && !selectedClass) return true;
    
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">PDF Report Generator</h2>
          <p className="text-gray-600">Generate and download comprehensive reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>Select report type and parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Report Type</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportTypes.map(report => (
                  <div
                    key={report.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedReport === report.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedReport(report.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <report.icon className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{report.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {report.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Class Selection */}
            {(selectedReport === 'attendance-summary' || selectedReport === 'class-performance' || selectedReport === 'student-performance' || selectedReport === 'comprehensive-report') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Class</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Student Selection */}
            {(selectedReport === 'student-performance' || selectedReport === 'comprehensive-report') && selectedClass && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Student</label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilteredStudents().map(student => (
                      <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range (Optional)</label>
              <DatePickerWithRange date={dateRange} setDate={setDateRange} />
            </div>

            {/* Generate Button */}
            <Button 
              onClick={generatePDF} 
              disabled={isGenerateDisabled() || isGenerating}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating PDF...' : 'Generate & Download PDF'}
            </Button>
          </CardContent>
        </Card>

        {/* Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>Preview of selected report configuration</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedReport ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {reportTypes.find(r => r.id === selectedReport)?.title}
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {selectedClass && (
                      <div>Class: {classes.find(c => c.id === selectedClass)?.name}</div>
                    )}
                    {selectedStudent && (
                      <div>Student: {students.find(s => s.id === selectedStudent)?.name}</div>
                    )}
                    {dateRange?.from && (
                      <div>
                        Period: {dateRange.from.toLocaleDateString()} 
                        {dateRange.to && ` - ${dateRange.to.toLocaleDateString()}`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-gray-900">Will Include:</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {selectedReport === 'student-performance' && (
                      <>
                        <li>• Test scores and grades</li>
                        <li>• Performance trends</li>
                        <li>• Subject-wise analysis</li>
                      </>
                    )}
                    {selectedReport === 'attendance-summary' && (
                      <>
                        <li>• Attendance statistics</li>
                        <li>• Present/absent breakdown</li>
                        <li>• Attendance trends</li>
                      </>
                    )}
                    {selectedReport === 'class-performance' && (
                      <>
                        <li>• Class average scores</li>
                        <li>• Performance charts</li>
                        <li>• Grade distribution</li>
                      </>
                    )}
                    {selectedReport === 'comprehensive-report' && (
                      <>
                        <li>• Complete academic profile</li>
                        <li>• Attendance record</li>
                        <li>• Performance analytics</li>
                        <li>• Progress tracking</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a report type to see preview
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PDFReportGenerator;
