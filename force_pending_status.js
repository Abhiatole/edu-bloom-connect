import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function forcePendingStatus() {
    console.log('🔧 Forcing Pending Status for Testing...\n');
    
    try {
        // Get the first student
        const { data: students, error: fetchError } = await supabase
            .from('student_profiles')
            .select('*')
            .limit(1);
        
        if (fetchError) {
            console.error('❌ Error fetching students:', fetchError);
            return;
        }
        
        if (!students || students.length === 0) {
            console.log('❌ No students found');
            return;
        }
        
        const student = students[0];
        console.log('🎯 Target student:', {
            id: student.id,
            name: student.full_name,
            current_status: student.status
        });
        
        // Try to update just the status field
        console.log('\n1. Attempting to update status only...');
        const { data: updateResult, error: updateError } = await supabase
            .from('student_profiles')
            .update({ status: 'PENDING' })
            .eq('id', student.id)
            .select();
        
        if (updateError) {
            console.error('❌ Update error:', updateError);
            console.log('Error details:', {
                code: updateError.code,
                message: updateError.message,
                details: updateError.details,
                hint: updateError.hint
            });
        } else {
            console.log('✅ Update successful:', updateResult);
        }
        
        // Verify the update
        console.log('\n2. Verifying the update...');
        const { data: verifyData, error: verifyError } = await supabase
            .from('student_profiles')
            .select('id, full_name, status, updated_at')
            .eq('id', student.id)
            .single();
        
        if (verifyError) {
            console.error('❌ Verify error:', verifyError);
        } else {
            console.log('📋 Current student state:', verifyData);
        }
        
        // Check if there are any pending students now
        console.log('\n3. Checking for pending students...');
        const { data: pending, error: pendingError } = await supabase
            .from('student_profiles')
            .select('id, full_name, status')
            .eq('status', 'PENDING');
        
        if (pendingError) {
            console.error('❌ Pending check error:', pendingError);
        } else {
            console.log(`✅ Found ${pending?.length || 0} pending students:`, pending);
        }
        
    } catch (error) {
        console.error('💥 Force update failed:', error);
    }
}

// Run the force update
forcePendingStatus();
