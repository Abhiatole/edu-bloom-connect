import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, School, BookOpen, TrendingUp, Plus, Settings, BarChart3, FileText, Bell, Shield } from 'lucide-react';
import UserManagement from '@/components/superadmin/UserManagement';
import PerformanceChart from '@/components/charts/PerformanceChart';
import GradeDistributionChart from '@/components/charts/GradeDistributionChart';
import PDFReportGenerator from '@/components/reports/PDFReportGenerator';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import AuditLogsViewer from '@/components/admin/AuditLogsViewer';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { title: 'Total Teachers', value: '24', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Total Students', value: '486', icon: School, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Active Courses', value: '12', icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Performance Rate', value: '94%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' }
  ];

  const performanceData = [
    { month: 'Jan', students: 420, teachers: 22, performance: 89 },
    { month: 'Feb', students: 435, teachers: 23, performance: 91 },
    { month: 'Mar', students: 458, teachers: 24, performance: 88 },
    { month: 'Apr', students: 472, teachers: 24, performance: 93 },
    { month: 'May', students: 486, teachers: 24, performance: 94 },
  ];

  const gradeData = [
    { grade: 'A+', count: 125, percentage: 25.7 },
    { grade: 'A', count: 98, percentage: 20.2 },
    { grade: 'B+', count: 87, percentage: 17.9 },
    { grade: 'B', count: 76, percentage: 15.6 },
    { grade: 'C+', count: 54, percentage: 11.1 },
    { grade: 'C', count: 32, percentage: 6.6 },
    { grade: 'D', count: 14, percentage: 2.9 },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'audit', label: 'Audit Logs', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your educational institution</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setActiveTab('users')}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Monthly overview of key metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart data={performanceData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Current semester grade breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <GradeDistributionChart data={gradeData} />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('users')}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('reports')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Reports
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('notifications')}>
                  <Bell className="h-4 w-4 mr-2" />
                  Send Notifications
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab('audit')}>
                  <Shield className="h-4 w-4 mr-2" />
                  View Audit Logs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Recent activities and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">New teacher registration pending approval</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Monthly performance report generated</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">System backup completed successfully</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'reports' && <PDFReportGenerator />}
      {activeTab === 'notifications' && <NotificationCenter />}
      {activeTab === 'audit' && <AuditLogsViewer />}
    </div>
  );
};

export default SuperAdminDashboard;
