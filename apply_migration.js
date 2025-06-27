import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local.template (as it has the keys)
const SUPABASE_URL = 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigration() {
    try {
        console.log('🚀 Starting database migration...');
        
        // Read the SQL migration file
        const migrationSQL = fs.readFileSync('student_approval_system_schema.sql', 'utf-8');
        
        console.log('📝 Applying migration SQL...');
        
        // Apply the migration using Supabase client
        const { data, error } = await supabase.rpc('exec_sql', {
            sql: migrationSQL
        });
        
        if (error) {
            console.error('❌ Migration failed:', error);
            
            // Try alternative approach - execute via direct SQL
            console.log('🔄 Trying alternative SQL execution...');
            
            // Split the SQL into individual statements
            const statements = migrationSQL
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
            
            console.log(`📊 Found ${statements.length} SQL statements to execute`);
            
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                
                // Skip comments and empty statements
                if (!statement || statement.startsWith('--') || statement.startsWith('RAISE NOTICE')) {
                    continue;
                }
                
                try {
                    console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
                    
                    const { data, error } = await supabase.rpc('exec_sql', {
                        sql: statement + ';'
                    });
                    
                    if (error) {
                        console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
                        errorCount++;
                    } else {
                        successCount++;
                    }
                } catch (err) {
                    console.warn(`⚠️  Statement ${i + 1} error:`, err.message);
                    errorCount++;
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            console.log(`✅ Migration completed: ${successCount} successful, ${errorCount} warnings/errors`);
            
        } else {
            console.log('✅ Migration applied successfully!', data);
        }
        
        // Test the migration by checking if new tables exist
        console.log('🔍 Verifying migration...');
        
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['approval_actions', 'student_teacher_assignments']);
        
        if (tablesError) {
            console.warn('⚠️  Could not verify tables:', tablesError);
        } else {
            console.log('📋 Found tables:', tables);
        }
        
        console.log('🎉 Migration process completed!');
        
    } catch (error) {
        console.error('💥 Migration failed with error:', error);
        process.exit(1);
    }
}

// Run the migration
applyMigration();
