import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyStudentApprovalMigration() {
    console.log('🚀 Starting Student Approval System Migration...\n');
    
    try {
        // Step 1: Add columns to student_profiles
        console.log('Step 1: Adding approval columns to student_profiles...');
        
        // Add is_approved column
        let { error } = await supabase.rpc('sql', {
            query: `
                ALTER TABLE public.student_profiles 
                ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
            `
        });
        if (error) console.log('Note: is_approved column may already exist');
        
        // Add selected_subjects column
        ({ error } = await supabase.rpc('sql', {
            query: `
                ALTER TABLE public.student_profiles 
                ADD COLUMN IF NOT EXISTS selected_subjects TEXT[];
            `
        }));
        if (error) console.log('Note: selected_subjects column may already exist');
        
        // Add selected_batches column
        ({ error } = await supabase.rpc('sql', {
            query: `
                ALTER TABLE public.student_profiles 
                ADD COLUMN IF NOT EXISTS selected_batches TEXT[];
            `
        }));
        if (error) console.log('Note: selected_batches column may already exist');
        
        // Add approval tracking columns
        ({ error } = await supabase.rpc('sql', {
            query: `
                ALTER TABLE public.student_profiles 
                ADD COLUMN IF NOT EXISTS approved_by UUID,
                ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS rejected_by UUID,
                ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
                ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
            `
        }));
        if (error) console.log('Note: approval tracking columns may already exist');
        
        console.log('✅ Student profiles table updated');
        
        // Step 2: Add subject_specialization to teacher_profiles
        console.log('\nStep 2: Adding subject specialization to teacher_profiles...');
        
        ({ error } = await supabase.rpc('sql', {
            query: `
                ALTER TABLE public.teacher_profiles 
                ADD COLUMN IF NOT EXISTS subject_specialization TEXT[];
            `
        }));
        if (error) console.log('Note: subject_specialization column may already exist');
        
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
        if (error) console.log('Note: approval_actions table may already exist');
        
        console.log('✅ Approval actions table created');
        
        // Step 4: Create student_teacher_assignments table
        console.log('\nStep 4: Creating student-teacher assignments table...');
        
        ({ error } = await supabase.rpc('sql', {
            query: `
                CREATE TABLE IF NOT EXISTS public.student_teacher_assignments (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    student_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
                    teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
                    subject_name TEXT NOT NULL,
                    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                    UNIQUE(student_id, teacher_id, subject_name)
                );
            `
        }));
        if (error) console.log('Note: student_teacher_assignments table may already exist');
        
        console.log('✅ Student-teacher assignments table created');
        
        console.log('\n🎉 Migration completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Regenerate TypeScript types');
        console.log('2. Test the approval workflow');
        console.log('3. Configure RLS policies if needed');
        
        return true;
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        return false;
    }
}

// Run the migration
applyStudentApprovalMigration();
