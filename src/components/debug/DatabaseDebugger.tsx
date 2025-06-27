import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const DatabaseDebugger = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDatabaseOperations = async () => {
    setLoading(true);
    setResults([]);

    try {
      addResult('🔍 Testing database connection...');

      // Test 1: Check if we can read student_profiles table
      addResult('📋 Testing read access to student_profiles table...');
      const { data: readTest, error: readError } = await supabase
        .from('student_profiles')
        .select('id, enrollment_no, class_level, status')
        .limit(5);

      if (readError) {
        addResult(`❌ Read error: ${readError.message}`);
      } else {
        addResult(`✅ Read successful. Found ${readTest.length} existing records`);
        if (readTest.length > 0) {
          addResult(`📝 Sample record: ${JSON.stringify(readTest[0])}`);
        }
      }

      // Test 2: Check current user authentication
      addResult('👤 Testing current user authentication...');
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addResult(`❌ Auth error: ${authError.message}`);
      } else if (authUser.user) {
        addResult(`✅ User authenticated: ${authUser.user.email} (ID: ${authUser.user.id})`);
      } else {
        addResult('ℹ️ No user currently authenticated');
      }

      // Test 3: Try to insert a test record (we'll delete it right after)
      addResult('🧪 Testing insert access to student_profiles table...');
      
      const testProfileData = {
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        enrollment_no: `TEST${Date.now()}`,
        class_level: 11,
        parent_email: 'test@example.com',
        parent_phone: '1234567890',
        status: 'PENDING' as const
      };

      const { data: insertTest, error: insertError } = await supabase
        .from('student_profiles')
        .insert(testProfileData)
        .select()
        .single();

      if (insertError) {
        addResult(`❌ Insert error: ${insertError.message}`);
        addResult(`📋 Error details: ${JSON.stringify(insertError)}`);
      } else {
        addResult(`✅ Insert successful! Test record created with ID: ${insertTest.id}`);
        
        // Clean up: delete the test record
        const { error: deleteError } = await supabase
          .from('student_profiles')
          .delete()
          .eq('id', insertTest.id);
        
        if (deleteError) {
          addResult(`⚠️ Warning: Could not delete test record: ${deleteError.message}`);
        } else {
          addResult(`🧹 Test record cleaned up successfully`);
        }
      }

      // Test 4: Check table schema (skip for now since function doesn't exist)
      addResult('ℹ️ Schema check skipped (function not available in current database)');

    } catch (error: any) {
      addResult(`💥 Unexpected error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Database Debugger</h1>
      
      <Button 
        onClick={testDatabaseOperations} 
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Testing...' : 'Run Database Tests'}
      </Button>

      <div className="space-y-2">
        {results.map((result, index) => (
          <div 
            key={index} 
            className="p-2 bg-gray-100 rounded font-mono text-sm border-l-4 border-blue-400"
          >
            {result}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DatabaseDebugger;
