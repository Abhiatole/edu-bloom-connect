import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function generateUpdatedTypes() {
    console.log('🔄 Generating updated TypeScript types...\n');
    
    try {
        // Get table information using SQL query
        const { data: tables, error: tablesError } = await supabase.rpc('sql', {
            query: `
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            `
        });
        
        if (tablesError) {
            console.error('❌ Error fetching tables:', tablesError);
            return;
        }
        
        console.log('📋 Found tables:', tables.map(t => t.table_name).join(', '));
        
        // Get column information for each table
        const typeDefinitions = [];
        
        for (const table of tables) {
            const tableName = table.table_name;
            
            const { data: columns, error: columnsError } = await supabase
                .from('information_schema.columns')
                .select('column_name, data_type, is_nullable, column_default')
                .eq('table_schema', 'public')
                .eq('table_name', tableName)
                .order('ordinal_position');
            
            if (columnsError) {
                console.warn(`⚠️  Could not get columns for ${tableName}:`, columnsError);
                continue;
            }
            
            typeDefinitions.push({
                tableName,
                columns
            });
        }
        
        // Generate TypeScript interfaces for updated tables
        let updatedTypes = `// Updated Supabase Types - Generated on ${new Date().toISOString()}\n\n`;
        
        // Add the student_profiles interface with new fields
        updatedTypes += `
// Updated Student Profile Interface
export interface StudentProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  grade: string;
  school: string;
  parent_name: string;
  parent_phone: string;
  emergency_contact: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  metadata: any | null;
  
  // New approval fields
  is_approved: boolean;
  selected_subjects: string[] | null;
  selected_batches: string[] | null;
  approved_by: string | null;
  approval_date: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
}

// New Approval Action Interface
export interface ApprovalAction {
  id: string;
  student_id: string;
  approver_id: string;
  approver_type: 'admin' | 'teacher';
  action: 'approve' | 'reject';
  reason: string | null;
  created_at: string;
}

// New Student Teacher Assignment Interface
export interface StudentTeacherAssignment {
  id: string;
  student_id: string;
  teacher_id: string;
  subject_name: string;
  assigned_at: string;
}

// Updated Teacher Profile Interface
export interface TeacherProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  subject: string;
  qualification: string;
  experience_years: number | null;
  bio: string | null;
  photo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  
  // New subject specialization field
  subject_specialization: string[] | null;
}

// Approval System Types
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserType = 'admin' | 'teacher' | 'student' | 'superadmin';

// Pending Students View
export interface PendingStudent extends StudentProfile {
  subjects_display: string | null;
  batches_display: string | null;
}
`;
        
        // Write to file
        fs.writeFileSync('src/types/approval-system.ts', updatedTypes);
        
        console.log('✅ Updated TypeScript types generated in src/types/approval-system.ts');
        console.log('\nKey additions:');
        console.log('- StudentProfile: is_approved, selected_subjects, selected_batches, approval tracking');
        console.log('- TeacherProfile: subject_specialization');
        console.log('- New interfaces: ApprovalAction, StudentTeacherAssignment, PendingStudent');
        console.log('- New types: ApprovalStatus, UserType');
        
        return true;
        
    } catch (error) {
        console.error('❌ Type generation failed:', error.message);
        return false;
    }
}

// Run the type generation
generateUpdatedTypes();
