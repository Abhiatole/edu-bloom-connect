
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

interface LinkedStudent {
  id: string;
  full_name: string;
  class_level: number;
  relationship: string;
}

interface StudentSelectorProps {
  students: LinkedStudent[];
  selectedStudent: string;
  onStudentChange: (studentId: string) => void;
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  students,
  selectedStudent,
  onStudentChange
}) => {
  const selectedStudentData = students.find(s => s.id === selectedStudent);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Select Child
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <Select value={selectedStudent} onValueChange={onStudentChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a child" />
              </SelectTrigger>
              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.full_name} (Class {student.class_level}) - {student.relationship}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedStudentData && (
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="font-medium">Class {selectedStudentData.class_level}</span>
              <span>•</span>
              <span className="capitalize">{selectedStudentData.relationship}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
