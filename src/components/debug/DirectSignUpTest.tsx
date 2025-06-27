import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export const DirectSignUpTest: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    class: '11',
    batches: [] as string[],
    subjects: [] as string[]
  });
  
  const [status, setStatus] = useState<string>('Ready to test');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const batchOptions = ['NEET', 'JEE', 'CET', 'Boards'];
  const subjectOptions = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

  const handleBatchChange = (batch: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      batches: checked 
        ? [...prev.batches, batch]
        : prev.batches.filter(b => b !== batch)
    }));
  };

  const handleSubjectChange = (subject: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjects: checked 
        ? [...prev.subjects, subject]
        : prev.subjects.filter(s => s !== subject)
    }));
  };

  const testDirectSignUp = async () => {
    setLoading(true);
    setStatus('Testing direct supabase.auth.signUp() call...');
    
    try {
      console.log('🚀 Starting direct signup test with data:', formData);

      // Your exact signup call with arrays
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            student_class: formData.class,
            batches: formData.batches,     // This is an array like ['NEET', 'JEE']
            subjects: formData.subjects,   // This is an array like ['Physics', 'Chemistry']
          },
          emailRedirectTo: "http://localhost:8082/auth/confirm"
        }
      });

      if (error) {
        setStatus(`❌ Direct signup failed: ${error.message}`);
        setResults({ error: error.message, details: error });
        console.error('❌ Direct signup error:', error);
      } else {
        setStatus('✅ Direct signup successful!');
        setResults({ success: true, data, user: data.user });
        console.log('✅ Direct signup success:', data);
      }
    } catch (err: any) {
      setStatus(`💥 Direct signup failed: ${err.message}`);
      setResults({ error: err.message });
      console.error('💥 Direct signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testWithJsonStringArrays = async () => {
    setLoading(true);
    setStatus('Testing with JSON string arrays...');
    
    try {
      console.log('🚀 Starting signup test with JSON strings...');

      // Alternative approach: Convert arrays to JSON strings
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            student_class: formData.class,
            batches: JSON.stringify(formData.batches),
            subjects: JSON.stringify(formData.subjects),
          },
          emailRedirectTo: "http://localhost:8082/auth/confirm"
        }
      });

      if (error) {
        setStatus(`❌ JSON string signup failed: ${error.message}`);
        setResults({ error: error.message, details: error });
        console.error('❌ JSON string signup error:', error);
      } else {
        setStatus('✅ JSON string signup successful!');
        setResults({ success: true, data, user: data.user });
        console.log('✅ JSON string signup success:', data);
      }
    } catch (err: any) {
      setStatus(`💥 JSON string signup failed: ${err.message}`);
      setResults({ error: err.message });
      console.error('💥 JSON string signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Direct supabase.auth.signUp() Test</CardTitle>
        <p className="text-sm text-gray-600">
          Test the exact signup call you're using with batches and subjects arrays
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Password123!"
            />
          </div>

          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Test Student"
            />
          </div>

          <div>
            <Label htmlFor="class">Class</Label>
            <Input
              id="class"
              value={formData.class}
              onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
              placeholder="11"
            />
          </div>
        </div>

        <div>
          <Label className="text-base font-medium">Batches</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {batchOptions.map(batch => (
              <div key={batch} className="flex items-center space-x-2">
                <Checkbox
                  id={batch}
                  checked={formData.batches.includes(batch)}
                  onCheckedChange={(checked) => handleBatchChange(batch, !!checked)}
                />
                <Label htmlFor={batch}>{batch}</Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Selected: {JSON.stringify(formData.batches)}</p>
        </div>

        <div>
          <Label className="text-base font-medium">Subjects</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {subjectOptions.map(subject => (
              <div key={subject} className="flex items-center space-x-2">
                <Checkbox
                  id={subject}
                  checked={formData.subjects.includes(subject)}
                  onCheckedChange={(checked) => handleSubjectChange(subject, !!checked)}
                />
                <Label htmlFor={subject}>{subject}</Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Selected: {JSON.stringify(formData.subjects)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={testDirectSignUp} 
            disabled={loading || !formData.email || !formData.password}
            variant="default"
          >
            Test Direct Arrays
          </Button>
          
          <Button 
            onClick={testWithJsonStringArrays} 
            disabled={loading || !formData.email || !formData.password}
            variant="outline"
          >
            Test JSON Strings
          </Button>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Status:</div>
          <div className="text-sm bg-gray-100 p-2 rounded">{status}</div>
        </div>

        {results && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Results:</div>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p><strong>This test will help diagnose:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Whether arrays in user metadata cause the "Database error saving new user" error</li>
            <li>If converting arrays to JSON strings resolves the issue</li>
            <li>The exact error message and details from Supabase</li>
            <li>Whether the problem is with the metadata format or database constraints</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
