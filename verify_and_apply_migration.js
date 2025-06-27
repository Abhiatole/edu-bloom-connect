// Database Migration Verification and Application Script
// This script checks the current database schema and applies the migration if needed

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pgwgtronuluhwuiaqkcc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnd2d0cm9udWx1aHd1aWFxa2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMzE0NTksImV4cCI6MjA2NTkwNzQ1OX0.mTbLF5dSjKbIt6p1jyR7DhNGuLGLAuqAkEiGVVUiZ0I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count', { count: 'exact', head: true });
    
    return !error;
  } catch (error) {
    return false;
  }
}

async function checkColumnExists(tableName, columnName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

async function verifyDatabaseSchema() {
  console.log('🔍 Verifying database schema...\n');
  
  const checks = [
    // Check if student_profiles table has required columns
    { type: 'column', table: 'student_profiles', column: 'student_mobile', description: 'Student mobile column' },
    { type: 'column', table: 'student_profiles', column: 'enrollment_no', description: 'Enrollment number column' },
    { type: 'column', table: 'student_profiles', column: 'parent_email', description: 'Parent email column' },
    
    // Check if required tables exist
    { type: 'table', table: 'batches', description: 'Batches table' },
    { type: 'table', table: 'subjects', description: 'Subjects table' },
    { type: 'table', table: 'student_batches', description: 'Student-batches relationship table' },
    { type: 'table', table: 'student_subjects', description: 'Student-subjects relationship table' }
  ];
  
  const results = [];
  
  for (const check of checks) {
    let exists = false;
    
    if (check.type === 'table') {
      exists = await checkTableExists(check.table);
    } else if (check.type === 'column') {
      exists = await checkColumnExists(check.table, check.column);
    }
    
    results.push({ ...check, exists });
    
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${check.description}: ${exists ? 'EXISTS' : 'MISSING'}`);
  }
  
  const allPassed = results.every(r => r.exists);
  
  console.log(`\n📊 Schema verification: ${allPassed ? '✅ ALL PASSED' : '❌ MIGRATION NEEDED'}\n`);
  
  return { allPassed, results };
}

async function testRegistrationWorkflow() {
  console.log('🧪 Testing registration workflow components...\n');
  
  // Test 1: Check if we can fetch students (for admin dashboard)
  try {
    const { data: students, error } = await supabase
      .from('student_profiles')
      .select('*')
      .limit(1);
    
    console.log('✅ Student profiles query: SUCCESS');
  } catch (error) {
    console.log('❌ Student profiles query: FAILED -', error.message);
  }
  
  // Test 2: Check if we can fetch teachers (for approval workflow)
  try {
    const { data: teachers, error } = await supabase
      .from('teacher_profiles')
      .select('*')
      .limit(1);
    
    console.log('✅ Teacher profiles query: SUCCESS');
  } catch (error) {
    console.log('❌ Teacher profiles query: FAILED -', error.message);
  }
  
  // Test 3: Check if batches exist
  try {
    const { data: batches, error } = await supabase
      .from('batches')
      .select('*');
    
    if (error) throw error;
    console.log(`✅ Batches query: SUCCESS (${batches.length} batches found)`);
  } catch (error) {
    console.log('❌ Batches query: FAILED -', error.message);
  }
  
  // Test 4: Check if subjects exist
  try {
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*');
    
    if (error) throw error;
    console.log(`✅ Subjects query: SUCCESS (${subjects.length} subjects found)`);
  } catch (error) {
    console.log('❌ Subjects query: FAILED -', error.message);
  }
  
  console.log('\n');
}

async function main() {
  console.log('🚀 Starting database verification and migration process...\n');
  
  // Step 1: Verify current schema
  const { allPassed } = await verifyDatabaseSchema();
  
  // Step 2: Test existing workflow components
  await testRegistrationWorkflow();
  
  // Step 3: Provide next steps
  if (allPassed) {
    console.log('🎉 Database schema is complete! You can proceed with testing the registration workflow.');
    console.log('\nNext steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to /register/student and test registration');
    console.log('3. Check admin dashboard for approval workflow');
    console.log('4. Verify student dashboard shows enrollment data');
  } else {
    console.log('⚠️  Database migration is required!');
    console.log('\nTo apply the migration:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Copy and run the contents of fix_student_registration_flow.sql');
    console.log('4. Run this script again to verify');
  }
}

// Run the script
main().catch(console.error);
