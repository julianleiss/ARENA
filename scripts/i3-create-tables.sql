-- ARENA Iteration 3 - Assets and Instances Tables
-- Execute this in Supabase SQL Editor

-- Create assets table
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  model_url TEXT,
  default_params JSONB NOT NULL
);

CREATE INDEX idx_assets_kind ON assets(kind);

-- Create instances table
CREATE TABLE instances (
  id TEXT PRIMARY KEY,
  sandbox_id TEXT NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES assets(id),
  geom JSONB NOT NULL,
  params JSONB NOT NULL,
  transform JSONB NOT NULL,
  state TEXT DEFAULT 'added' NOT NULL
);

CREATE INDEX idx_instances_sandbox_id ON instances(sandbox_id);
CREATE INDEX idx_instances_asset_id ON instances(asset_id);

-- Seed 8 generic assets (Casa, Torre, Plaza, Árbol, Farola, Bloque, Edificio Alto, Kiosko)
INSERT INTO assets (id, name, kind, model_url, default_params) VALUES
  ('ast_casa_001', 'Casa', 'building', NULL, '{"floors": 2, "height": 6, "color": "#E8DCC4"}'),
  ('ast_torre_001', 'Torre', 'building', NULL, '{"floors": 12, "height": 36, "color": "#B8C5D6"}'),
  ('ast_bloque_001', 'Bloque', 'building', NULL, '{"floors": 5, "height": 15, "color": "#D4C5B9"}'),
  ('ast_plaza_001', 'Plaza', 'custom', NULL, '{"size": 20, "color": "#90C695"}'),
  ('ast_arbol_001', 'Árbol', 'tree', NULL, '{"height": 8, "canopyRadius": 4, "color": "#4A7C59"}'),
  ('ast_farola_001', 'Farola', 'lamp', NULL, '{"height": 5, "color": "#8B8B8B"}'),
  ('ast_edificio_001', 'Edificio Alto', 'building', NULL, '{"floors": 20, "height": 60, "color": "#A4B8C4"}'),
  ('ast_kiosko_001', 'Kiosko', 'building', NULL, '{"floors": 1, "height": 3, "color": "#F4E8D0"}');
