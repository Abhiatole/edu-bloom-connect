-- MINIMAL TEST: Try to create a basic user profile
-- Run this step by step in Supabase SQL Editor to identify the exact error

-- Step 1: Test basic insert into user_profiles
BEGIN;

-- Try to insert a test user profile
INSERT INTO user_profiles (
    id,
    role,
    full_name,
    email,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'STUDENT',
    'Test User',
    'test@example.com',
    NOW(),
    NOW()
);

-- If this fails, the issue is with user_profiles table structure
-- If it succeeds, rollback and continue to next test
ROLLBACK;

-- Step 2: Test if foreign key constraints are blocking
-- Check if we can insert without user_id reference
BEGIN;

INSERT INTO student_profiles (
    id,
    full_name,
    email,
    status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Test Student',
    'student@example.com',  
    'PENDING',
    NOW(),
    NOW()
);

-- If this fails, there's an issue with student_profiles structure
ROLLBACK;

-- Step 3: Check if RLS is blocking operations
-- Disable RLS temporarily to test
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles DISABLE ROW LEVEL SECURITY;

-- Try the insert again
BEGIN;

INSERT INTO user_profiles (
    id,
    role,
    full_name,
    email,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'STUDENT',
    'Test User 2',
    'test2@example.com',
    NOW(),
    NOW()
);

ROLLBACK;

-- Step 4: Check authentication integration
-- See if the issue is with auth.users trigger
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
    AND event_object_schema = 'auth';

-- If no triggers exist, that's likely the problem
