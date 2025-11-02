-- Migration: Add missing fields to proposals table
-- Date: 2025-11-02
-- Fixes: Proposal pins not showing (missing geom field)

ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS geom JSONB,
ADD COLUMN IF NOT EXISTS layer VARCHAR(255) DEFAULT 'micro',
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS body TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Update existing proposals to have default layer if null
UPDATE proposals SET layer = 'micro' WHERE layer IS NULL;
