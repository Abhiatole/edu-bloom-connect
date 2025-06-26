import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Calendar, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
interface ExamCreationFormProps {
  onExamCreated: (examData: any) => void;
}
const ExamCreationForm: React.FC<ExamCreationFormProps> = ({ onExamCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    exam_date: '',
    exam_time: '',
    duration_minutes: 60,
    max_marks: 100,
    class_level: 11,
    exam_type: 'Internal',
    description: ''
  });
  const [questionPaper, setQuestionPaper] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 
    'Hindi', 'History', 'Geography', 'Computer Science', 'Economics'
  ];
  const examTypes = [
    'Internal', 'Quarterly', 'Half Yearly', 'Annual', 'Unit Test', 'Practice Test'
  ];
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload only PDF or DOC files",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      
      setQuestionPaper(file);
    }
  };
  const uploadQuestionPaper = async (file: File): Promise<string> => {
    // In a real implementation, you'd upload to Supabase storage
    // For now, we'll simulate the upload
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`/uploads/question-papers/${Date.now()}_${file.name}`);
      }, 1000);
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.subject || !formData.exam_date || !formData.exam_time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setUploading(true);
    try {
      let questionPaperUrl = '';
      
      // Upload question paper if provided
      if (questionPaper) {
        questionPaperUrl = await uploadQuestionPaper(questionPaper);
      }
      const examData = {
        ...formData,
        question_paper_url: questionPaperUrl
      };
      onExamCreated(examData);
      
      // Reset form
      setFormData({
        title: '',
        subject: '',
        exam_date: '',
        exam_time: '',
        duration_minutes: 60,
        max_marks: 100,
        class_level: 11,
        exam_type: 'Internal',
        description: ''
      });
      setQuestionPaper(null);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create exam",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Exam Title */}
        <div className="md:col-span-2">
          <Label htmlFor="title">Exam Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Mathematics Mid-term Exam"
            required
          />
        </div>
        {/* Subject */}
        <div>
          <Label htmlFor="subject">Subject *</Label>
          <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(subject => (
                <SelectItem key={subject} value={subject}>{subject}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Exam Type */}
        <div>
          <Label htmlFor="exam_type">Exam Type</Label>
          <Select value={formData.exam_type} onValueChange={(value) => handleInputChange('exam_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select exam type" />
            </SelectTrigger>
            <SelectContent>
              {examTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Date */}
        <div>
          <Label htmlFor="exam_date">Exam Date *</Label>
          <Input
            id="exam_date"
            type="date"
            value={formData.exam_date}
            onChange={(e) => handleInputChange('exam_date', e.target.value)}
            required
          />
        </div>
        {/* Time */}
        <div>
          <Label htmlFor="exam_time">Exam Time *</Label>
          <Input
            id="exam_time"
            type="time"
            value={formData.exam_time}
            onChange={(e) => handleInputChange('exam_time', e.target.value)}
            required
          />
        </div>
        {/* Duration */}
        <div>
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value))}
            min="15"
            max="300"
          />
        </div>
        {/* Max Marks */}
        <div>
          <Label htmlFor="max_marks">Maximum Marks</Label>
          <Input
            id="max_marks"
            type="number"
            value={formData.max_marks}
            onChange={(e) => handleInputChange('max_marks', parseInt(e.target.value))}
            min="10"
            max="1000"
          />
        </div>
        {/* Class Level */}
        <div>
          <Label htmlFor="class_level">Class Level</Label>
          <Select value={formData.class_level.toString()} onValueChange={(value) => handleInputChange('class_level', parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(cls => (
                <SelectItem key={cls} value={cls.toString()}>Class {cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Description */}
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Additional instructions or information about the exam"
          rows={3}
        />
      </div>
      {/* Question Paper Upload */}
      <div>
        <Label htmlFor="question_paper">Question Paper (Optional)</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="question_paper" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  {questionPaper ? questionPaper.name : 'Drop files here or click to upload'}
                </span>
                <input
                  id="question_paper"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              PDF, DOC up to 10MB
            </p>
          </div>
        </div>
        {questionPaper && (
          <Alert className="mt-2">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Question paper ready: {questionPaper.name} ({(questionPaper.size / 1024 / 1024).toFixed(2)} MB)
            </AlertDescription>
          </Alert>
        )}
      </div>
      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="submit"
          disabled={uploading}
          className="min-w-[120px]"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Create Exam
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
export default ExamCreationForm;
