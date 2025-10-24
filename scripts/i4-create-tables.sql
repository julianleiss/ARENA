-- ARENA Iteration 4 - ProposalVersion and ProposalPreview Tables
-- Execute this in Supabase SQL Editor

-- Create proposal_versions table
CREATE TABLE proposal_versions (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  sandbox_id TEXT NOT NULL,
  hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_proposal_versions_proposal_id ON proposal_versions(proposal_id);
CREATE INDEX idx_proposal_versions_sandbox_id ON proposal_versions(sandbox_id);

-- Create proposal_previews table
CREATE TABLE proposal_previews (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL UNIQUE REFERENCES proposals(id) ON DELETE CASCADE,
  geom JSONB NOT NULL,
  mask JSONB NOT NULL,
  mesh_url TEXT,
  img_url TEXT,
  lod INTEGER DEFAULT 0
);
