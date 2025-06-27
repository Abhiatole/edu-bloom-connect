import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testApprovalSystem() {
    console.log('🧪 Testing Student Approval System...\n');
    
    try {
        // Test 1: Check if new columns exist in student_profiles
        console.log('1. Testing student_profiles table structure...');
        
        const { data: studentColumns, error: studentError } = await supabase.rpc('sql', {
            query: `
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'student_profiles' 
                AND column_name IN (
                    'is_approved', 'selected_subjects', 'selected_batches',
                    'approved_by', 'approval_date', 'rejected_by', 'rejected_at', 'rejection_reason'
                )
                ORDER BY column_name;
            `
        });
        
        if (studentError) {
            console.error('❌ Error checking student_profiles:', studentError);
        } else {
            console.log('✅ Student profiles new columns:', studentColumns || []);
        }
        
        // Test 2: Check if teacher_profiles has subject_specialization
        console.log('\n2. Testing teacher_profiles table structure...');
        
        const { data: teacherColumns, error: teacherError } = await supabase.rpc('sql', {
            query: `
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'teacher_profiles' 
                AND column_name = 'subject_specialization';
            `
        });
        
        if (teacherError) {
            console.error('❌ Error checking teacher_profiles:', teacherError);
        } else {
            console.log('✅ Teacher profiles new columns:', teacherColumns || []);
        }
        
        // Test 3: Check if new tables exist
        console.log('\n3. Testing new tables...');
        
        const { data: newTables, error: tablesError } = await supabase.rpc('sql', {
            query: `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('approval_actions', 'student_teacher_assignments')
                ORDER BY table_name;
            `
        });
        
        if (tablesError) {
            console.error('❌ Error checking new tables:', tablesError);
        } else {
            console.log('✅ New tables found:', newTables || []);
        }
        
        // Test 4: Check if functions exist
        console.log('\n4. Testing approval functions...');
        
        const { data: functions, error: functionsError } = await supabase.rpc('sql', {
            query: `
                SELECT routine_name 
                FROM information_schema.routines 
                WHERE routine_schema = 'public' 
                AND routine_name IN ('approve_student', 'reject_student')
                ORDER BY routine_name;
            `
        });
        
        if (functionsError) {
            console.error('❌ Error checking functions:', functionsError);
        } else {
            console.log('✅ Approval functions found:', functions || []);
        }
        
        // Test 5: Create a test pending student
        console.log('\n5. Testing student creation with new fields...');
        
        const testStudentData = {
            user_id: 'test-user-' + Date.now(),
            first_name: 'Test',
            last_name: 'Student',
            email: 'test@example.com',
            phone: '1234567890',
            grade: '10',
            school: 'Test School',
            parent_name: 'Test Parent',
            parent_phone: '0987654321',
            status: 'PENDING',
            is_approved: false,
            selected_subjects: ['Mathematics', 'Physics'],
            selected_batches: ['Batch A', 'Batch B']
        };
        
        const { data: insertResult, error: insertError } = await supabase
            .from('student_profiles')
            .insert(testStudentData)
            .select()
            .single();
        
        if (insertError) {
            console.error('❌ Error creating test student:', insertError);
        } else {
            console.log('✅ Test student created successfully:', insertResult?.id);
            
            // Clean up test data
            if (insertResult?.id) {
                await supabase
                    .from('student_profiles')
                    .delete()
                    .eq('id', insertResult.id);
                console.log('🧹 Test student cleaned up');
            }
        }
        
        console.log('\n🎉 Approval system test completed!');
        
    } catch (error) {
        console.error('💥 Test failed:', error);
    }
}

// Run the test
testApprovalSystem();
