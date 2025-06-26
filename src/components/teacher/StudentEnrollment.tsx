import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, BookOpen, UserPlus } from 'lucide-react';
const StudentEnrollment = () => {
  const [students, setStudents] = useState([
    { id: 1, name: 'Mike Johnson', email: 'mike@student.com', class: 'Grade 10A', subjects: ['Math', 'Physics'] },
    { id: 2, name: 'Emma Davis', email: 'emma@student.com', class: 'Grade 10B', subjects: ['Math', 'Chemistry'] },
    { id: 3, name: 'Alex Brown', email: 'alex@student.com', class: 'Grade 9A', subjects: ['Math'] }
  ]);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [enrollData, setEnrollData] = useState({
    studentName: '',
    studentEmail: '',
    class: '',
    subject: ''
  });
  const { toast } = useToast();
  const subjects = ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'History'];
  const classes = ['Grade 9A', 'Grade 9B', 'Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 11B'];
  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData.studentName || !enrollData.studentEmail || !enrollData.class || !enrollData.subject) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    const existingStudent = students.find(s => s.email === enrollData.studentEmail);
    
    if (existingStudent) {
      // Add subject to existing student
      const updatedStudents = students.map(student =>
        student.id === existingStudent.id
          ? { ...student, subjects: [...new Set([...student.subjects, enrollData.subject])] }
          : student
      );
      setStudents(updatedStudents);
    } else {
      // Create new student
      const newStudent = {
        id: students.length + 1,
        name: enrollData.studentName,
        email: enrollData.studentEmail,
        class: enrollData.class,
        subjects: [enrollData.subject]
      };
      setStudents([...students, newStudent]);
    }
    setEnrollData({ studentName: '', studentEmail: '', class: '', subject: '' });
    setShowEnrollForm(false);
    toast({
      title: "Success",
      description: "Student enrolled successfully"
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Enrollment</h2>
          <p className="text-gray-600">Enroll students in your subjects</p>
        </div>
        <Button onClick={() => setShowEnrollForm(!showEnrollForm)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Enroll Student
        </Button>
      </div>
      {showEnrollForm && (
        <Card>
          <CardHeader>
            <CardTitle>Enroll New Student</CardTitle>
            <CardDescription>Add a student to your subject</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEnrollStudent} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name</Label>
                  <Input
                    id="studentName"
                    value={enrollData.studentName}
                    onChange={(e) => setEnrollData({...enrollData, studentName: e.target.value})}
                    placeholder="Enter student name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Student Email</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    value={enrollData.studentEmail}
                    onChange={(e) => setEnrollData({...enrollData, studentEmail: e.target.value})}
                    placeholder="Enter student email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select value={enrollData.class} onValueChange={(value) => setEnrollData({...enrollData, class: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={enrollData.subject} onValueChange={(value) => setEnrollData({...enrollData, subject: value})}>
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
              </div>
              <div className="flex space-x-3">
                <Button type="submit">Enroll Student</Button>
                <Button type="button" variant="outline" onClick={() => setShowEnrollForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Enrolled Students ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{student.name}</h4>
                      <p className="text-sm text-gray-600">{student.class}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {student.subjects.map((subject, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Subject Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjects.map((subject) => {
                const count = students.filter(s => s.subjects.includes(subject)).length;
                return (
                  <div key={subject} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{subject}</span>
                    <span className="text-sm text-gray-600">{count} students</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default StudentEnrollment;
