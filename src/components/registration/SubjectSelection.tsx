import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, AlertTriangle } from 'lucide-react';
import { SubjectService, Subject } from '@/services/subjectService';

interface SubjectSelectionProps {
  selectedSubjects: string[];
  onSubjectsChange: (subjects: string[]) => void;
  error?: string;
}

const SubjectSelection: React.FC<SubjectSelectionProps> = ({
  selectedSubjects,
  onSubjectsChange,
  error
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const data = await SubjectService.getAllSubjects();
      setSubjects(data);
    } catch (error) {
      // Handle error silently or show a toast
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    if (selectedSubjects.includes(subjectId)) {
      onSubjectsChange(selectedSubjects.filter(id => id !== subjectId));
    } else {
      onSubjectsChange([...selectedSubjects, subjectId]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-base font-medium">Select Subjects *</Label>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">Select Subjects *</Label>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Choose the subjects you want to enroll in. You must select at least one subject.
      </p>
      
      <Card className={error ? 'border-red-500' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Available Subjects ({subjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subjects.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No subjects available at the moment. Please contact the administrator.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className={`
                    flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors
                    ${selectedSubjects.includes(subject.id) 
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }
                  `}
                  onClick={() => handleSubjectToggle(subject.id)}
                >
                  <Checkbox
                    id={subject.id}
                    checked={selectedSubjects.includes(subject.id)}
                    onCheckedChange={() => handleSubjectToggle(subject.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={subject.id}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {subject.name}
                    </label>
                    {subject.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {subject.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedSubjects.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Selected Subjects ({selectedSubjects.length}):
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedSubjects.map((subjectId) => {
                  const subject = subjects.find(s => s.id === subjectId);
                  return subject ? (
                    <span
                      key={subjectId}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      {subject.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {selectedSubjects.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please select at least one subject to continue with your registration.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default SubjectSelection;
