import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Clock, FileText, Users, CheckCircle } from 'lucide-react';
import { SubjectService } from '@/services/subjectService';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TeacherNotificationsProps {
  teacherUserId: string;
  onNavigateToTab?: (tab: string) => void;
}

interface NotificationData {
  pendingApprovals: number;
  pendingGrading: number;
  totalStudents: number;
  recentActivities: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

const TeacherNotifications: React.FC<TeacherNotificationsProps> = ({ 
  teacherUserId, 
  onNavigateToTab 
}) => {
  const [notifications, setNotifications] = useState<NotificationData>({
    pendingApprovals: 0,
    pendingGrading: 0,
    totalStudents: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teacherUserId) {
      fetchNotifications();
      
      // Set up periodic refresh
      const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [teacherUserId]);

  const fetchNotifications = async () => {
    try {
      const data = await SubjectService.getTeacherNotifications(teacherUserId);
      setNotifications(data);
    } catch (error) {
      // Silently handle errors in notifications
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'approval':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'grading':
        return <FileText className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasNotifications = notifications.pendingApprovals > 0 || 
                          notifications.pendingGrading > 0 || 
                          notifications.recentActivities.length > 0;

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" 
              onClick={() => onNavigateToTab?.('approvals')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approvals</p>
                <p className="text-2xl font-bold text-blue-600">
                  {notifications.pendingApprovals}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            {notifications.pendingApprovals > 0 && (
              <Badge className="mt-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Action Required
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onNavigateToTab?.('results')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Grading</p>
                <p className="text-2xl font-bold text-orange-600">
                  {notifications.pendingGrading}
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
            {notifications.pendingGrading > 0 && (
              <Badge className="mt-2 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Needs Feedback
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.totalStudents}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              In Your Subjects
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasNotifications ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                🎉 All caught up! No pending notifications at the moment.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {notifications.recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                  {activity.type === 'approval' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onNavigateToTab?.('approvals')}
                    >
                      Review
                    </Button>
                  )}
                  {activity.type === 'grading' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onNavigateToTab?.('results')}
                    >
                      Grade
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {hasNotifications && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {notifications.pendingApprovals > 0 && (
                <Button 
                  size="sm" 
                  onClick={() => onNavigateToTab?.('approvals')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Review Student Approvals ({notifications.pendingApprovals})
                </Button>
              )}
              {notifications.pendingGrading > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onNavigateToTab?.('results')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Feedback ({notifications.pendingGrading})
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onNavigateToTab?.('exams')}
              >
                Create New Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherNotifications;
