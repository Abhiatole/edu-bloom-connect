import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FinalRegistrationService } from '@/services/finalRegistrationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const RegistrationTest: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to test');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testBypassFunction = async () => {
    setLoading(true);
    setStatus('Testing bypass function...');
    
    try {
      // Test if the bypass function exists
      const { data, error } = await supabase.rpc('register_student_bypass', {
        p_user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        p_email: 'test@example.com',
        p_full_name: 'Test User',
        p_class_level: 11,
        p_parent_email: 'parent@example.com',
        p_parent_phone: '1234567890'
      });

      if (error) {
        setStatus(`❌ Bypass function error: ${error.message}`);
        setResults({ error: error.message, details: error });
      } else {
        setStatus('✅ Bypass function exists and responds');
        setResults({ success: true, data });
      }
    } catch (err: any) {
      setStatus(`💥 Test failed: ${err.message}`);
      setResults({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const testRegistrationFlow = async () => {
    setLoading(true);
    setStatus('Testing full registration flow...');
    
    try {
      const testData = {
        fullName: 'Test Student',
        email: `test.${Date.now()}@example.com`,
        password: 'TestPassword123!',
        classLevel: '11',
        parentMobile: '1234567890'
      };

      const result = await FinalRegistrationService.registerStudent(testData);
      
      if (result.success) {
        setStatus('✅ Registration test successful!');
        setResults(result);
      } else {
        setStatus(`❌ Registration test failed: ${result.message}`);
        setResults(result);
      }
    } catch (err: any) {
      setStatus(`💥 Registration test failed: ${err.message}`);
      setResults({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const checkRLSPolicies = async () => {
    setLoading(true);
    setStatus('Checking RLS policies...');
    
    try {
      // Check if we can query the student_profiles table
      const { data, error } = await supabase
        .from('student_profiles')
        .select('id, enrollment_no, status')
        .limit(1);

      if (error) {
        setStatus(`❌ RLS policies blocking: ${error.message}`);
        setResults({ error: error.message });
      } else {
        setStatus('✅ Can query student_profiles table');
        setResults({ success: true, sampleData: data });
      }
    } catch (err: any) {
      setStatus(`💥 RLS check failed: ${err.message}`);
      setResults({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Registration & RLS Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={testBypassFunction} 
            disabled={loading}
            variant="outline"
          >
            Test Bypass Function
          </Button>
          
          <Button 
            onClick={checkRLSPolicies} 
            disabled={loading}
            variant="outline"
          >
            Check RLS Policies
          </Button>
          
          <Button 
            onClick={testRegistrationFlow} 
            disabled={loading}
            variant="default"
          >
            Test Full Registration
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
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>First apply the <code>FINAL_REGISTRATION_FIX.sql</code> in Supabase SQL Editor</li>
            <li>Test the bypass function to ensure it exists</li>
            <li>Check RLS policies to ensure they're not blocking access</li>
            <li>Test the full registration flow</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};
