import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Send, Mail, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
interface Notification {
  id: string;
  userId: string;
  userName: string;
  type: 'email' | 'sms' | 'push';
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  createdAt: string;
}
const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe',
      type: 'email',
      title: 'Test Results Available',
      message: 'Your mathematics test results are now available.',
      status: 'sent',
      sentAt: '2024-01-15T10:30:00Z',
      createdAt: '2024-01-15T10:25:00Z'
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Jane Smith',
      type: 'sms',
      title: 'Attendance Alert',
      message: 'Please note that your attendance is below 80%.',
      status: 'pending',
      createdAt: '2024-01-15T11:00:00Z'
    }
  ]);
  const [newNotification, setNewNotification] = useState({
    type: 'email' as 'email' | 'sms' | 'push',
    recipients: 'all',
    title: '',
    message: ''
  });
  const sendNotification = () => {
    const notification: Notification = {
      id: Date.now().toString(),
      userId: 'broadcast',
      userName: 'System',
      type: newNotification.type,
      title: newNotification.title,
      message: newNotification.message,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setNotifications([notification, ...notifications]);
    setNewNotification({
      type: 'email',
      recipients: 'all',
      title: '',
      message: ''
    });
    // Simulate sending
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, status: 'sent' as const, sentAt: new Date().toISOString() }
            : n
        )
      );
    }, 2000);
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notification Center</h2>
          <p className="text-gray-600">Send emails, SMS, and push notifications to users</p>
        </div>
      </div>
      <Tabs defaultValue="send" className="space-y-6">
        <TabsList>
          <TabsTrigger value="send">Send Notification</TabsTrigger>
          <TabsTrigger value="history">Notification History</TabsTrigger>
        </TabsList>
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Send New Notification</span>
              </CardTitle>
              <CardDescription>
                Compose and send notifications to students, teachers, or administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Notification Type</Label>
                  <Select 
                    value={newNotification.type} 
                    onValueChange={(value: 'email' | 'sms' | 'push') => 
                      setNewNotification({...newNotification, type: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>Email</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>SMS</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="push">
                        <div className="flex items-center space-x-2">
                          <Bell className="h-4 w-4" />
                          <span>Push Notification</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select 
                    value={newNotification.recipients} 
                    onValueChange={(value) => 
                      setNewNotification({...newNotification, recipients: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="students">All Students</SelectItem>
                      <SelectItem value="teachers">All Teachers</SelectItem>
                      <SelectItem value="admins">Administrators</SelectItem>
                      <SelectItem value="class">Specific Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Notification title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Type your message here..."
                  rows={4}
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                />
              </div>
              <Button 
                onClick={sendNotification}
                disabled={!newNotification.title || !newNotification.message}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                Track all sent notifications and their delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.map(notification => (
                  <div key={notification.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge variant="outline" className="flex items-center space-x-1">
                            {getTypeIcon(notification.type)}
                            <span>{notification.type.toUpperCase()}</span>
                          </Badge>
                          
                          <Badge className={getStatusColor(notification.status)}>
                            {getStatusIcon(notification.status)}
                            <span className="ml-1">{notification.status}</span>
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-1">
                          {notification.title}
                        </h4>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Created: {new Date(notification.createdAt).toLocaleString()}</div>
                          {notification.sentAt && (
                            <div>Sent: {new Date(notification.sentAt).toLocaleString()}</div>
                          )}
                          {notification.userName !== 'System' && (
                            <div>Recipient: {notification.userName}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {notifications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No notifications sent yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default NotificationCenter;
