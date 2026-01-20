import yaml from 'js-yaml'
import type { ApiTask, Project } from '../types'

interface OpenApiSpec {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers?: { url: string; description?: string }[]
  paths: Record<string, any>
}

export function generateOpenApiSpec(
  project: Project,
  tasks: ApiTask[]
): OpenApiSpec {
  const doneTasks = tasks.filter((t) => t.status === 'done' && t.endpoint)

  const paths: Record<string, any> = {}

  for (const task of doneTasks) {
    const method = (task.method || 'GET').toLowerCase()
    const endpoint = task.endpoint || '/'

    if (!paths[endpoint]) {
      paths[endpoint] = {}
    }

    const operation: any = {
      summary: task.title,
      description: task.description || undefined,
      tags: [project.name],
    }

    // Add request info from contract
    if (task.contract?.request) {
      const { params, query, body } = task.contract.request

      const parameters: any[] = []

      // Path params
      if (params) {
        for (const [name, def] of Object.entries(params) as [string, { type: string; required: boolean; description?: string }][]) {
          parameters.push({
            name,
            in: 'path',
            required: def.required,
            description: def.description,
            schema: { type: def.type },
          })
        }
      }

      // Query params
      if (query) {
        for (const [name, def] of Object.entries(query) as [string, { type: string; required: boolean; description?: string }][]) {
          parameters.push({
            name,
            in: 'query',
            required: def.required,
            description: def.description,
            schema: { type: def.type },
          })
        }
      }

      if (parameters.length > 0) {
        operation.parameters = parameters
      }

      // Request body
      if (body && Object.keys(body).length > 0) {
        operation.requestBody = {
          content: {
            'application/json': {
              schema: body,
            },
          },
        }
      }
    }

    // Add responses from contract
    if (task.contract?.response) {
      operation.responses = {}
      for (const [code, response] of Object.entries(task.contract.response) as [string, { description: string; body: object }][]) {
        operation.responses[code] = {
          description: response.description,
          content: {
            'application/json': {
              schema: response.body,
            },
          },
        }
      }
    } else {
      operation.responses = {
        '200': { description: 'Success' },
      }
    }

    paths[endpoint][method] = operation
  }

  return {
    openapi: '3.0.3',
    info: {
      title: `${project.name} API`,
      version: '1.0.0',
      description: project.description || undefined,
    },
    servers: project.graphql_endpoint
      ? [{ url: project.graphql_endpoint }]
      : undefined,
    paths,
  }
}

export function exportOpenApiJson(project: Project, tasks: ApiTask[]): string {
  const spec = generateOpenApiSpec(project, tasks)
  return JSON.stringify(spec, null, 2)
}

export function exportOpenApiYaml(project: Project, tasks: ApiTask[]): string {
  const spec = generateOpenApiSpec(project, tasks)
  return yaml.dump(spec)
}
