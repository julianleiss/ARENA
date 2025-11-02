-- Minimal RLS fix for ARENA - Only essential tables for proposals
-- Run this first, then add policies for other tables as they're created

-- ============================================
-- ENABLE RLS ON ESSENTIAL TABLES ONLY
-- ============================================

-- Check which tables exist first
DO $$
BEGIN
    -- Enable RLS on users table
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on users';
    END IF;

    -- Enable RLS on proposals table
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proposals') THEN
        ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS enabled on proposals';
    END IF;
END $$;

-- ============================================
-- PUBLIC READ POLICIES
-- ============================================

-- Allow public to read all users (needed for author info)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE POLICY "Public can view users"
          ON users
          FOR SELECT
          TO public
          USING (true);
        RAISE NOTICE 'Created read policy on users';
    END IF;
END $$;

-- Allow public to read all proposals
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proposals') THEN
        CREATE POLICY "Public can view proposals"
          ON proposals
          FOR SELECT
          TO public
          USING (true);
        RAISE NOTICE 'Created read policy on proposals';
    END IF;
END $$;

-- ============================================
-- PUBLIC WRITE POLICIES (Demo Mode)
-- ============================================

-- Allow public to create users
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE POLICY "Public can create users"
          ON users
          FOR INSERT
          TO public
          WITH CHECK (true);
        RAISE NOTICE 'Created insert policy on users';
    END IF;
END $$;

-- Allow public to create proposals
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proposals') THEN
        CREATE POLICY "Public can create proposals"
          ON proposals
          FOR INSERT
          TO public
          WITH CHECK (true);
        RAISE NOTICE 'Created insert policy on proposals';
    END IF;
END $$;

-- Allow public to update proposals
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proposals') THEN
        CREATE POLICY "Public can update proposals"
          ON proposals
          FOR UPDATE
          TO public
          USING (true)
          WITH CHECK (true);
        RAISE NOTICE 'Created update policy on proposals';
    END IF;
END $$;

-- Allow public to delete proposals
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'proposals') THEN
        CREATE POLICY "Public can delete proposals"
          ON proposals
          FOR DELETE
          TO public
          USING (true);
        RAISE NOTICE 'Created delete policy on proposals';
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show which tables have RLS enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'proposals')
ORDER BY tablename;

-- Show all policies created
SELECT
    schemaname,
    tablename,
    policyname,
    cmd as "Operation"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'proposals')
ORDER BY tablename, policyname;
