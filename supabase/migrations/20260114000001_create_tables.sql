-- projects/hub/db/001-create-tables.sql
-- API Hub MVP Database Schema

-- Note: Using gen_random_uuid() which is built-in (no extension needed)

-- ========== Projects Table ==========
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  graphql_endpoint VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE projects IS 'OC projects (crew, ipd, pulse, etc.)';

-- ========== API Task Types ==========
CREATE TYPE task_status AS ENUM ('planning', 'mocking', 'developing', 'done');
CREATE TYPE api_type AS ENUM ('graphql', 'rest', 'edge-function', 'n8n');
CREATE TYPE priority_level AS ENUM ('P0', 'P1', 'P2', 'P3');

-- ========== API Tasks Table ==========
CREATE TABLE api_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id),
  assignee VARCHAR(20),  -- Employee ID (E019, etc.)
  status task_status DEFAULT 'planning',
  api_type api_type NOT NULL,
  priority priority_level DEFAULT 'P2',
  endpoint VARCHAR(255),
  method VARCHAR(10),
  contract JSONB,  -- API contract definition
  created_by VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE api_tasks IS 'API development tasks';
CREATE INDEX idx_api_tasks_project ON api_tasks(project_id);
CREATE INDEX idx_api_tasks_status ON api_tasks(status);

-- ========== Mock Responses Table ==========
CREATE TABLE mock_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES api_tasks(id) ON DELETE CASCADE,
  scenario VARCHAR(50) NOT NULL,  -- success, empty, error
  status_code INT DEFAULT 200,
  response_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, scenario)
);

COMMENT ON TABLE mock_responses IS 'Mock data configuration';

-- ========== API Registry Table ==========
CREATE TABLE api_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id),
  source_task_id UUID REFERENCES api_tasks(id),
  api_type api_type NOT NULL,
  schema JSONB,
  auth_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE api_registry IS 'Production API registry';
CREATE INDEX idx_api_registry_project ON api_registry(project_id);

-- ========== API Keys Table ==========
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,  -- Display prefix, e.g., ak_xxx
  key_hash VARCHAR(64) NOT NULL,  -- SHA256 hash
  permissions JSONB NOT NULL,  -- Permission config
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE api_keys IS 'API Key management';

-- ========== API Logs Table ==========
CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT,
  response_time_ms INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE api_logs IS 'API call logs';
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);

-- ========== Updated At Trigger ==========
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_tasks_updated_at
  BEFORE UPDATE ON api_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
