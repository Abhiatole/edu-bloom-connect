
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, MapPin, User, BookOpen } from 'lucide-react';

interface ScheduleEntry {
  id: string;
  className: string;
  subject: string;
  teacher: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
}

const TimetableManager = () => {
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([
    {
      id: '1',
      className: 'Grade 10A',
      subject: 'Mathematics',
      teacher: 'Dr. Smith',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:30',
      room: 'Room 101'
    },
    {
      id: '2',
      className: 'Grade 10A',
      subject: 'English',
      teacher: 'Ms. Johnson',
      dayOfWeek: 1,
      startTime: '10:45',
      endTime: '12:15',
      room: 'Room 102'
    },
    {
      id: '3',
      className: 'Grade 10A',
      subject: 'Science',
      teacher: 'Dr. Wilson',
      dayOfWeek: 2,
      startTime: '09:00',
      endTime: '10:30',
      room: 'Lab 201'
    }
  ]);

  const [newEntry, setNewEntry] = useState<Partial<ScheduleEntry>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'
  ];

  const teachers = [
    'Dr. Smith', 'Ms. Johnson', 'Dr. Wilson', 'Prof. Brown', 'Ms. Davis'
  ];

  const subjects = [
    'Mathematics', 'English', 'Science', 'History', 'Geography', 'Physics', 'Chemistry', 'Biology'
  ];

  const addScheduleEntry = () => {
    if (newEntry.className && newEntry.subject && newEntry.teacher && 
        newEntry.dayOfWeek && newEntry.startTime && newEntry.endTime) {
      const entry: ScheduleEntry = {
        id: Date.now().toString(),
        className: newEntry.className!,
        subject: newEntry.subject!,
        teacher: newEntry.teacher!,
        dayOfWeek: newEntry.dayOfWeek!,
        startTime: newEntry.startTime!,
        endTime: newEntry.endTime!,
        room: newEntry.room || ''
      };
      
      setScheduleEntries([...scheduleEntries, entry]);
      setNewEntry({});
      setIsDialogOpen(false);
    }
  };

  const getDayName = (dayNumber: number) => {
    return daysOfWeek.find(d => d.value === dayNumber)?.label || '';
  };

  const getEntriesForDay = (day: number) => {
    return scheduleEntries
      .filter(entry => entry.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Timetable</h2>
          <p className="text-gray-600">Manage class schedules and time slots</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Class Schedule</DialogTitle>
              <DialogDescription>
                Create a new class schedule entry
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input
                  placeholder="e.g., Grade 10A"
                  value={newEntry.className || ''}
                  onChange={(e) => setNewEntry({...newEntry, className: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={newEntry.subject} onValueChange={(value) => setNewEntry({...newEntry, subject: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select value={newEntry.teacher} onValueChange={(value) => setNewEntry({...newEntry, teacher: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select value={newEntry.dayOfWeek?.toString()} onValueChange={(value) => setNewEntry({...newEntry, dayOfWeek: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map(day => (
                      <SelectItem key={day.value} value={day.value.toString()}>{day.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select value={newEntry.startTime} onValueChange={(value) => setNewEntry({...newEntry, startTime: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select value={newEntry.endTime} onValueChange={(value) => setNewEntry({...newEntry, endTime: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Room (Optional)</Label>
                <Input
                  placeholder="e.g., Room 101"
                  value={newEntry.room || ''}
                  onChange={(e) => setNewEntry({...newEntry, room: e.target.value})}
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={addScheduleEntry} className="flex-1">Add Class</Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Weekly Timetable View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {daysOfWeek.map(day => (
          <Card key={day.value} className="min-h-[400px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-center">{day.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {getEntriesForDay(day.value).map(entry => (
                <div key={entry.id} className="p-3 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1 text-sm">
                      <Clock className="h-3 w-3 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        {entry.startTime} - {entry.endTime}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm">
                      <BookOpen className="h-3 w-3 text-gray-600" />
                      <span className="font-medium text-gray-800">{entry.subject}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-sm">
                      <User className="h-3 w-3 text-gray-600" />
                      <span className="text-gray-600">{entry.teacher}</span>
                    </div>
                    
                    {entry.room && (
                      <div className="flex items-center space-x-1 text-sm">
                        <MapPin className="h-3 w-3 text-gray-600" />
                        <span className="text-gray-600">{entry.room}</span>
                      </div>
                    )}
                    
                    <Badge variant="secondary" className="text-xs">
                      {entry.className}
                    </Badge>
                  </div>
                </div>
              ))}
              
              {getEntriesForDay(day.value).length === 0 && (
                <div className="text-center text-gray-400 py-8 text-sm">
                  No classes scheduled
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TimetableManager;
