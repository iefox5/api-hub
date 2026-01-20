// Database types
export interface Project {
  id: string
  name: string
  description: string | null
  graphql_endpoint: string | null
  created_at: string
}

export type TaskStatus = 'planning' | 'mocking' | 'developing' | 'done'
export type ApiType = 'graphql' | 'rest' | 'edge-function' | 'n8n'
export type PriorityLevel = 'P0' | 'P1' | 'P2' | 'P3'

export interface ApiTask {
  id: string
  title: string
  description: string | null
  project_id: string
  assignee: string | null
  status: TaskStatus
  api_type: ApiType
  priority: PriorityLevel
  endpoint: string | null
  method: string | null
  contract: any | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined data
  project?: Project
}

export interface MockResponse {
  id: string
  task_id: string
  scenario: string
  status_code: number
  response_data: any
  created_at: string
}

export interface ApiKey {
  id: string
  name: string
  key_prefix: string
  key_hash: string
  permissions: any
  last_used_at: string | null
  created_by: string | null
  created_at: string
  revoked_at: string | null
}

export interface ApiRegistry {
  id: string
  name: string
  endpoint: string
  method: string
  project_id: string
  source_task_id: string | null
  api_type: ApiType
  schema: any | null
  auth_required: boolean
  created_at: string
}

export interface ApiContract {
  request?: {
    headers?: Record<string, string>
    params?: Record<string, { type: string; required: boolean; description?: string }>
    query?: Record<string, { type: string; required: boolean; description?: string }>
    body?: object
  }
  response?: {
    [statusCode: string]: {
      description: string
      body: object
    }
  }
}
