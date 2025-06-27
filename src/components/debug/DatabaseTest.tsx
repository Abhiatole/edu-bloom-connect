import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DatabaseTest = () => {
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    testDatabase();
  }, []);

  const testDatabase = async () => {
    const logs: string[] = [];
    
    try {
      // Test basic connection
      logs.push('Testing database connection...');
      
      // Test student_profiles table structure
      const { data: studentData, error: studentError } = await supabase
        .from('student_profiles')
        .select('*')
        .limit(1);
      
      if (studentError) {
        logs.push(`❌ student_profiles table error: ${studentError.message}`);
      } else {
        logs.push('✅ student_profiles table accessible');
        if (studentData && studentData.length > 0) {
          logs.push(`📋 student_profiles columns: ${Object.keys(studentData[0]).join(', ')}`);
        }
      }

      // Test user authentication
      logs.push('Testing user authentication...');
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        logs.push(`❌ Auth error: ${authError.message}`);
      } else {
        logs.push('✅ Auth service accessible');
        logs.push(`👤 Current user: ${authData.user ? authData.user.email || 'logged in' : 'not logged in'}`);
      }

      // Test signup function (without actually creating a user)
      logs.push('Testing signup function availability...');
      // We can't test signup without actually creating a user, so we'll just test if the function exists
      if (supabase.auth.signUp) {
        logs.push('✅ SignUp function available');
      } else {
        logs.push('❌ SignUp function not available');
      }

    } catch (error: any) {
      logs.push(`❌ Database test failed: ${error.message}`);
    }
    
    setResults(logs);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Database Connection Test</h2>
      <div className="space-y-2">
        {results.map((result, index) => (
          <div key={index} className="p-2 bg-gray-100 rounded font-mono text-sm">
            {result}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DatabaseTest;
