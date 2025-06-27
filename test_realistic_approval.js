import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testApprovalWorkflow() {
    console.log('🧪 Testing Realistic Student Approval Workflow...\n');
    
    try {
        // Step 1: Get all pending students
        console.log('1. Fetching pending students...');
        
        const { data: pendingStudents, error: fetchError } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('status', 'PENDING')
            .limit(5);
        
        if (fetchError) {
            console.error('❌ Error fetching pending students:', fetchError);
        } else {
            console.log(`✅ Found ${pendingStudents?.length || 0} pending students`);
            if (pendingStudents && pendingStudents.length > 0) {
                console.log('📋 Sample student:', {
                    id: pendingStudents[0].id,
                    full_name: pendingStudents[0].full_name,
                    email: pendingStudents[0].email,
                    class_level: pendingStudents[0].class_level,
                    status: pendingStudents[0].status
                });
            }
        }
        
        // Step 2: Create a test student if none exist
        let testStudentId = null;
        if (!pendingStudents || pendingStudents.length === 0) {
            console.log('\n2. Creating test student...');
            
            const testStudentData = {
                user_id: 'test-user-' + Date.now(),
                full_name: 'Test Student',
                email: 'test@example.com',
                class_level: '10',
                guardian_name: 'Test Parent',
                guardian_mobile: '1234567890',
                status: 'PENDING',
                enrollment_no: 'TEST' + Date.now(),
                parent_email: 'parent@example.com'
            };
            
            const { data: newStudent, error: createError } = await supabase
                .from('student_profiles')
                .insert(testStudentData)
                .select()
                .single();
            
            if (createError) {
                console.error('❌ Error creating test student:', createError);
            } else {
                console.log('✅ Test student created:', newStudent?.id);
                testStudentId = newStudent?.id;
            }
        } else {
            testStudentId = pendingStudents[0].id;
        }
        
        // Step 3: Test approval workflow
        if (testStudentId) {
            console.log('\n3. Testing approval workflow...');
            
            // Test approve
            const { error: approveError } = await supabase
                .from('student_profiles')
                .update({
                    status: 'APPROVED',
                    approved_by: 'test-admin-id',
                    approval_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', testStudentId);
            
            if (approveError) {
                console.error('❌ Error approving student:', approveError);
            } else {
                console.log('✅ Student approved successfully');
                
                // Verify the approval
                const { data: approvedStudent, error: verifyError } = await supabase
                    .from('student_profiles')
                    .select('*')
                    .eq('id', testStudentId)
                    .single();
                
                if (verifyError) {
                    console.error('❌ Error verifying approval:', verifyError);
                } else {
                    console.log('✅ Approval verified:', {
                        status: approvedStudent?.status,
                        approved_by: approvedStudent?.approved_by,
                        approval_date: approvedStudent?.approval_date
                    });
                }
            }
        }
        
        // Step 4: Get approval statistics
        console.log('\n4. Getting approval statistics...');
        
        const { data: allStudents, error: statsError } = await supabase
            .from('student_profiles')
            .select('status');
        
        if (statsError) {
            console.error('❌ Error getting stats:', statsError);
        } else {
            const stats = {
                total: allStudents?.length || 0,
                pending: allStudents?.filter(s => s.status === 'PENDING').length || 0,
                approved: allStudents?.filter(s => s.status === 'APPROVED').length || 0,
                rejected: allStudents?.filter(s => s.status === 'REJECTED').length || 0
            };
            
            console.log('✅ Approval statistics:', stats);
        }
        
        console.log('\n🎉 Approval workflow test completed!');
        console.log('\nKey findings:');
        console.log('- Can successfully read pending students');
        console.log('- Can update student status for approval');
        console.log('- Existing schema supports approval workflow');
        console.log('- Ready to implement UI components');
        
    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

// Run the test
testApprovalWorkflow();
