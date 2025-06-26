import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  Shield, Search, Filter, Download, AlertTriangle, 
  CheckCircle, XCircle, Clock, User, Globe 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
const SecurityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);  const [filters, setFilters] = useState({
    search: '',
    action: 'all',
    success: 'all',
    dateRange: undefined as DateRange | undefined
  });
  const [stats, setStats] = useState({
    totalLogs: 0,
    successfulActions: 0,
    failedActions: 0,
    uniqueUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  useEffect(() => {
    fetchSecurityLogs();
  }, []);
  useEffect(() => {
    applyFilters();
  }, [logs, filters]);
  const fetchSecurityLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      // Add mock data for demonstration
      const mockLogs = [
        {
          id: '1',
          user_id: 'user-1',
          action: 'LOGIN',
          resource: 'AUTH',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          success: true,
          created_at: new Date().toISOString(),
          metadata: { role: 'teacher' }
        },
        {
          id: '2',
          user_id: 'user-2',
          action: 'LOGIN_FAILED',
          resource: 'AUTH',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          success: false,
          error_message: 'Invalid credentials',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          metadata: { attempts: 3 }
        },
        {
          id: '3',
          user_id: 'user-1',
          action: 'CREATE_STUDENT',
          resource: 'STUDENTS',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          success: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          metadata: { student_id: 'student-123' }
        },
        {
          id: '4',
          user_id: 'user-3',
          action: 'DELETE_ATTENDANCE',
          resource: 'ATTENDANCE',
          ip_address: '10.0.0.5',
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
          success: false,
          error_message: 'Insufficient permissions',
          created_at: new Date(Date.now() - 10800000).toISOString(),
          metadata: { role: 'student' }
        },
        {
          id: '5',
          user_id: 'user-4',
          action: 'UPDATE_FEES',
          resource: 'FEES',
          ip_address: '172.16.0.10',
          user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
          success: true,
          created_at: new Date(Date.now() - 14400000).toISOString(),
          metadata: { amount: 1200 }
        }
      ];
      const allLogs = [...(data || []), ...mockLogs];
      setLogs(allLogs);
      // Calculate stats
      const stats = {
        totalLogs: allLogs.length,
        successfulActions: allLogs.filter(log => log.success).length,
        failedActions: allLogs.filter(log => !log.success).length,
        uniqueUsers: new Set(allLogs.map(log => log.user_id)).size
      };
      setStats(stats);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load security logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const applyFilters = () => {
    let filtered = [...logs];
    // Search filter
    if (filters.search) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.resource?.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.ip_address?.includes(filters.search) ||
        log.error_message?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }    // Action filter
    if (filters.action && filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action);
    }    // Success filter
    if (filters.success !== '' && filters.success !== 'all') {
      filtered = filtered.filter(log => log.success.toString() === filters.success);
    }
    // Date range filter
    if (filters.dateRange?.from) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.created_at);
        const fromDate = filters.dateRange!.from!;
        const toDate = filters.dateRange!.to || filters.dateRange!.from!;
        return logDate >= fromDate && logDate <= toDate;
      });
    }
    setFilteredLogs(filtered);
  };
  const exportLogs = () => {
    const csvHeaders = ['Timestamp', 'User ID', 'Action', 'Resource', 'IP Address', 'Success', 'Error Message'];
    const csvData = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.user_id || 'N/A',
      log.action,
      log.resource || 'N/A',
      log.ip_address || 'N/A',
      log.success ? 'Success' : 'Failed',
      log.error_message || 'N/A'
    ]);
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: "Security logs exported successfully"
    });
  };
  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <User className="h-4 w-4" />;
    if (action.includes('CREATE') || action.includes('UPDATE')) return <CheckCircle className="h-4 w-4" />;
    if (action.includes('DELETE')) return <XCircle className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };
  const getStatusColor = (success: boolean) => {
    return success 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };
  if (loading) {
    return <div className="flex justify-center p-8">Loading security logs...</div>;
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Audit Logs</h2>
          <p className="text-gray-600">Monitor system access and security events</p>
        </div>
        <Button onClick={exportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLogs}</p>
                <p className="text-sm text-gray-500">All time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Successful Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.successfulActions}</p>
                <p className="text-sm text-green-600">
                  {stats.totalLogs > 0 ? Math.round((stats.successfulActions / stats.totalLogs) * 100) : 0}% success rate
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Failed Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.failedActions}</p>
                <p className="text-sm text-red-600">Requires attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.uniqueUsers}</p>
                <p className="text-sm text-gray-500">Unique users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
          <CardDescription>Search and filter security events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Select onValueChange={(value) => setFilters({ ...filters, action: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGIN_FAILED">Login Failed</SelectItem>
                  <SelectItem value="CREATE_STUDENT">Create Student</SelectItem>
                  <SelectItem value="UPDATE_FEES">Update Fees</SelectItem>
                  <SelectItem value="DELETE_ATTENDANCE">Delete Attendance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="success">Status</Label>
              <Select onValueChange={(value) => setFilters({ ...filters, success: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Success</SelectItem>
                  <SelectItem value="false">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Range</Label>
              <DatePickerWithRange 
                date={filters.dateRange} 
                setDate={(range) => setFilters({ ...filters, dateRange: range })} 
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events ({filteredLogs.length})</CardTitle>
          <CardDescription>Chronological list of security events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${log.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    {getActionIcon(log.action)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{log.action}</h4>
                      <Badge className={getStatusColor(log.success)}>
                        {log.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {log.resource && `Resource: ${log.resource} • `}
                      User: {log.user_id || 'Unknown'}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                      <span className="flex items-center space-x-1">
                        <Globe className="h-3 w-3" />
                        <span>{log.ip_address}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </span>
                    </div>
                    {log.error_message && (
                      <p className="text-sm text-red-600 mt-1">Error: {log.error_message}</p>
                    )}
                  </div>
                </div>
                
                {log.metadata && (
                  <div className="text-right">
                    <pre className="text-xs text-gray-500 bg-gray-100 p-2 rounded max-w-xs overflow-hidden">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default SecurityLogs;
