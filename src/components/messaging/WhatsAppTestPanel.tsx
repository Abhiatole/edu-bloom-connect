import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, CheckCircle, Phone, TestTube } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { TwilioWhatsAppService, validateWhatsAppNumber } from '@/services/twilioWhatsAppService';

const WhatsAppTestPanel = () => {
  const { toast } = useToast();

  const testTwilioConnection = async () => {
    try {
      const result = await TwilioWhatsAppService.sendWhatsAppMessage(
        '+919876543210',
        '🧪 WhatsApp Integration Test\n\nThis is a test message from EduGrowHub to verify Twilio WhatsApp integration is working correctly.\n\nIf you receive this message, the integration is successful! 🎉',
        'test-user-id'
      );

      if (result.success) {
        toast({
          title: "✅ Test Successful!",
          description: "WhatsApp integration is working correctly",
          variant: "default"
        });
      } else {
        toast({
          title: "❌ Test Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test WhatsApp integration",
        variant: "destructive"
      });
    }
  };

  const testPhoneValidation = () => {
    const testNumbers = [
      '9876543210',
      '+919876543210',
      '919876543210',
      '123456789', // Invalid
      'abcd123456' // Invalid
    ];

    testNumbers.forEach(number => {
      const result = validateWhatsAppNumber(number);
      console.log(`Phone: ${number} -> Valid: ${result !== null} -> Formatted: ${result || 'Invalid'}`);
    });

    toast({
      title: "Phone Validation Test",
      description: "Check browser console for validation results",
      variant: "default"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            WhatsApp Integration Test Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertDescription>
              Use this panel to test WhatsApp messaging functionality. Make sure your Twilio credentials are configured in the .env file.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold">Environment Check</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {import.meta.env.VITE_TWILIO_ACCOUNT_SID ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-red-500" />
                  )}
                  <span className="text-sm">Twilio Account SID</span>
                  <Badge variant={import.meta.env.VITE_TWILIO_ACCOUNT_SID ? "default" : "destructive"}>
                    {import.meta.env.VITE_TWILIO_ACCOUNT_SID ? "Set" : "Missing"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {import.meta.env.VITE_TWILIO_AUTH_TOKEN ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-red-500" />
                  )}
                  <span className="text-sm">Twilio Auth Token</span>
                  <Badge variant={import.meta.env.VITE_TWILIO_AUTH_TOKEN ? "default" : "destructive"}>
                    {import.meta.env.VITE_TWILIO_AUTH_TOKEN ? "Set" : "Missing"}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-red-500" />
                  )}
                  <span className="text-sm">WhatsApp Number</span>
                  <Badge variant={import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER ? "default" : "destructive"}>
                    {import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER ? "Set" : "Missing"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Test Functions</h3>
              <div className="space-y-2">
                <Button 
                  onClick={testTwilioConnection} 
                  className="w-full" 
                  variant="outline"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Test WhatsApp Send
                </Button>
                
                <Button 
                  onClick={testPhoneValidation} 
                  className="w-full" 
                  variant="outline"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Test Phone Validation
                </Button>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Note:</strong> The test message will be sent to a demo number (+919876543210). 
              In production, replace this with actual phone numbers. The current implementation uses 
              a simulated Twilio client for demonstration purposes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppTestPanel;
