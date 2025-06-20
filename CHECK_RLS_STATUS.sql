-- CHECK CURRENT RLS STATUS
-- This script shows all current RLS policies and identifies issues

-- Show all tables with RLS status
SELECT 
    'TABLE RLS STATUS' as check_type,
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename) as policy_count
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
    'student_profiles', 'teacher_profiles', 'admin_profiles', 
    'approval_logs', 'exam_results', 'exams', 'fee_payments', 
    'fee_structures', 'parent_links', 'security_logs', 
    'student_insights', 'subjects', 'timetables', 'user_profiles'
)
ORDER BY tablename;

-- Show all current policies
SELECT 
    'CURRENT POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    CASE WHEN roles = '{public}' THEN 'PUBLIC' ELSE array_to_string(roles, ', ') END as applied_to
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for tables with RLS enabled but no policies (will block all access)
SELECT 
    'TABLES WITHOUT POLICIES (BLOCKED)' as issue_type,
    t.tablename,
    'RLS enabled but no policies - NO ACCESS ALLOWED' as issue
FROM pg_tables t
WHERE t.schemaname = 'public'
AND t.rowsecurity = true
AND NOT EXISTS (
    SELECT 1 FROM pg_policies p 
    WHERE p.tablename = t.tablename 
    AND p.schemaname = t.schemaname
)
AND t.tablename IN (
    'student_profiles', 'teacher_profiles', 'admin_profiles', 
    'approval_logs', 'exam_results', 'exams', 'fee_payments', 
    'fee_structures', 'parent_links', 'security_logs', 
    'student_insights', 'subjects', 'timetables', 'user_profiles'
);

-- Check for tables with too many conflicting policies
SELECT 
    'TABLES WITH MULTIPLE POLICIES' as issue_type,
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 5 THEN '⚠️  TOO MANY - May have conflicts'
        WHEN COUNT(*) = 0 THEN '❌ NONE - Access blocked'
        ELSE '✅ REASONABLE'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 0
ORDER BY policy_count DESC;

-- Check for duplicate policy names (potential conflicts)
SELECT 
    'DUPLICATE POLICY NAMES' as issue_type,
    policyname,
    COUNT(*) as occurrence_count,
    array_agg(tablename) as tables
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY policyname
HAVING COUNT(*) > 1;

-- Recommended actions
SELECT 
    'RECOMMENDED ACTIONS' as recommendation,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'student_profiles') > 5 
        THEN '1. Run ESSENTIAL_RLS_CLEANUP.sql to fix student_profiles policies'
        ELSE '1. Student profiles policies look reasonable'
    END as action_1,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_tables t
            WHERE t.schemaname = 'public'
            AND t.rowsecurity = true
            AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename)
        )
        THEN '2. Some tables have RLS enabled but no policies - they are completely blocked'
        ELSE '2. No completely blocked tables found'
    END as action_2;
