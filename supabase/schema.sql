-- ====================================================================
-- FactoryVerse Expert XR - PostgreSQL / Supabase Migration Schema
-- Compatible with Row Level Security (RLS) for enterprise authoring
-- ====================================================================

-- 1. Procedures Table
CREATE TABLE IF NOT EXISTS procedures (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  current_revision_number INT DEFAULT 0,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  estimated_duration_min INT DEFAULT 5,
  required_tools JSONB DEFAULT '[]'::jsonb,
  safety_precautions JSONB DEFAULT '[]'::jsonb,
  associated_model_id TEXT,
  active_draft_steps JSONB DEFAULT '[]'::jsonb
);

-- 2. Procedure Revisions (Immutable Snapshots)
CREATE TABLE IF NOT EXISTS procedure_revisions (
  revision_id TEXT PRIMARY KEY,
  procedure_id TEXT REFERENCES procedures(id) ON DELETE CASCADE,
  revision_number INT NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  published_by TEXT NOT NULL,
  change_summary TEXT,
  steps JSONB NOT NULL
);

-- 3. Capture Sessions Table
CREATE TABLE IF NOT EXISTS capture_sessions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  expert_name TEXT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('recording', 'completed', 'converted')),
  steps JSONB DEFAULT '[]'::jsonb,
  notes TEXT
);

-- 4. Training Sessions & Quality Inspections Table
CREATE TABLE IF NOT EXISTS training_sessions (
  id TEXT PRIMARY KEY,
  procedure_id TEXT REFERENCES procedures(id) ON DELETE SET NULL,
  procedure_code TEXT NOT NULL,
  procedure_title TEXT NOT NULL,
  revision_number INT NOT NULL,
  operator_id TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  overall_passed BOOLEAN DEFAULT FALSE,
  total_score INT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  inspection_result JSONB,
  failed_checkpoints JSONB DEFAULT '[]'::jsonb,
  step_results JSONB DEFAULT '[]'::jsonb
);

-- Row Level Security (RLS) Policies
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for active training"
  ON procedures FOR SELECT USING (true);

CREATE POLICY "Allow authenticated operators to insert training sessions"
  ON training_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read of published revisions"
  ON procedure_revisions FOR SELECT USING (true);
