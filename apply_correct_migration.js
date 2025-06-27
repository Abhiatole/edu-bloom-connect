import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyCorrectMigration() {
    console.log('🚀 Applying Corrected Student Approval Migration...\n');
    
    try {
        // Step 1: Add missing columns to student_profiles (based on actual schema)
        console.log('Step 1: Adding approval columns to student_profiles...');
        
        // Add is_approved column
        let { error } = await supabase.rpc('sql', {
            query: `ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;`
        });
        if (error && !error.message.includes('already exists')) {
            console.error('Error adding is_approved:', error);
        }
        
        // Add selected_subjects column
        ({ error } = await supabase.rpc('sql', {
            query: `ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS selected_subjects TEXT[];`
        }));
        if (error && !error.message.includes('already exists')) {
            console.error('Error adding selected_subjects:', error);
        }
        
        // Add selected_batches column
        ({ error } = await supabase.rpc('sql', {
            query: `ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS selected_batches TEXT[];`
        }));
        if (error && !error.message.includes('already exists')) {
            console.error('Error adding selected_batches:', error);
        }
        
        console.log('✅ Student profiles table updated');
        
        // Step 2: Add subject_specialization to teacher_profiles (based on actual schema)
        console.log('\nStep 2: Adding subject specialization to teacher_profiles...');
        
        ({ error } = await supabase.rpc('sql', {
            query: `ALTER TABLE public.teacher_profiles ADD COLUMN IF NOT EXISTS subject_specialization TEXT[];`
        }));
        if (error && !error.message.includes('already exists')) {
            console.error('Error adding subject_specialization:', error);
        }
        
        console.log('✅ Teacher profiles table updated');
        
        // Step 3: Create approval_actions table
        console.log('\nStep 3: Creating approval actions tracking table...');
        
        ({ error } = await supabase.rpc('sql', {
            query: `
                CREATE TABLE IF NOT EXISTS public.approval_actions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
                    approver_id UUID NOT NULL,
                    approver_type TEXT NOT NULL CHECK (approver_type IN ('admin', 'teacher')),
                    action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
                    reason TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
                );
            `
        }));
        if (error && !error.message.includes('already exists')) {
            console.error('Error creating approval_actions:', error);
        }
        
        console.log('✅ Approval actions table created');
        
        // Step 4: Create indexes for performance
        console.log('\nStep 4: Creating performance indexes...');
        
        ({ error } = await supabase.rpc('sql', {
            query: `CREATE INDEX IF NOT EXISTS idx_student_profiles_approval ON public.student_profiles (is_approved, status);`
        }));
        if (error && !error.message.includes('already exists')) {
            console.error('Error creating approval index:', error);
        }
        
        ({ error } = await supabase.rpc('sql', {
            query: `CREATE INDEX IF NOT EXISTS idx_student_profiles_subjects ON public.student_profiles USING GIN (selected_subjects);`
        }));
        if (error && !error.message.includes('already exists')) {
            console.error('Error creating subjects index:', error);
        }
        
        console.log('✅ Performance indexes created');
        
        // Step 5: Enable RLS on approval_actions
        console.log('\nStep 5: Enabling RLS on approval_actions...');
        
        ({ error } = await supabase.rpc('sql', {
            query: `ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;`
        }));
        if (error && !error.message.includes('already enabled')) {
            console.error('Error enabling RLS:', error);
        }
        
        console.log('✅ RLS enabled on approval_actions');
        
        // Step 6: Test the migration by checking columns again
        console.log('\nStep 6: Verifying migration...');
        
        const { data: testData, error: testError } = await supabase
            .from('student_profiles')
            .select('*')
            .limit(1);
        
        if (testError) {
            console.error('❌ Error verifying migration:', testError);
        } else {
            console.log('✅ Migration verified successfully!');
            if (testData && testData.length > 0) {
                const columns = Object.keys(testData[0]);
                const newColumns = columns.filter(col => 
                    ['is_approved', 'selected_subjects', 'selected_batches'].includes(col)
                );
                console.log('📋 New columns found:', newColumns);
            }
        }
        
        console.log('\n🎉 Corrected migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Update TypeScript types to match actual schema');
        console.log('2. Update components to use correct column names');
        console.log('3. Test the approval workflow');
        
        return true;
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        return false;
    }
}

// Run the migration
applyCorrectMigration();
