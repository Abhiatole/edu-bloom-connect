import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugStudentStatuses() {
    console.log('🔍 Debugging Student Statuses...\n');
    
    try {
        // Get all students and their statuses
        const { data: allStudents, error } = await supabase
            .from('student_profiles')
            .select('id, full_name, status, class_level, created_at, updated_at')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Error fetching students:', error);
            return;
        }
        
        console.log(`📊 Total students found: ${allStudents?.length || 0}`);
        
        if (allStudents && allStudents.length > 0) {
            // Group by status
            const statusGroups = allStudents.reduce((acc, student) => {
                const status = student.status || 'NULL';
                if (!acc[status]) acc[status] = [];
                acc[status].push(student);
                return acc;
            }, {});
            
            console.log('\n📋 Students by status:');
            Object.entries(statusGroups).forEach(([status, students]) => {
                console.log(`\n${status}: ${students.length} students`);
                students.forEach((student, index) => {
                    console.log(`  ${index + 1}. ${student.full_name} (Class ${student.class_level})`);
                    console.log(`     Updated: ${new Date(student.updated_at).toLocaleString()}`);
                });
            });
            
            // Test different status queries
            console.log('\n🧪 Testing different status queries...');
            
            // Test exact PENDING
            const { data: pendingExact } = await supabase
                .from('student_profiles')
                .select('id, full_name, status')
                .eq('status', 'PENDING');
            console.log(`- Exact 'PENDING': ${pendingExact?.length || 0} students`);
            
            // Test lowercase pending
            const { data: pendingLower } = await supabase
                .from('student_profiles')
                .select('id, full_name, status')
                .eq('status', 'pending');
            console.log(`- Exact 'pending': ${pendingLower?.length || 0} students`);
            
            // Test case insensitive
            const { data: pendingIlike } = await supabase
                .from('student_profiles')
                .select('id, full_name, status')
                .ilike('status', 'pending');
            console.log(`- Case insensitive 'pending': ${pendingIlike?.length || 0} students`);
            
            // Test in array
            const { data: pendingArray } = await supabase
                .from('student_profiles')
                .select('id, full_name, status')
                .in('status', ['PENDING', 'pending', 'Pending']);
            console.log(`- In array ['PENDING', 'pending', 'Pending']: ${pendingArray?.length || 0} students`);
        }
        
        console.log('\n🎯 Recommendation:');
        console.log('Check the exact status values and update the query accordingly');
        
    } catch (error) {
        console.error('💥 Debug failed:', error);
    }
}

// Run the debug
debugStudentStatuses();
