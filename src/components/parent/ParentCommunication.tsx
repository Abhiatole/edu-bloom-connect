
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Bell, User } from 'lucide-react';

interface ParentCommunicationProps {
  studentId: string;
}

interface Message {
  id: string;
  from: string;
  fromType: 'teacher' | 'admin' | 'parent';
  message: string;
  timestamp: string;
  isRead: boolean;
}

export const ParentCommunication: React.FC<ParentCommunicationProps> = ({ studentId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Mock communication data
    const mockMessages: Message[] = [
      {
        id: '1',
        from: 'Ms. Johnson (Math Teacher)',
        fromType: 'teacher',
        message: 'Your child is showing excellent progress in algebra. Keep up the good work!',
        timestamp: '2024-01-15T10:30:00Z',
        isRead: true
      },
      {
        id: '2',
        from: 'Principal Smith',
        fromType: 'admin',
        message: 'Parent-teacher conference scheduled for next Friday at 3 PM.',
        timestamp: '2024-01-14T14:20:00Z',
        isRead: false
      },
      {
        id: '3',
        from: 'Dr. Wilson (Physics)',
        fromType: 'teacher',
        message: 'Please ensure your child completes the lab report assignment by Friday.',
        timestamp: '2024-01-13T09:15:00Z',
        isRead: true
      }
    ];

    const mockNotifications = [
      { id: '1', message: 'New grade posted for Mathematics', time: '2 hours ago' },
      { id: '2', message: 'Assignment due tomorrow', time: '1 day ago' },
      { id: '3', message: 'Parent-teacher meeting reminder', time: '2 days ago' }
    ];

    setMessages(mockMessages);
    setNotifications(mockNotifications);
  }, [studentId]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        from: 'You (Parent)',
        fromType: 'parent',
        message: newMessage,
        timestamp: new Date().toISOString(),
        isRead: true
      };
      setMessages([message, ...messages]);
      setNewMessage('');
    }
  };

  const getMessageIcon = (fromType: string) => {
    switch (fromType) {
      case 'teacher':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'admin':
        return <User className="h-4 w-4 text-purple-600" />;
      case 'parent':
        return <User className="h-4 w-4 text-green-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm">{notification.message}</span>
                <span className="text-xs text-muted-foreground">{notification.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Send Message */}
          <div className="space-y-3">
            <Textarea
              placeholder="Type your message to teachers..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={3}
            />
            <Button onClick={handleSendMessage} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>

          {/* Message List */}
          <div className="space-y-3">
            <h4 className="font-medium">Recent Messages</h4>
            {messages.map((message) => (
              <div key={message.id} className={`p-3 rounded-lg border ${
                !message.isRead ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' : 'bg-muted/50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getMessageIcon(message.fromType)}
                    <span className="font-medium text-sm">{message.from}</span>
                    {!message.isRead && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{message.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
