import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DirectRegistrationTest = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('test123456');
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDirectRegistration = async () => {
    setLoading(true);
    setResults([]);

    try {
      addResult('🚀 Starting direct registration test...');

      // Step 1: Test auth signup only
      addResult('📝 Testing auth signup...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            role: 'student',
            full_name: 'Test Student',
            student_class: '11'
          }
        }
      });

      if (authError) {
        addResult(`❌ Auth error: ${authError.message}`);
        return;
      }

      addResult(`✅ Auth signup successful: ${authData.user?.id}`);
      addResult(`📧 Email confirmation required: ${!authData.session}`);

      if (authData.session) {
        // Step 2: Test profile creation directly
        addResult('📋 Testing profile creation...');
        
        const enrollmentNo = `TEST${Date.now()}`;
        const profileData = {
          user_id: authData.user!.id,
          enrollment_no: enrollmentNo,
          class_level: 11,
          parent_email: email,
          parent_phone: '1234567890',
          status: 'PENDING' as const
        };

        addResult(`📝 Profile data: ${JSON.stringify(profileData)}`);

        const { data: profileResult, error: profileError } = await supabase
          .from('student_profiles')
          .insert(profileData)
          .select()
          .single();

        if (profileError) {
          addResult(`❌ Profile error: ${profileError.message}`);
          addResult(`🔍 Error details: ${JSON.stringify(profileError)}`);
        } else {
          addResult(`✅ Profile created: ${profileResult.id}`);
          
          // Cleanup: delete the test profile and user
          await supabase.from('student_profiles').delete().eq('id', profileResult.id);
          addResult('🧹 Test profile cleaned up');
        }
      }

    } catch (error: any) {
      addResult(`💥 Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testRLSPolicies = async () => {
    setLoading(true);
    setResults([]);

    try {
      addResult('🔍 Testing RLS policies...');

      // Test 1: Check current user
      const { data: user } = await supabase.auth.getUser();
      addResult(`👤 Current user: ${user.user?.email || 'None'}`);

      // Test 2: Try direct insert with dummy data
      const testData = {
        user_id: '00000000-0000-0000-0000-000000000000',
        enrollment_no: `TEST${Date.now()}`,
        class_level: 11,
        parent_email: 'test@example.com',
        parent_phone: '1234567890',
        status: 'PENDING' as const
      };

      const { data, error } = await supabase
        .from('student_profiles')
        .insert(testData)
        .select();

      if (error) {
        addResult(`❌ RLS blocking insert: ${error.message}`);
        if (error.message.includes('policy')) {
          addResult('🔒 This confirms RLS policy is preventing inserts');
        }
      } else {
        addResult('✅ Insert allowed (cleaning up...)');
        if (data && data[0]) {
          await supabase.from('student_profiles').delete().eq('id', data[0].id);
        }
      }

    } catch (error: any) {
      addResult(`💥 Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Direct Registration Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Test Email:</label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Test Password:</label>
              <Input 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="test123456"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={testDirectRegistration} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Testing...' : 'Test Direct Registration'}
            </Button>
            <Button 
              onClick={testRLSPolicies} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? 'Testing...' : 'Test RLS Policies'}
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div 
                key={index} 
                className="p-2 bg-gray-100 rounded font-mono text-sm border-l-4 border-blue-400"
              >
                {result}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DirectRegistrationTest;
