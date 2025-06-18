import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, DollarSign, TrendingUp, UserPlus, Settings, BarChart3, Shield, Brain, Smartphone, UserCheck } from 'lucide-react';
import UserManagement from '@/components/superadmin/UserManagement';
import AttendanceManager from '@/components/attendance/AttendanceManager';
import TimetableManager from '@/components/schedule/TimetableManager';
import PDFReportGenerator from '@/components/reports/PDFReportGenerator';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import AuditLogsViewer from '@/components/admin/AuditLogsViewer';
import PerformancePrediction from '@/components/ai/PerformancePrediction';
import FeesManagement from '@/components/fees/FeesManagement';
import PushNotifications from '@/components/notifications/PushNotifications';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import SecurityLogs from '@/components/security/SecurityLogs';
import ParentPortal from '@/components/parent/ParentPortal';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { title: 'Total Users', value: '1,247', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active Classes', value: '45', icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Revenue', value: '$456K', icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Performance', value: '87%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'ai-insights', label: 'AI Insights', icon: Brain },
    { id: 'fees', label: 'Fees Management', icon: DollarSign },
    { id: 'parent-portal', label: 'Parent Portal', icon: UserCheck },
    { id: 'attendance', label: 'Attendance', icon: UserPlus },
    { id: 'timetable', label: 'Timetable', icon: BookOpen },
    { id: 'push', label: 'Push Alerts', icon: Smartphone },
    { id: 'notifications', label: 'Notifications', icon: Settings },
    { id: 'audit', label: 'Audit Logs', icon: Shield },
    { id: 'security', label: 'Security Logs', icon: Shield }
  ];

  const systemAlerts = [
    { type: 'warning', message: 'Server maintenance scheduled for tonight', time: '2 hours ago' },
    { type: 'info', message: 'New feature: AI Performance Prediction deployed', time: '1 day ago' },
    { type: 'error', message: '3 failed login attempts detected', time: '3 hours ago' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Complete system control with AI-powered insights and analytics</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setActiveTab('users')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('analytics')}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bg}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Access and Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Phase 3 Features</CardTitle>
                <CardDescription>Access new intelligent capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('analytics')}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Advanced Analytics Dashboard
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('ai-insights')}>
                  <Brain className="h-4 w-4 mr-2" />
                  AI Performance Predictions
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('parent-portal')}>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Parent Portal Management
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('fees')}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Online Fees Management
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('security')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Enhanced Security Logs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
                <CardDescription>Recent system notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {systemAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        alert.type === 'error' ? 'bg-red-500' :
                        alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                        <p className="text-xs text-gray-500">{alert.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && <AnalyticsDashboard />}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'ai-insights' && <PerformancePrediction />}
      {activeTab === 'fees' && <FeesManagement />}
      {activeTab === 'parent-portal' && <ParentPortal />}
      {activeTab === 'attendance' && <AttendanceManager />}
      {activeTab === 'timetable' && <TimetableManager />}
      {activeTab === 'push' && <PushNotifications />}
      {activeTab === 'notifications' && <NotificationCenter />}
      {activeTab === 'audit' && <AuditLogsViewer />}
      {activeTab === 'security' && <SecurityLogs />}
    </div>
  );
};

export default SuperAdminDashboard;
