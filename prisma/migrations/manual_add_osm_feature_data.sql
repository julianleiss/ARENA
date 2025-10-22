-- ARENA V1.0 - Manual Migration: Add OSM Feature Data
-- Run this SQL in Supabase SQL Editor

-- Add OSM feature columns to proposals table
ALTER TABLE "public"."proposals"
  ADD COLUMN IF NOT EXISTS "osm_type" TEXT,
  ADD COLUMN IF NOT EXISTS "osm_id" TEXT,
  ADD COLUMN IF NOT EXISTS "osm_tags" JSONB,
  ADD COLUMN IF NOT EXISTS "feature_name" TEXT;

-- Create indexes for OSM fields
CREATE INDEX IF NOT EXISTS "proposals_osm_id_idx" ON "public"."proposals"("osm_id");
CREATE INDEX IF NOT EXISTS "proposals_osm_type_idx" ON "public"."proposals"("osm_type");

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'proposals'
  AND column_name IN ('osm_type', 'osm_id', 'osm_tags', 'feature_name')
ORDER BY ordinal_position;
