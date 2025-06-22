import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Updated Student interface to match the main component
interface Student {
  id: string;
  user_id?: string;
  enrollment_no?: string;
  class_level: number;
  display_name?: string; // This is a computed field, not in the database
}

interface MarkEntry {
  studentId: string;
  studentName: string;
  enrollmentNo?: string;
  marks: string;
}

interface ManualMarkUploadProps {
  students: Student[];
  examId: string;
  onSuccess: () => void;
}

const ManualMarkUpload: React.FC<ManualMarkUploadProps> = ({ students, examId, onSuccess }) => {
  console.log('ManualMarkUpload rendered with:', { 
    examId, 
    studentsCount: students.length,
    sampleStudents: students.slice(0, 3)
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [markEntries, setMarkEntries] = useState<MarkEntry[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  
  const { toast } = useToast();

  // Function to search students by display name or enrollment number
  const handleSearchStudents = (query: string) => {
    console.log('Searching for:', query);
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredStudents([]);
      return;
    }
    
    // Filter students by display_name or enrollment_no
    const filtered = students.filter(student => {
      const nameMatch = student.display_name?.toLowerCase().includes(query.toLowerCase());
      const enrollmentMatch = student.enrollment_no?.toLowerCase().includes(query.toLowerCase());
      const classMatch = selectedClass === 'all' || student.class_level.toString() === selectedClass;
      
      return (nameMatch || enrollmentMatch) && classMatch;
    });
    
    console.log('Found matches:', filtered.length);
    setFilteredStudents(filtered.slice(0, 10)); // Limit to first 10 results for performance
  };
  
  // Function to add a mark entry
  const addMarkEntry = (student: Student) => {
    console.log('Adding mark entry for student:', student);
    
    // Check if student already has an entry
    const existingEntryIndex = markEntries.findIndex(entry => entry.studentId === student.id);
    
    if (existingEntryIndex >= 0) {
      // Update existing entry
      console.log('Updating existing entry at index:', existingEntryIndex);
      const updatedEntries = [...markEntries];
      updatedEntries[existingEntryIndex] = {
        ...updatedEntries[existingEntryIndex],
        studentName: student.display_name || `Student-${student.id.substring(0, 8)}`,
        enrollmentNo: student.enrollment_no || ''
      };
      setMarkEntries(updatedEntries);
    } else {
      // Add new entry
      console.log('Adding new entry');
      setMarkEntries([
        ...markEntries,
        {
          studentId: student.id,
          studentName: student.display_name || `Student-${student.id.substring(0, 8)}`,
          enrollmentNo: student.enrollment_no || '',
          marks: '0'
        }
      ]);
    }
    
    // Clear search after adding
    setSearchQuery('');
    setFilteredStudents([]);
  };

  // Function to update mark for a student
  const updateMark = (studentId: string, marks: string) => {
    const updatedEntries = markEntries.map(entry => {
      if (entry.studentId === studentId) {
        return { ...entry, marks };
      }
      return entry;
    });
    
    setMarkEntries(updatedEntries);
  };

  // Function to remove a mark entry
  const removeMarkEntry = (studentId: string) => {
    const updatedEntries = markEntries.filter(entry => entry.studentId !== studentId);
    setMarkEntries(updatedEntries);
  };

  // Function to submit manual entries
  const submitManualEntries = async () => {
    if (markEntries.length === 0 || !examId) {
      toast({
        title: "Error",
        description: "Please add marks for at least one student and select an exam",
        variant: "destructive"
      });
      return;
    }
    
    // Set loading state
    setUploading(true);
    
    try {
      // Get current user ID for examiner_id field
      const { data: currentUser } = await supabase.auth.getUser();
      const examinerId = currentUser.user?.id;
      
      // Prepare results for insertion
      const results = markEntries.map(entry => ({
        exam_id: examId,
        student_id: entry.studentId,
        marks_obtained: parseInt(entry.marks) || 0,
        submitted_at: new Date().toISOString(),
        status: 'SUBMITTED', // Add status field
        examiner_id: examinerId // Add examiner_id field
      }));
      
      // Insert results
      const { error } = await supabase.from('exam_results').insert(results);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Marks for ${markEntries.length} students uploaded successfully`,
        variant: "default"
      });
      
      // Reset form
      setMarkEntries([]);
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting marks:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit marks",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <Label htmlFor="classFilter" className="mb-1 block">Filter by Class Level</Label>
        <Select 
          value={selectedClass} 
          onValueChange={setSelectedClass}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {[8, 9, 10, 11, 12].map((level) => (
              <SelectItem key={level} value={level.toString()}>
                Class {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4">
        <Label htmlFor="studentSearch">Search Student (by Name or Enrollment Number)</Label>
        <div className="flex gap-2 mb-2">
          <Input
            id="studentSearch"
            placeholder="Type name or enrollment number..."
            value={searchQuery}
            onChange={(e) => handleSearchStudents(e.target.value)}
          />
        </div>
        
        {/* Search Results */}
        {searchQuery && filteredStudents.length > 0 ? (
          <div className="border rounded-md mt-2 max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{student.id.substring(0, 8)}...</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium">{student.display_name}</div>
                      <div className="text-sm text-gray-500">{student.enrollment_no || 'No enrollment number'}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{student.class_level}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => addMarkEntry(student)}
                      >
                        Add
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : searchQuery ? (
          <div className="text-center py-4 text-gray-500">
            No students found matching your search
          </div>
        ) : null}
      </div>
      
      {/* Marks Entry Table */}
      <div className="border rounded-md p-4">
        <h3 className="text-lg font-medium mb-4">Mark Entries</h3>
        
        {markEntries.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No entries added yet. Search for students above.
          </div>
        ) : (
          <div className="space-y-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {markEntries.map((entry) => (
                  <tr key={entry.studentId}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                      {entry.studentName}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {entry.enrollmentNo || 'N/A'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Input
                        type="number"
                        min="0"
                        value={entry.marks}
                        onChange={(e) => updateMark(entry.studentId, e.target.value)}
                        className="w-20"
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeMarkEntry(entry.studentId)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="flex justify-end">
              <Button 
                onClick={submitManualEntries}
                disabled={uploading}
              >
                {uploading ? 'Submitting...' : 'Submit Marks'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualMarkUpload;
