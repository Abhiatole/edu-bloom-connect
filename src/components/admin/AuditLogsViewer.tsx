import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Eye, AlertCircle } from 'lucide-react';
interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  tableName: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}
const AuditLogsViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe',
      action: 'LOGIN',
      tableName: 'users',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Jane Smith',
      action: 'UPDATE',
      tableName: 'students',
      recordId: 'student123',
      oldValues: { grade: 'B+' },
      newValues: { grade: 'A-' },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      createdAt: '2024-01-15T11:15:00Z'
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Mike Johnson',
      action: 'CREATE',
      tableName: 'attendance',
      recordId: 'att456',
      newValues: { studentId: 'student123', status: 'present', date: '2024-01-15' },
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      createdAt: '2024-01-15T12:00:00Z'
    },
    {
      id: '4',
      userId: 'user1',
      userName: 'John Doe',
      action: 'DELETE',
      tableName: 'students',
      recordId: 'student456',
      oldValues: { name: 'Test Student', email: 'test@example.com' },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      createdAt: '2024-01-15T14:30:00Z'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');
  const actions = ['LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW'];
  const tables = ['users', 'students', 'attendance', 'class_schedule', 'notifications'];
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.tableName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesTable = tableFilter === 'all' || log.tableName === tableFilter;
    
    return matchesSearch && matchesAction && matchesTable;
  });
  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
      case 'VIEW':
        return 'bg-blue-100 text-blue-800';
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'DELETE':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Eye className="h-3 w-3" />;
    }
  };
  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Action', 'Table', 'Record ID', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.createdAt).toLocaleString(),
        log.userName,
        log.action,
        log.tableName,
        log.recordId || '',
        log.ipAddress
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-gray-600">Track all system activities and changes</p>
        </div>
        <Button onClick={exportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actions.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Table</label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {tables.map(table => (
                    <SelectItem key={table} value={table}>{table}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Results</label>
              <div className="text-sm text-gray-600 py-2">
                {filteredLogs.length} of {logs.length} logs
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>Chronological list of all system activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.map(log => (
              <div key={log.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge className={getActionColor(log.action)}>
                        {getActionIcon(log.action)}
                        <span className="ml-1">{log.action}</span>
                      </Badge>
                      
                      <span className="font-medium text-gray-900">{log.userName}</span>
                      
                      <span className="text-sm text-gray-500">
                        on table <code className="bg-gray-100 px-1 rounded">{log.tableName}</code>
                      </span>
                      
                      {log.recordId && (
                        <span className="text-sm text-gray-500">
                          (ID: {log.recordId})
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <strong>Timestamp:</strong> {new Date(log.createdAt).toLocaleString()}
                      </div>
                      <div>
                        <strong>IP Address:</strong> {log.ipAddress}
                      </div>
                      <div>
                        <strong>User Agent:</strong> {log.userAgent.substring(0, 50)}...
                      </div>
                    </div>
                    
                    {(log.oldValues || log.newValues) && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                        {log.oldValues && (
                          <div className="mb-2">
                            <strong>Old Values:</strong> 
                            <code className="ml-2 text-xs">{JSON.stringify(log.oldValues)}</code>
                          </div>
                        )}
                        {log.newValues && (
                          <div>
                            <strong>New Values:</strong> 
                            <code className="ml-2 text-xs">{JSON.stringify(log.newValues)}</code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No audit logs found matching the current filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default AuditLogsViewer;
