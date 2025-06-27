import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCurrentSchema() {
    console.log('🔍 Checking current database schema...\n');
    
    try {
        // First, let's see what tables exist
        console.log('1. Checking existing tables...');
        const { data: tables, error: tablesError } = await supabase
            .from('student_profiles')
            .select('*')
            .limit(1);
        
        if (tablesError) {
            console.error('❌ Error accessing student_profiles:', tablesError);
        } else {
            console.log('✅ Successfully accessed student_profiles table');
            if (tables && tables.length > 0) {
                console.log('📋 Current student_profiles columns:', Object.keys(tables[0]));
            }
        }
        
        // Check teacher profiles
        console.log('\n2. Checking teacher profiles...');
        const { data: teacherData, error: teacherError } = await supabase
            .from('teacher_profiles')
            .select('*')
            .limit(1);
        
        if (teacherError) {
            console.error('❌ Error accessing teacher_profiles:', teacherError);
        } else {
            console.log('✅ Successfully accessed teacher_profiles table');
            if (teacherData && teacherData.length > 0) {
                console.log('📋 Current teacher_profiles columns:', Object.keys(teacherData[0]));
            }
        }
        
        // Try to check if approval_actions table exists
        console.log('\n3. Checking approval_actions table...');
        const { data: approvalData, error: approvalError } = await supabase
            .from('approval_actions')
            .select('*')
            .limit(1);
        
        if (approvalError) {
            console.log('⚠️  approval_actions table not accessible:', approvalError.message);
        } else {
            console.log('✅ Successfully accessed approval_actions table');
        }
        
        // Test if we can create a simple student profile
        console.log('\n4. Testing student profile creation with basic fields...');
        
        const basicStudentData = {
            enrollment_no: 'TEST' + Date.now(),
            class_level: '10',
            parent_email: 'test@example.com',
            address: 'Test Address'
        };
        
        const { data: createResult, error: createError } = await supabase
            .from('student_profiles')
            .insert(basicStudentData)
            .select()
            .single();
        
        if (createError) {
            console.error('❌ Error creating basic student:', createError);
        } else {
            console.log('✅ Basic student created:', createResult?.id);
            
            // Clean up
            if (createResult?.id) {
                await supabase
                    .from('student_profiles')
                    .delete()
                    .eq('id', createResult.id);
                console.log('🧹 Test data cleaned up');
            }
        }
        
    } catch (error) {
        console.error('💥 Schema check failed:', error);
    }
}

// Run the check
checkCurrentSchema();
