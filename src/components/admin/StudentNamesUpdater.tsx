import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, UserCheck, RefreshCw } from 'lucide-react';

// Student data to update with the actual student names and enrollment numbers
const studentData = [
  { full_name: 'Ananya Sharma', enrollment_no: 'S1000' },
  { full_name: 'Raj Patel', enrollment_no: 'S1001' },
  { full_name: 'Priya Singh', enrollment_no: 'S1002' },
  { full_name: 'Vikram Mehta', enrollment_no: 'S1003' },
  { full_name: 'Neha Gupta', enrollment_no: 'S1004' },
  { full_name: 'Aditya Verma', enrollment_no: 'S1005' }
];

const StudentNamesUpdater = () => {
  const [loading, setLoading] = useState(false);
  const [studentProfiles, setStudentProfiles] = useState([]);
  const [updatedCount, setUpdatedCount] = useState(0);
  const { toast } = useToast();

  // Fetch current student profiles
  const fetchStudentProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('id, full_name, enrollment_no')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setStudentProfiles(data || []);
      
      toast({
        title: "Success",
        description: `Loaded ${data?.length || 0} student profiles.`,
      });
    } catch (error) {
      console.error('Error fetching student profiles:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load student profiles.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update student profiles with real names
  const updateStudentNames = async () => {
    if (studentProfiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please load student profiles first.",
      });
      return;
    }

    setLoading(true);
    setUpdatedCount(0);
    let successCount = 0;

    try {      // Note: We're assuming the enrollment_no column already exists or was added via SQL

      // Update each student with new data
      for (let i = 0; i < Math.min(studentProfiles.length, studentData.length); i++) {
        const student = studentProfiles[i];
        const newData = studentData[i];
        
        const { error: updateError } = await supabase
          .from('student_profiles')
          .update({ 
            full_name: newData.full_name,
            enrollment_no: newData.enrollment_no 
          })
          .eq('id', student.id);
        
        if (updateError) {
          console.error(`Error updating student ${student.id}:`, updateError);
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to update student ${i+1}.`,
          });
        } else {
          successCount++;
          setUpdatedCount(prev => prev + 1);
        }
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (successCount > 0) {
        toast({
          title: "Success",
          description: `Updated ${successCount} student profiles with real names and enrollment numbers.`,
        });
        
        // Refresh the list
        fetchStudentProfiles();
      }
    } catch (error) {
      console.error('Error updating student names:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update student names.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Student Names Updater
        </CardTitle>
        <CardDescription>
          Replace generic student names with real names and enrollment numbers
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="space-y-4">
          {studentProfiles.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment #</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Enrollment #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {studentProfiles.slice(0, studentData.length).map((student, index) => (
                    <tr key={student.id} className={index < updatedCount ? "bg-green-50 dark:bg-green-900/20" : ""}>
                      <td className="px-4 py-2 text-sm">
                        {student.full_name || 'Unknown'}
                      </td>
                      <td className="px-4 py-2 text-sm font-mono">
                        {student.enrollment_no || 'None'}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium">
                        {studentData[index].full_name}
                      </td>
                      <td className="px-4 py-2 text-sm font-mono">
                        {studentData[index].enrollment_no}
                      </td>
                    </tr>
                  ))}
                  
                  {studentProfiles.length > studentData.length && (
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-sm text-center text-gray-500">
                        + {studentProfiles.length - studentData.length} more students (will not be updated)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No student profiles loaded yet</p>
              <p className="text-sm mt-1">Click "Load Student Profiles" to begin</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/50 dark:to-indigo-950/50">
        <Button 
          variant="outline" 
          onClick={fetchStudentProfiles} 
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Load Student Profiles
        </Button>
        
        <Button 
          onClick={updateStudentNames} 
          disabled={loading || studentProfiles.length === 0}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserCheck className="h-4 w-4 mr-2" />
          )}
          Update Student Names
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StudentNamesUpdater;
