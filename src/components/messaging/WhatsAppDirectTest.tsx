import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const WhatsAppDirectTest = () => {
  const [phoneNumber, setPhoneNumber] = useState('+917057319481');
  const [message, setMessage] = useState('Test message from EduGrowHub! 🎓');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const { toast } = useToast();

  const testDirectTwilio = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Test 1: Check environment variables
      const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
      const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
      const whatsappNumber = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER;

      if (!accountSid || !authToken || !whatsappNumber) {
        throw new Error('Missing Twilio environment variables');
      }

      // Test 2: Try server API endpoint
      const serverResponse = await fetch('http://localhost:3001/api/send-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountSid,
          authToken,
          to: phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`,
          from: whatsappNumber,
          body: message
        })
      });

      if (!serverResponse.ok) {
        const errorText = await serverResponse.text();
        throw new Error(`Server API failed: ${serverResponse.status} - ${errorText}`);
      }

      const result = await serverResponse.json();

      if (result.error) {
        throw new Error(`Twilio API Error: ${result.error}`);
      }

      setTestResult(`✅ SUCCESS: Message sent via server API! SID: ${result.sid}`);
      toast({
        title: "WhatsApp Test Successful!",
        description: `Message sent successfully. Check your WhatsApp: ${phoneNumber}`,
      });

    } catch (error: any) {
      setTestResult(`❌ FAILED: ${error.message}`);
      
      // Test 3: Try direct Twilio API (for debugging)
      try {
        const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
        const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
        const whatsappNumber = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER;

        const auth = btoa(`${accountSid}:${authToken}`);
        const directResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`,
            From: whatsappNumber,
            Body: message
          })
        });

        if (directResponse.ok) {
          const directResult = await directResponse.json();
          setTestResult(`✅ SUCCESS via Direct API: ${directResult.sid}`);
          toast({
            title: "Direct Twilio API Success!",
            description: "Message sent via direct Twilio API",
          });
        } else {
          const errorText = await directResponse.text();
          setTestResult(`❌ Direct API also failed: ${directResponse.status} - ${errorText}`);
        }
      } catch (directError: any) {
        setTestResult(`❌ Both server and direct API failed: ${directError.message}`);
      }

      toast({
        title: "WhatsApp Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🧪 WhatsApp Direct Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number (with country code)</label>
          <Input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+919876543210"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Test Message</label>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Test message"
          />
        </div>

        <Button 
          onClick={testDirectTwilio} 
          disabled={testing || !phoneNumber.trim()}
          className="w-full"
        >
          {testing ? '🔄 Testing WhatsApp...' : '🚀 Send Test WhatsApp Message'}
        </Button>

        {testResult && (
          <Alert className={testResult.includes('SUCCESS') ? 'border-green-500' : 'border-red-500'}>
            <AlertDescription className="whitespace-pre-wrap">
              {testResult}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">🔍 Debug Information:</h3>
          <div className="text-sm space-y-1">
            <div>Account SID: {import.meta.env.VITE_TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}</div>
            <div>Auth Token: {import.meta.env.VITE_TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}</div>
            <div>WhatsApp Number: {import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || '❌ Missing'}</div>
            <div>Server Port 3001: {window.location.hostname}:3001</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppDirectTest;
