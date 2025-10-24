-- ARENA Iteration 6 - Verify Comments Table
-- Execute this in Supabase SQL Editor

-- Check if comments table exists and has correct structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM
  information_schema.columns
WHERE
  table_name = 'comments'
ORDER BY
  ordinal_position;

-- Count existing comments
SELECT COUNT(*) as comment_count FROM comments;
