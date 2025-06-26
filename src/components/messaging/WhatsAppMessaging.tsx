import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Send, 
  Users, 
  TestTube, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Smartphone,
  Sparkles
} from 'lucide-react';
import { 
  TwilioWhatsAppService, 
  MESSAGE_TEMPLATES, 
  validateWhatsAppNumber 
} from '@/services/twilioWhatsAppService';
import { supabase } from '@/integrations/supabase/client';

interface Student {
  id: string;
  enrollment_no: string;
  full_name: string;
  display_name: string;
  phone_number?: string;
  parent_phone?: string;
}

interface Exam {
  id: string;
  title: string;
  exam_date: string;
  max_marks: number;
}

interface WhatsAppMessagingProps {
  userRole: 'ADMIN' | 'TEACHER';
  userId: string;
}

const WhatsAppMessaging: React.FC<WhatsAppMessagingProps> = ({ userRole, userId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [selectedExam, setSelectedExam] = useState('');
  const [aiGeneratedMessage, setAiGeneratedMessage] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  // Fetch students and exams on component mount
  useEffect(() => {
    fetchStudents();
    fetchExams();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('status', 'APPROVED')
        .order('created_at');

      if (error) throw error;
      
      // Map the data to match our interface, handling missing fields gracefully
      const mappedStudents = (data || []).map((student: any) => ({
        id: student.id || student.user_id,
        enrollment_no: student.enrollment_no || 'N/A',
        full_name: student.full_name || student.display_name || 'Unknown Student',
        display_name: student.display_name || student.full_name || 'Unknown Student',
        phone_number: student.phone_number,
        parent_phone: student.parent_phone
      }));
      
      setStudents(mappedStudents);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive"
      });
    }
  };

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('exam_date', { ascending: false });

      if (error) throw error;
      
      // Map the data to match our interface, handling missing fields gracefully
      const mappedExams = (data || []).map((exam: any) => ({
        id: exam.id,
        title: exam.title || 'Untitled Exam',
        exam_date: exam.exam_date,
        max_marks: exam.max_marks || exam.total_marks || 100
      }));
      
      setExams(mappedExams);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch exams",
        variant: "destructive"
      });
    }
  };

  const generateTemplateMessage = () => {
    if (!selectedTemplate) return '';

    switch (selectedTemplate) {
      case 'EXAM_SCHEDULE':
        const exam = exams.find(e => e.id === selectedExam);
        if (exam) {
          const examDate = new Date(exam.exam_date).toLocaleDateString('en-IN');
          const examTime = new Date(exam.exam_date).toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          return MESSAGE_TEMPLATES.EXAM_SCHEDULE.template(exam.title, examDate, examTime);
        }
        return MESSAGE_TEMPLATES.EXAM_SCHEDULE.template('Sample Exam', '25/12/2024', '10:00 AM');
      
      case 'RESULT_UPDATE':
        return MESSAGE_TEMPLATES.RESULT_UPDATE.template('राहुल शर्मा', 'Mathematics Test', 85, 100);
      
      case 'REGISTRATION_CONFIRMATION':
        return MESSAGE_TEMPLATES.REGISTRATION_CONFIRMATION.template('प्रिया पाटील', 'Class 10-A');
      
      case 'CUSTOM_MARATHI':
        return MESSAGE_TEMPLATES.CUSTOM_MARATHI.template(customMessage || 'आपल्या अभ्यासाची प्रगती खूप चांगली आहे. पुढेही असेच चालू ठेवा!');
      
      case 'PARENT_NOTIFICATION':
        return MESSAGE_TEMPLATES.PARENT_NOTIFICATION.template('अनिल गुप्ता', customMessage || 'आपल्या मुलाची उपस्थिती कमी आहे. कृपया तात्काळ शाळेत भेटा.');
      
      default:
        return '';
    }
  };

  const generateAIMessage = async () => {
    if (!selectedStudents.length) {
      toast({
        title: "Warning",
        description: "Please select at least one student for AI message generation",
        variant: "destructive"
      });
      return;
    }

    setGeneratingAI(true);
    try {
      const student = students.find(s => s.id === selectedStudents[0]);
      if (!student) return;

      const context = {
        studentName: student.display_name,
        examTitle: selectedExam ? exams.find(e => e.id === selectedExam)?.title : undefined,
        customContext: customMessage
      };

      const message = await TwilioWhatsAppService.generateMarathiMessage(context);
      setAiGeneratedMessage(message);
      
      toast({
        title: "Success",
        description: "AI message generated successfully!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI message",
        variant: "destructive"
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testPhoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number for testing",
        variant: "destructive"
      });
      return;
    }

    if (!validateWhatsAppNumber(testPhoneNumber)) {
      toast({
        title: "Error",
        description: "Please enter a valid Indian mobile number (10 digits)",
        variant: "destructive"
      });
      return;
    }

    const message = aiGeneratedMessage || generateTemplateMessage() || customMessage;
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to send",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await TwilioWhatsAppService.sendWhatsAppMessage(
        testPhoneNumber,
        `🧪 *Test Message*\n\n${message}\n\n_This is a test message from EduGrowHub._`,
        userId
      );

      if (result.success) {
        toast({
          title: "✅ Test Message Sent!",
          description: `Message sent successfully to ${testPhoneNumber}`,
          variant: "default"
        });
      } else {
        toast({
          title: "❌ Failed to Send",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test message",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendBulkMessages = async () => {
    if (!selectedStudents.length) {
      toast({
        title: "Error",
        description: "Please select at least one student",
        variant: "destructive"
      });
      return;
    }

    const message = aiGeneratedMessage || generateTemplateMessage() || customMessage;
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message to send",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const recipients = selectedStudents
        .map(studentId => {
          const student = students.find(s => s.id === studentId);
          if (!student) return null;
          
          const phoneNumber = student.phone_number || student.parent_phone;
          if (!phoneNumber || !validateWhatsAppNumber(phoneNumber)) {
            return null;
          }

          return {
            phone: phoneNumber,
            message: message.replace('{student_name}', student.display_name),
            receiverId: student.id
          };
        })
        .filter(Boolean) as Array<{ phone: string; message: string; receiverId: string }>;

      if (!recipients.length) {
        toast({
          title: "Warning",
          description: "No valid phone numbers found for selected students",
          variant: "destructive"
        });
        return;
      }

      const result = await TwilioWhatsAppService.sendBulkMessages(recipients, userId);

      toast({
        title: "📱 Bulk Messages Sent",
        description: `${result.totalSent} messages sent successfully, ${result.totalFailed} failed`,
        variant: result.totalFailed === 0 ? "default" : "destructive"
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send bulk messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validStudentsCount = students.filter(s => 
    (s.phone_number && validateWhatsAppNumber(s.phone_number)) || 
    (s.parent_phone && validateWhatsAppNumber(s.parent_phone))
  ).length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          WhatsApp Messaging
          <Badge variant="secondary">
            {validStudentsCount} students with valid numbers
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose">Compose Message</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Send</TabsTrigger>
            <TabsTrigger value="test">Test Message</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template">Message Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MESSAGE_TEMPLATES).map(([key, template]) => (
                        <SelectItem key={key} value={key}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate === 'EXAM_SCHEDULE' && (
                  <div>
                    <Label htmlFor="exam">Select Exam</Label>
                    <Select value={selectedExam} onValueChange={setSelectedExam}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an exam" />
                      </SelectTrigger>
                      <SelectContent>
                        {exams.map(exam => (
                          <SelectItem key={exam.id} value={exam.id}>
                            {exam.title} - {new Date(exam.exam_date).toLocaleDateString('en-IN')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="custom-message">Custom Message</Label>
                  <Textarea
                    id="custom-message"
                    placeholder="Enter your custom message in Marathi or English..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={generateAIMessage} 
                  disabled={generatingAI || !selectedStudents.length}
                  className="w-full"
                  variant="outline"
                >
                  {generatingAI ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate AI Message in Marathi
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Message Preview</Label>
                  <div className="border rounded-lg p-4 bg-green-50 min-h-[200px] whitespace-pre-wrap">
                    {aiGeneratedMessage || generateTemplateMessage() || customMessage || 
                     'Select a template or enter a custom message to see preview...'}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Select students to send messages to. Only students with valid phone numbers will receive messages.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Select Students ({selectedStudents.length} selected)</Label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  <div className="flex gap-2 mb-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedStudents(students.map(s => s.id))}
                    >
                      Select All
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedStudents([])}
                    >
                      Clear All
                    </Button>
                  </div>
                  {students.map(student => {
                    const hasValidNumber = (student.phone_number && validateWhatsAppNumber(student.phone_number)) || 
                                         (student.parent_phone && validateWhatsAppNumber(student.parent_phone));
                    return (
                      <div key={student.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={student.id}
                          checked={selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                          disabled={!hasValidNumber}
                          className="rounded"
                        />
                        <label htmlFor={student.id} className={`text-sm flex-1 ${!hasValidNumber ? 'text-gray-400' : ''}`}>
                          {student.display_name} ({student.enrollment_no})
                          {hasValidNumber ? (
                            <CheckCircle className="h-3 w-3 text-green-500 inline ml-1" />
                          ) : (
                            <XCircle className="h-3 w-3 text-red-500 inline ml-1" />
                          )}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Message to Send</Label>
                <div className="border rounded-lg p-4 bg-blue-50 min-h-[240px] whitespace-pre-wrap text-sm">
                  {aiGeneratedMessage || generateTemplateMessage() || customMessage || 
                   'Configure your message in the Compose tab first...'}
                </div>
              </div>
            </div>

            <Button 
              onClick={sendBulkMessages} 
              disabled={loading || !selectedStudents.length}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Send to {selectedStudents.length} Students
            </Button>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <Alert>
              <TestTube className="h-4 w-4" />
              <AlertDescription>
                Send a test message to verify WhatsApp integration is working correctly.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="test-phone">Test Phone Number</Label>
                <Input
                  id="test-phone"
                  type="tel"
                  placeholder="Enter 10-digit mobile number (e.g., 9876543210)"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                />
                {testPhoneNumber && !validateWhatsAppNumber(testPhoneNumber) && (
                  <p className="text-red-500 text-sm mt-1">
                    Please enter a valid 10-digit Indian mobile number
                  </p>
                )}
              </div>

              <div>
                <Label>Test Message Preview</Label>
                <div className="border rounded-lg p-4 bg-yellow-50 whitespace-pre-wrap">
                  🧪 *Test Message*{'\n\n'}
                  {aiGeneratedMessage || generateTemplateMessage() || customMessage || 
                   'Hello! This is a test message from EduGrowHub WhatsApp integration.'}
                  {'\n\n'}_This is a test message from EduGrowHub._
                </div>
              </div>

              <Button 
                onClick={sendTestMessage} 
                disabled={loading || !testPhoneNumber || !validateWhatsAppNumber(testPhoneNumber)}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Test Message
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WhatsAppMessaging;
