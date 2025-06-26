import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StudentSelector } from './StudentSelector';
import { StudentPerformance } from './StudentPerformance';
import { FeeInformation } from './FeeInformation';
import { ParentCommunication } from './ParentCommunication';
import {
  Users,
  GraduationCap,
  CreditCard,
  MessageCircle,
  TrendingUp,
  Calendar,
  Bell
} from 'lucide-react';
interface ParentProfile {
  id: string;
  full_name: string;
  email: string;
}
interface LinkedStudent {
  id: string;
  full_name: string;
  class_level: number;
  relationship: string;
}
const ParentDashboard = () => {
  const [parentProfile, setParentProfile] = useState<ParentProfile | null>(null);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  useEffect(() => {
    fetchParentData();
  }, []);
  const fetchParentData = async () => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) throw new Error('Not authenticated');
      // This is a mock implementation since parent tables aren't in the current schema
      // In a real implementation, you would fetch from parent_profiles and parent_students tables
      
      const mockParentProfile = {
        id: currentUser.user.id,
        full_name: 'John Doe',
        email: currentUser.user.email || 'parent@example.com'
      };
      
      const mockLinkedStudents = [
        {
          id: '1',
          full_name: 'Alice Doe',
          class_level: 11,
          relationship: 'daughter'
        },
        {
          id: '2',
          full_name: 'Bob Doe',
          class_level: 9,
          relationship: 'son'
        }
      ];
      setParentProfile(mockParentProfile);
      setLinkedStudents(mockLinkedStudents);
      
      if (mockLinkedStudents.length > 0) {
        setSelectedStudent(mockLinkedStudents[0].id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load parent dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="p-3 bg-gradient-to-r from-green-500 to-teal-600 rounded-full">
            <Users className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Welcome, {parentProfile?.full_name}!
          </h1>
        </div>
        <p className="text-muted-foreground">
          Monitor your children's academic progress and stay connected
        </p>
        <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950">
          Parent Portal
        </Badge>
      </div>
      {/* Student Selector */}
      <StudentSelector
        students={linkedStudents}
        selectedStudent={selectedStudent}
        onStudentChange={setSelectedStudent}
      />
      {/* Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Linked Children</p>
                <p className="text-2xl font-bold text-green-600">{linkedStudents.length}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Exams</p>
                <p className="text-2xl font-bold text-blue-600">8</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Performance</p>
                <p className="text-2xl font-bold text-purple-600">87%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notifications</p>
                <p className="text-2xl font-bold text-orange-600">3</p>
              </div>
              <Bell className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Main Content */}
      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <StudentPerformance studentId={selectedStudent} />
          </div>
          
          <div className="space-y-6">
            <FeeInformation studentId={selectedStudent} />
            <ParentCommunication studentId={selectedStudent} />
          </div>
        </div>
      )}
    </div>
  );
};
export default ParentDashboard;
