
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Users, CalendarDays } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'present' | 'absent' | 'late';
}

const AttendanceManager = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  // Mock data - replace with real data from Supabase
  const students: Student[] = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@example.com' },
  ];

  const classes = [
    { id: 'math-101', name: 'Mathematics 101' },
    { id: 'eng-101', name: 'English 101' },
    { id: 'sci-101', name: 'Science 101' },
  ];

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => {
      const existing = prev.find(a => a.studentId === studentId);
      if (existing) {
        return prev.map(a => a.studentId === studentId ? { ...a, status } : a);
      }
      return [...prev, { studentId, status }];
    });
  };

  const getAttendanceStatus = (studentId: string) => {
    return attendance.find(a => a.studentId === studentId)?.status || 'present';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'absent': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'late': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const saveAttendance = () => {
    console.log('Saving attendance:', {
      date: selectedDate,
      class: selectedClass,
      attendance
    });
    // TODO: Save to Supabase
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-gray-600">Mark student attendance for classes</p>
        </div>
        <Button onClick={saveAttendance} disabled={!selectedClass}>
          Save Attendance
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar and Class Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5" />
              <span>Select Date & Class</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Students ({students.length})</span>
            </CardTitle>
            <CardDescription>
              Mark attendance for {selectedDate.toLocaleDateString()} 
              {selectedClass && ` - ${classes.find(c => c.id === selectedClass)?.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedClass ? (
              <div className="text-center py-8 text-gray-500">
                Please select a class to view students
              </div>
            ) : (
              <div className="space-y-3">
                {students.map(student => {
                  const status = getAttendanceStatus(student.id);
                  return (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(status)}>
                          {getStatusIcon(status)}
                          <span className="ml-1">{status}</span>
                        </Badge>
                        
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant={status === 'present' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student.id, 'present')}
                          >
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={status === 'late' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student.id, 'late')}
                          >
                            Late
                          </Button>
                          <Button
                            size="sm"
                            variant={status === 'absent' ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student.id, 'absent')}
                          >
                            Absent
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceManager;
