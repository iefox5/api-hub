-- projects/hub/db/002-mock-data.sql
-- Mock data for development and testing

-- Clear old data (idempotent)
TRUNCATE api_logs, api_keys, api_registry, mock_responses, api_tasks, projects CASCADE;

-- ========== Projects Data ==========
INSERT INTO projects (id, name, description, graphql_endpoint) VALUES
  ('11111111-1111-1111-1111-111111111111', 'crew', '[MOCK] Employee master data system', 'https://crew.supabase.co/graphql/v1'),
  ('22222222-2222-2222-2222-222222222222', 'ipd', '[MOCK] Integrated product development', 'https://ipd.supabase.co/graphql/v1'),
  ('33333333-3333-3333-3333-333333333333', 'pulse', '[MOCK] Task hub system', 'https://pulse.supabase.co/graphql/v1'),
  ('44444444-4444-4444-4444-444444444444', 'sam', '[MOCK] Supplier management system', NULL);

-- ========== API Tasks Data ==========
INSERT INTO api_tasks (id, title, description, project_id, assignee, status, api_type, priority, endpoint, method, contract, created_by) VALUES
  -- Crew project tasks
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '[MOCK] Employee list query API',
   'Support filtering employee list by department and status',
   '11111111-1111-1111-1111-111111111111',
   'E019', 'done', 'graphql', 'P1',
   '/graphql', 'POST',
   '{"query": "employees", "params": {"department": "string?", "status": "string?"}, "response": {"employees": [{"id": "uuid", "name": "string", "department": "string"}]}}',
   'E000'),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '[MOCK] Employee detail query API',
   'Query single employee details by ID',
   '11111111-1111-1111-1111-111111111111',
   'E019', 'developing', 'graphql', 'P1',
   '/graphql', 'POST',
   '{"query": "employee", "params": {"id": "uuid!"}, "response": {"employee": {"id": "uuid", "name": "string", "email": "string", "department": "string", "position": "string"}}}',
   'E000'),

  -- IPD project tasks
  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   '[MOCK] Product list API',
   'Get product list with pagination and filtering',
   '22222222-2222-2222-2222-222222222222',
   'E022', 'mocking', 'rest', 'P0',
   '/api/products', 'GET',
   '{"params": {"page": "int?", "limit": "int?", "category": "string?"}, "response": {"products": [], "total": "int", "page": "int"}}',
   'E007'),

  ('dddddddd-dddd-dddd-dddd-dddddddddddd',
   '[MOCK] Create product API',
   'Create new product and return product ID',
   '22222222-2222-2222-2222-222222222222',
   NULL, 'planning', 'rest', 'P1',
   '/api/products', 'POST',
   '{"body": {"name": "string!", "category": "string!", "description": "string?"}, "response": {"id": "uuid", "created_at": "timestamp"}}',
   'E007'),

  -- Pulse project tasks
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
   '[MOCK] Task statistics API',
   'Get task completion statistics',
   '33333333-3333-3333-3333-333333333333',
   'E019', 'done', 'edge-function', 'P2',
   '/functions/v1/task-stats', 'GET',
   '{"params": {"project_id": "uuid?", "date_from": "date?", "date_to": "date?"}, "response": {"total": "int", "completed": "int", "in_progress": "int"}}',
   'E000');

-- ========== Mock Responses Data ==========
INSERT INTO mock_responses (task_id, scenario, status_code, response_data) VALUES
  -- Employee list API mock responses
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'success', 200,
   '{"employees": [{"id": "e001", "name": "[MOCK] Zhang San", "department": "IT"}, {"id": "e002", "name": "[MOCK] Li Si", "department": "HR"}]}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'empty', 200,
   '{"employees": []}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'error', 500,
   '{"error": "Internal Server Error", "message": "[MOCK] Database connection failed"}'),

  -- Product list API mock responses
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'success', 200,
   '{"products": [{"id": "p001", "name": "[MOCK] Handbag A", "category": "bag"}, {"id": "p002", "name": "[MOCK] Handbag B", "category": "bag"}], "total": 2, "page": 1}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'empty', 200,
   '{"products": [], "total": 0, "page": 1}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'error', 401,
   '{"error": "Unauthorized", "message": "[MOCK] API Key invalid or expired"}');

-- ========== API Keys Data ==========
INSERT INTO api_keys (id, name, key_prefix, key_hash, permissions, created_by) VALUES
  ('0b0b0b0b-0b0b-0b0b-0b0b-0b0b0b0b0b0b',
   '[MOCK] IPD Production',
   'ak_ipd_pr',
   'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
   '[{"project": "crew", "access": "read"}, {"project": "ipd", "access": "read_write"}]',
   'E000'),

  ('0c0c0c0c-0c0c-0c0c-0c0c-0c0c0c0c0c0c',
   '[MOCK] Data Team Read-only',
   'ak_data_r',
   'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678',
   '[{"project": "*", "access": "read"}]',
   'E014');

-- ========== API Registry Data ==========
INSERT INTO api_registry (name, endpoint, method, project_id, source_task_id, api_type, auth_required) VALUES
  ('[MOCK] Employee List', '/graphql#employees', 'POST', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'graphql', true),
  ('[MOCK] Task Stats', '/functions/v1/task-stats', 'GET', '33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'edge-function', true);
