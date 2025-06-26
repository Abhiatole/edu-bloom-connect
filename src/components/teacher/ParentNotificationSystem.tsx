import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, MessageSquare, Phone, Users, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  enrollment_no: string;
  student_name: string;
  subject: string;
  marks_obtained: number;
  max_marks: number;
  percentage: number;
  feedback?: string;
  exam_name: string;
  created_at: string;
}
interface ParentNotificationSystemProps {
  examResults: ExamResult[];
  onNotificationSent: () => void;
}
interface MarathiMessage {
  message: string;
  tone: 'encouraging' | 'motivational' | 'neutral';
}
const ParentNotificationSystem: React.FC<ParentNotificationSystemProps> = ({ 
  examResults, 
  onNotificationSent 
}) => {
  const [selectedResult, setSelectedResult] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [messageType, setMessageType] = useState<'auto' | 'custom'>('auto');
  const { toast } = useToast();
  const generateMarathiMessage = async (result: ExamResult): Promise<string> => {
    // AI-generated Marathi message in rural/spoken style
    const percentage = result.percentage;
    const studentName = result.student_name;
    const subject = result.subject;
    const marks = result.marks_obtained;
    const maxMarks = result.max_marks;
    const examName = result.exam_name;
    let message = '';
    
    if (percentage >= 90) {
      message = `🌟 आपल्या ${studentName} ने ${subject} विषयात ${examName} मध्ये ${marks}/${maxMarks} गुण मिळवून ${percentage}% मिळवले आहेत. खूप छान! मुलगा/मुलगी खरोखर हुशार आहे. असेच चालू ठेवा. 👏`;
    } else if (percentage >= 75) {
      message = `👍 आपल्या ${studentName} ने ${subject} विषयात ${examName} मध्ये ${marks}/${maxMarks} गुण मिळवले आहेत (${percentage}%). चांगले काम केले आहे! अजून थोडा अभ्यास केल्यास १००% पण मिळू शकतात.`;
    } else if (percentage >= 60) {
      message = `📚 आपल्या ${studentName} ने ${subject} विषयात ${examName} मध्ये ${marks}/${maxMarks} गुण मिळवले आहेत (${percentage}%). ठीक आहे, पण अजून सुधारणा करता येईल. रोज थोडा वेळ अभ्यासाला द्या.`;
    } else if (percentage >= 40) {
      message = `💪 आपल्या ${studentName} ने ${subject} विषयात ${examName} मध्ये ${marks}/${maxMarks} गुण मिळवले आहेत (${percentage}%). अजून मेहनत लागेल. मुलाला प्रोत्साहन द्या आणि रोज अभ्यास करायला सांगा.`;
    } else {
      message = `🤝 आपल्या ${studentName} ने ${subject} विषयात ${examName} मध्ये ${marks}/${maxMarks} गुण मिळवले आहेत (${percentage}%). चिंता करू नका, अजून वेळ आहे. मुलाला शिक्षकांकडून मदत घ्यायला सांगा आणि अधिक अभ्यास करा.`;
    }
    // Add feedback if available
    if (result.feedback) {
      message += `\n\nशिक्षकांचे मत: ${result.feedback}`;
    }
    message += `\n\n- ${result.student_name} चे शिक्षक\nEduGrowHub शाळा`;
    return message;
  };
  const handleGenerateMessage = async () => {
    if (!selectedResult) {
      toast({
        title: "Selection Required",
        description: "Please select a student result first",
        variant: "destructive"
      });
      return;
    }
    setGenerating(true);
    try {
      const result = examResults.find(r => r.id === selectedResult);
      if (!result) throw new Error('Result not found');
      const message = await generateMarathiMessage(result);
      setGeneratedMessage(message);
      
      toast({
        title: "Message Generated",
        description: "Marathi message has been generated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate message",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };
  const handleSendMessage = async () => {
    if (!selectedResult || (!generatedMessage && !customMessage) || !phoneNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setSending(true);
    try {
      const result = examResults.find(r => r.id === selectedResult);
      if (!result) throw new Error('Result not found');
      const messageToSend = messageType === 'auto' ? generatedMessage : customMessage;
      // In a real implementation, integrate with WhatsApp Business API or SMS service
      // For now, we'll simulate the sending process
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Log the message (in production, this would be sent via SMS/WhatsApp)
      // Log the message (in production, this would be sent via SMS/WhatsApp)
      // In a real implementation, you would:
      // 1. Use WhatsApp Business API
      // 2. Use SMS service like Twilio, MSG91, etc.
      // 3. Save the notification to a database
      
      // For now, we'll just show success
      toast({
        title: "Message Sent",
        description: `Message sent successfully to ${phoneNumber}`,
      });
      // Reset form
      setSelectedResult('');
      setGeneratedMessage('');
      setCustomMessage('');
      setPhoneNumber('');
      onNotificationSent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  const handleBulkNotify = async () => {
    // Send notifications to all parents with recent results
    setSending(true);
    try {
      let sentCount = 0;
      const recentResults = examResults.slice(0, 10); // Limit to recent 10 results
      for (const result of recentResults) {
        try {
          const message = await generateMarathiMessage(result);
          
          // In production, send via SMS/WhatsApp API
          
          // Simulate delay
          await new Promise(resolve => setTimeout(resolve, 500));
          sentCount++;
          
        } catch (error) {
        }
      }
      toast({
        title: "Bulk Notifications Sent",
        description: `Sent notifications to ${sentCount} parents`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send bulk notifications",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Parent Communication</h3>
          <p className="text-muted-foreground">Send exam results to parents in Marathi</p>
        </div>
        <Button 
          onClick={handleBulkNotify} 
          disabled={sending || examResults.length === 0}
          variant="outline"
        >
          <Users className="h-4 w-4 mr-2" />
          Send Bulk Notifications
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Individual Message Sending */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Send Individual Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Student Selection */}
            <div>
              <Label htmlFor="student-result">Select Student Result *</Label>
              <Select value={selectedResult} onValueChange={setSelectedResult}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student result" />
                </SelectTrigger>
                <SelectContent>
                  {examResults.map(result => (
                    <SelectItem key={result.id} value={result.id}>
                      {result.student_name} - {result.exam_name} ({result.percentage}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Phone Number */}
            <div>
              <Label htmlFor="phone">Parent's Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 9876543210"
                  className="pl-10"
                />
              </div>
            </div>
            {/* Message Type Selection */}
            <div>
              <Label>Message Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={messageType === 'auto' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType('auto')}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI Generated
                </Button>
                <Button
                  type="button"
                  variant={messageType === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType('custom')}
                >
                  Custom Message
                </Button>
              </div>
            </div>
            {/* AI Generated Message */}
            {messageType === 'auto' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>AI Generated Marathi Message</Label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateMessage}
                    disabled={generating || !selectedResult}
                  >
                    {generating ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
                {generatedMessage && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <pre className="whitespace-pre-wrap font-sans">{generatedMessage}</pre>
                  </div>
                )}
              </div>
            )}
            {/* Custom Message */}
            {messageType === 'custom' && (
              <div>
                <Label htmlFor="custom-message">Custom Message (Marathi)</Label>
                <Textarea
                  id="custom-message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="तुमचा मुलगा/मुलगी ने परीक्षेत चांगले गुण मिळवले आहेत..."
                  rows={6}
                />
              </div>
            )}
            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={sending || !selectedResult || (!generatedMessage && !customMessage) || !phoneNumber}
              className="w-full"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {examResults.slice(0, 8).map(result => (
                <div key={result.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <div className="font-medium text-sm">{result.student_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {result.exam_name} • {result.subject}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Enrollment: {result.enrollment_no}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={result.percentage >= 75 ? 'default' : result.percentage >= 50 ? 'secondary' : 'destructive'}>
                      {result.percentage}%
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {result.marks_obtained}/{result.max_marks}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Sample Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Marathi Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-800 mb-2">Excellent Performance (90%+)</div>
              <div className="text-green-700">
                "🌟 आपल्या राहुल ने गणित विषयात मध्यावधी परीक्षेत 95/100 गुण मिळवून 95% मिळवले आहेत. खूप छान! मुलगा खरोखर हुशार आहे. असेच चालू ठेवा. 👏"
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-800 mb-2">Good Performance (75-89%)</div>
              <div className="text-blue-700">
                "👍 आपल्या प्रिया ने इंग्रजी विषयात 78/100 गुण मिळवले आहेत (78%). चांगले काम केले आहे! अजून थोडा अभ्यास केल्यास १००% पण मिळू शकतात."
              </div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <div className="font-medium text-yellow-800 mb-2">Average Performance (60-74%)</div>
              <div className="text-yellow-700">
                "📚 आपल्या अमित ने भौतिकशास्त्र विषयात 65/100 गुण मिळवले आहेत (65%). ठीक आहे, पण अजून सुधारणा करता येईल. रोज थोडा वेळ अभ्यासाला द्या."
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="font-medium text-orange-800 mb-2">Needs Improvement (Below 60%)</div>
              <div className="text-orange-700">
                "🤝 आपल्या सुमित्रा ने रसायनशास्त्र विषयात 45/100 गुण मिळवले आहेत (45%). चिंता करू नका, अजून वेळ आहे. मुलीला शिक्षकांकडून मदत घ्यायला सांगा."
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Information Alert */}
      <Alert>
        <MessageSquare className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium mb-1">Integration Required:</div>
          To send actual SMS/WhatsApp messages, integrate with services like:
          <ul className="list-disc list-inside mt-1 text-sm">
            <li>WhatsApp Business API</li>
            <li>Twilio SMS</li>
            <li>MSG91</li>
            <li>TextLocal</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
export default ParentNotificationSystem;
