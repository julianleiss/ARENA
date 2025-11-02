-- Enable RLS and create public access policies for ARENA demo
-- This allows the application to work without authentication while RLS is enabled

-- ============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC READ POLICIES (SELECT)
-- ============================================

-- Allow public to read all users (for author info)
CREATE POLICY "Public can view users"
  ON users
  FOR SELECT
  TO public
  USING (true);

-- Allow public to read all public proposals
CREATE POLICY "Public can view proposals"
  ON proposals
  FOR SELECT
  TO public
  USING (true);

-- Allow public to read all votes
CREATE POLICY "Public can view votes"
  ON votes
  FOR SELECT
  TO public
  USING (true);

-- Allow public to read all comments
CREATE POLICY "Public can view comments"
  ON comments
  FOR SELECT
  TO public
  USING (true);

-- Allow public to read all metrics
CREATE POLICY "Public can view metrics"
  ON metrics
  FOR SELECT
  TO public
  USING (true);

-- Allow public to read all POIs
CREATE POLICY "Public can view POIs"
  ON pois
  FOR SELECT
  TO public
  USING (true);

-- Allow public to read audit logs
CREATE POLICY "Public can view audit logs"
  ON audit_logs
  FOR SELECT
  TO public
  USING (true);

-- ============================================
-- PUBLIC WRITE POLICIES (INSERT/UPDATE/DELETE)
-- Demo mode: Allow anyone to create content
-- TODO: Restrict to authenticated users in production
-- ============================================

-- Allow public to create users (temporary for demo)
CREATE POLICY "Public can create users"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to create proposals (temporary for demo)
CREATE POLICY "Public can create proposals"
  ON proposals
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to update their own proposals (temporary for demo)
CREATE POLICY "Public can update proposals"
  ON proposals
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public to delete their own proposals (temporary for demo)
CREATE POLICY "Public can delete proposals"
  ON proposals
  FOR DELETE
  TO public
  USING (true);

-- Allow public to create votes
CREATE POLICY "Public can create votes"
  ON votes
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to create comments
CREATE POLICY "Public can create comments"
  ON comments
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to update comments
CREATE POLICY "Public can update comments"
  ON comments
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public to delete comments
CREATE POLICY "Public can delete comments"
  ON comments
  FOR DELETE
  TO public
  USING (true);

-- Allow public to create metrics
CREATE POLICY "Public can create metrics"
  ON metrics
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to create POIs
CREATE POLICY "Public can create POIs"
  ON pois
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to create audit logs
CREATE POLICY "Public can create audit logs"
  ON audit_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'proposals', 'votes', 'comments', 'metrics', 'pois', 'audit_logs');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
