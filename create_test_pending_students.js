import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestPendingStudents() {
    console.log('🧪 Creating Test Pending Students for Demo...\n');
    
    try {
        // First, let's change one existing approved student back to pending for testing
        console.log('1. Finding an approved student to make pending...');
        
        const { data: approvedStudents, error: fetchError } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('status', 'APPROVED')
            .limit(2);
        
        if (fetchError) {
            console.error('❌ Error fetching students:', fetchError);
            return;
        }
        
        if (approvedStudents && approvedStudents.length > 0) {
            console.log(`✅ Found ${approvedStudents.length} approved students`);
            
            // Change the first one to pending
            const studentToMakePending = approvedStudents[0];
            
            const { error: updateError } = await supabase
                .from('student_profiles')
                .update({
                    status: 'PENDING',
                    approved_by: null,
                    approval_date: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', studentToMakePending.id);
            
            if (updateError) {
                console.error('❌ Error updating student to pending:', updateError);
            } else {
                console.log('✅ Student made pending:', {
                    id: studentToMakePending.id,
                    name: studentToMakePending.full_name,
                    class: studentToMakePending.class_level
                });
            }
            
            // If there's a second student, make them pending too
            if (approvedStudents.length > 1) {
                const secondStudent = approvedStudents[1];
                
                const { error: update2Error } = await supabase
                    .from('student_profiles')
                    .update({
                        status: 'PENDING',
                        approved_by: null,
                        approval_date: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', secondStudent.id);
                
                if (update2Error) {
                    console.error('❌ Error updating second student to pending:', update2Error);
                } else {
                    console.log('✅ Second student made pending:', {
                        id: secondStudent.id,
                        name: secondStudent.full_name,
                        class: secondStudent.class_level
                    });
                }
            }
        }
        
        // Now check the pending students
        console.log('\n2. Checking current pending students...');
        
        const { data: pendingStudents, error: pendingError } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false });
        
        if (pendingError) {
            console.error('❌ Error fetching pending students:', pendingError);
        } else {
            console.log(`✅ Found ${pendingStudents?.length || 0} pending students`);
            
            if (pendingStudents && pendingStudents.length > 0) {
                console.log('\n📋 Pending Students List:');
                pendingStudents.forEach((student, index) => {
                    console.log(`${index + 1}. ${student.full_name} (Class ${student.class_level})`);
                    console.log(`   Email: ${student.email || student.parent_email}`);
                    console.log(`   Guardian: ${student.guardian_name} - ${student.guardian_mobile}`);
                    console.log(`   Enrollment: ${student.enrollment_no}`);
                    console.log(`   Created: ${new Date(student.created_at).toLocaleDateString()}`);
                    console.log('');
                });
            }
        }
        
        console.log('🎉 Test pending students setup completed!');
        console.log('\nYou can now:');
        console.log('1. Start the development server');
        console.log('2. Navigate to the admin dashboard');
        console.log('3. See the pending students in the approval system');
        console.log('4. Test the approve/reject functionality');
        
    } catch (error) {
        console.error('💥 Test setup failed:', error);
    }
}

// Run the setup
createTestPendingStudents();
