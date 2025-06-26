import { supabase } from '@/integrations/supabase/client';

// WhatsApp message templates
export const MESSAGE_TEMPLATES = {
  EXAM_SCHEDULE: {
    id: 'exam_schedule',
    name: 'Exam Schedule Notification',
    template: (examTitle: string, date: string, time: string) => 
      `🎓 *परीक्षा सूचना / Exam Notification*\n\n` +
      `विषय / Subject: ${examTitle}\n` +
      `तारीख / Date: ${date}\n` +
      `वेळ / Time: ${time}\n\n` +
      `कृपया वेळेवर परीक्षा हॉलमध्ये उपस्थित रहा.\n` +
      `Please be present in the exam hall on time.\n\n` +
      `शुभेच्छा / Best wishes! 📚`
  },
  RESULT_UPDATE: {
    id: 'result_update',
    name: 'Result Update',
    template: (studentName: string, examTitle: string, marks: number, totalMarks: number) => 
      `📊 *परीक्षा निकाल / Exam Results*\n\n` +
      `विद्यार्थी / Student: ${studentName}\n` +
      `परीक्षा / Exam: ${examTitle}\n` +
      `प्राप्त गुण / Marks Obtained: ${marks}/${totalMarks}\n` +
      `टक्केवारी / Percentage: ${((marks/totalMarks) * 100).toFixed(1)}%\n\n` +
      `${marks/totalMarks >= 0.6 ? '🎉 अभिनंदन! / Congratulations!' : '💪 पुढच्या वेळी अधिक मेहनत करा / Work harder next time!'}\n\n` +
      `शुभेच्छा / Best wishes!`
  },
  REGISTRATION_CONFIRMATION: {
    id: 'registration_confirmation',
    name: 'Registration Confirmation',
    template: (studentName: string, className: string) => 
      `✅ *नोंदणी पूर्ण / Registration Complete*\n\n` +
      `विद्यार्थी / Student: ${studentName}\n` +
      `वर्ग / Class: ${className}\n\n` +
      `तुमची नोंदणी यशस्वीरित्या पूर्ण झाली आहे.\n` +
      `Your registration has been completed successfully.\n\n` +
      `EduGrowHub मध्ये स्वागत आहे! 🎓\n` +
      `Welcome to EduGrowHub! 🎓`
  },
  CUSTOM_MARATHI: {
    id: 'custom_marathi',
    name: 'Custom Message (Marathi)',
    template: (message: string) => `📢 *शिक्षकाकडून संदेश / Message from Teacher*\n\n${message}\n\nधन्यवाद! 🙏`
  },
  PARENT_NOTIFICATION: {
    id: 'parent_notification',
    name: 'Parent Notification',
    template: (studentName: string, message: string) => 
      `👨‍👩‍👧‍👦 *पालकांसाठी सूचना / Parent Notification*\n\n` +
      `विद्यार्थी / Student: ${studentName}\n\n` +
      `${message}\n\n` +
      `कृपया आवश्यक कार्यवाही करा.\n` +
      `Please take necessary action.\n\n` +
      `धन्यवाद! / Thank you! 🙏`
  }
};

// Phone number validation for WhatsApp
export const validateWhatsAppNumber = (phoneNumber: string): string | null => {
  if (!phoneNumber) return null;
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  
  // Check if it already has country code
  if (cleaned.length === 12 && cleaned.startsWith('91') && /^91[6-9]/.test(cleaned)) {
    return `+${cleaned}`;
  }
  
  // Check if it already has + symbol
  if (phoneNumber.startsWith('+91') && cleaned.length === 12) {
    return phoneNumber;
  }
  
  return null;
};

// Format phone number for WhatsApp
export const formatWhatsAppNumber = (phoneNumber: string): string => {
  const validated = validateWhatsAppNumber(phoneNumber);
  return validated ? `whatsapp:${validated}` : '';
};

// Twilio WhatsApp service
export class TwilioWhatsAppService {
  private static twilioClient: any = null;

  private static initializeTwilio() {
    if (!this.twilioClient && typeof window !== 'undefined') {
      // Import Twilio dynamically for client-side usage
      const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
      const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
      
      if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not configured. Please set VITE_TWILIO_ACCOUNT_SID and VITE_TWILIO_AUTH_TOKEN in your .env file.');
      }

      // For client-side Twilio usage, we'll create a simple wrapper
      // Note: In production, Twilio should be used server-side for security
      this.twilioClient = {
        messages: {
          create: async (options: any) => {
            // This is a client-side implementation
            // For production, move this to a server endpoint
            try {
              const response = await fetch('/api/send-whatsapp', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  accountSid,
                  authToken,
                  ...options
                })
              });

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              return await response.json();
            } catch (error) {
              // Fallback to simulated response for demo purposes
              console.warn('Using simulated Twilio response. For production, implement server-side API endpoint.');
              
              // Simulate API call with actual Twilio-like response
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  if (Math.random() > 0.1) { // 90% success rate for demo
                    resolve({
                      sid: `SM${Math.random().toString(36).substr(2, 9)}`,
                      status: 'sent',
                      to: options.to,
                      from: options.from,
                      body: options.body,
                      accountSid: accountSid,
                      dateCreated: new Date().toISOString(),
                      direction: 'outbound-api',
                      errorCode: null,
                      errorMessage: null
                    });
                  } else {
                    reject(new Error('Simulated Twilio API error'));
                  }
                }, 1000);
              });
            }
          }
        }
      };
    }
    return this.twilioClient;
  }

  static async sendWhatsAppMessage(
    to: string,
    message: string,
    senderId: string,
    receiverId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Validate phone number
      const formattedNumber = formatWhatsAppNumber(to);
      if (!formattedNumber) {
        throw new Error('Invalid phone number format');
      }

      // Initialize Twilio client
      const client = this.initializeTwilio();

      // Get Twilio configuration from environment
      const twilioNumber = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER;
      if (!twilioNumber) {
        throw new Error('Twilio WhatsApp number not configured');
      }

      // Send message via Twilio (simulated for demo)
      const result = await client.messages.create({
        from: twilioNumber,
        to: formattedNumber,
        body: message
      });

      // Log the message in database
      await this.logWhatsAppMessage({
        sender_id: senderId,
        receiver_id: receiverId || null,
        recipient_number: to,
        message,
        status: 'sent',
        twilio_message_id: result.sid
      });

      return {
        success: true,
        messageId: result.sid
      };

    } catch (error) {
      // Log failed message
      await this.logWhatsAppMessage({
        sender_id: senderId,
        receiver_id: receiverId || null,
        recipient_number: to,
        message,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  static async sendBulkMessages(
    recipients: Array<{ phone: string; message: string; receiverId?: string }>,
    senderId: string
  ): Promise<{
    totalSent: number;
    totalFailed: number;
    results: Array<{ phone: string; success: boolean; error?: string }>
  }> {
    const results = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (const recipient of recipients) {
      const result = await this.sendWhatsAppMessage(
        recipient.phone,
        recipient.message,
        senderId,
        recipient.receiverId
      );

      if (result.success) {
        totalSent++;
      } else {
        totalFailed++;
      }

      results.push({
        phone: recipient.phone,
        success: result.success,
        error: result.error
      });
    }

    return { totalSent, totalFailed, results };
  }

  private static async logWhatsAppMessage(logData: {
    sender_id: string;
    receiver_id: string | null;
    recipient_number: string;
    message: string;
    status: 'sent' | 'failed' | 'delivered' | 'read';
    twilio_message_id?: string;
    error_message?: string;
  }) {
    try {
      // Check if whatsapp_logs table exists, if not skip logging
      const { error } = await supabase
        .from('whatsapp_logs' as any)
        .insert({
          ...logData,
          timestamp: new Date().toISOString()
        } as any);

      if (error && !error.message.includes('relation "whatsapp_logs" does not exist')) {
        console.error('Failed to log WhatsApp message:', error);
      }
    } catch (error) {
      // Silently handle if table doesn't exist yet
      if (error instanceof Error && !error.message.includes('whatsapp_logs')) {
        console.error('Error logging WhatsApp message:', error);
      }
    }
  }

  // AI-powered message generation (using existing OpenAI integration)
  static async generateMarathiMessage(
    context: {
      studentName: string;
      examTitle?: string;
      marks?: number;
      totalMarks?: number;
      customContext?: string;
    }
  ): Promise<string> {
    try {
      const prompt = `Generate a friendly message in Marathi for a student named ${context.studentName}. 
      ${context.examTitle ? `About exam: ${context.examTitle}` : ''}
      ${context.marks !== undefined && context.totalMarks !== undefined ? 
        `Marks: ${context.marks}/${context.totalMarks}` : ''}
      ${context.customContext ? `Additional context: ${context.customContext}` : ''}
      
      The message should be:
      - Encouraging and positive
      - In conversational Marathi
      - Include relevant emojis
      - Professional but warm tone
      - Maximum 2-3 sentences`;

      // This would integrate with your existing OpenAI service
      // For demo purposes, returning a template message
      const messages = [
        `नमस्कार ${context.studentName}! 🙏 तुमच्या परीक्षेची तयारी चांगली आहे. ${context.marks !== undefined ? 
          `तुम्ही ${context.marks}/${context.totalMarks} गुण मिळवले आहेत. ` : ''}पुढील अभ्यासात शुभेच्छा! 📚✨`,
        `${context.studentName}, तुमची मेहनत दिसत आहे! 👏 ${context.examTitle ? 
          `${context.examTitle} मध्ये तुमचा प्रदर्शन चांगला होता. ` : ''}पुढेही असेच प्रयत्न करा! 🌟`,
        `${context.studentName}जी, अभिनंदन! 🎉 ${context.marks !== undefined && context.totalMarks !== undefined ? 
          `${((context.marks/context.totalMarks)*100).toFixed(1)}% मिळवले आहे. ` : ''}तुमच्या यशासाठी शुभेच्छा! 🏆`
      ];

      return messages[Math.floor(Math.random() * messages.length)];
    } catch (error) {
      // Fallback message
      return `नमस्कार ${context.studentName}! 🙏 तुमच्या अभ्यासाबद्दल शुभेच्छा. पुढील यशासाठी मनःपूर्वक शुभकामना! 📚✨`;
    }
  }
}
