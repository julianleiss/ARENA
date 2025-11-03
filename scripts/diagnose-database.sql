-- ARENA - Database Diagnostic Query
-- Run this in Supabase Studio SQL Editor to check database state

-- 1. Count all proposals
SELECT
  COUNT(*) as total_proposals,
  COUNT(CASE WHEN status = 'published' THEN 1 END) as published_proposals,
  COUNT(CASE WHEN status = 'public' THEN 1 END) as public_proposals,
  COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_proposals,
  COUNT(CASE WHEN geom IS NOT NULL THEN 1 END) as proposals_with_geom,
  COUNT(CASE WHEN geom IS NULL THEN 1 END) as proposals_without_geom
FROM proposals;

-- 2. Check recent proposals
SELECT
  id,
  title,
  status,
  geom IS NOT NULL as has_geom,
  layer,
  category,
  created_at,
  author_id
FROM proposals
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if Spanish proposals exist (by checking for Spanish characters)
SELECT
  COUNT(*) as spanish_proposals
FROM proposals
WHERE title LIKE '%ó%' OR title LIKE '%á%' OR title LIKE '%í%' OR title LIKE '%ñ%';

-- 4. Check proposals by category
SELECT
  category,
  COUNT(*) as count
FROM proposals
GROUP BY category
ORDER BY count DESC;

-- 5. Check database columns (verify schema is correct)
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'proposals'
ORDER BY ordinal_position;

-- 6. Check connection details
SELECT
  current_database() as database_name,
  current_user as user_name,
  inet_server_addr() as server_ip,
  version() as postgres_version;
