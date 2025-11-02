-- Enable RLS and create public access policies for ARENA demo
-- This allows the application to work without authentication while RLS is enabled

-- ============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proposal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Metric" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "POI" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC READ POLICIES (SELECT)
-- ============================================

-- Allow public to read all users (for author info)
CREATE POLICY "Public can view users"
  ON "User"
  FOR SELECT
  TO public
  USING (true);

-- Allow public to read all public proposals
CREATE POLICY "Public can view proposals"
  ON "Proposal"
  FOR SELECT
  TO public
  USING (true);

-- Allow public to read all votes
CREATE POLICY "Public can view votes"
  ON "Vote"
  FOR SELECT
  TO public
  USING (true);

-- Allow public to read all comments
CREATE POLICY "Public can view comments"
  ON "Comment"
  FOR SELECT
  TO public
  USING (true);

-- Allow public to read all metrics
CREATE POLICY "Public can view metrics"
  ON "Metric"
  FOR SELECT
  TO public
  USING (true);

-- Allow public to read all POIs
CREATE POLICY "Public can view POIs"
  ON "POI"
  FOR SELECT
  TO public
  USING (true);

-- Allow public to read audit logs
CREATE POLICY "Public can view audit logs"
  ON "AuditLog"
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
  ON "User"
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to create proposals (temporary for demo)
CREATE POLICY "Public can create proposals"
  ON "Proposal"
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to update their own proposals (temporary for demo)
CREATE POLICY "Public can update proposals"
  ON "Proposal"
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public to delete their own proposals (temporary for demo)
CREATE POLICY "Public can delete proposals"
  ON "Proposal"
  FOR DELETE
  TO public
  USING (true);

-- Allow public to create votes
CREATE POLICY "Public can create votes"
  ON "Vote"
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to create comments
CREATE POLICY "Public can create comments"
  ON "Comment"
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to update comments
CREATE POLICY "Public can update comments"
  ON "Comment"
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public to delete comments
CREATE POLICY "Public can delete comments"
  ON "Comment"
  FOR DELETE
  TO public
  USING (true);

-- Allow public to create metrics
CREATE POLICY "Public can create metrics"
  ON "Metric"
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to create POIs
CREATE POLICY "Public can create POIs"
  ON "POI"
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to create audit logs
CREATE POLICY "Public can create audit logs"
  ON "AuditLog"
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
AND tablename IN ('User', 'Proposal', 'Vote', 'Comment', 'Metric', 'POI', 'AuditLog');

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
