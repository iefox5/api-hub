import { useState } from 'react'
import { useProjects } from '@/lib/hooks/useProjects'
import { useApiTasks } from '@/lib/hooks/useApiTasks'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Loader2, ExternalLink, FileText, Download } from 'lucide-react'
import { exportOpenApiJson, exportOpenApiYaml } from '@/lib/exporters/openapi'
import { exportMarkdown } from '@/lib/exporters/markdown'

export function DocsPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>()
  const { data: projects, isLoading } = useProjects()
  const { data: tasks } = useApiTasks({ projectId: selectedProjectId })

  const selectedProject = projects?.find(p => p.id === selectedProjectId)
  const doneTasks = tasks?.filter(t => t.status === 'done')

  const handleExport = (format: string) => {
    if (!selectedProject || !tasks) return

    let content: string
    let filename: string
    let mimeType: string
    const date = new Date().toISOString().split('T')[0]

    switch (format) {
      case 'openapi-json':
        content = exportOpenApiJson(selectedProject, tasks)
        filename = `${selectedProject.name}-api-${date}.json`
        mimeType = 'application/json'
        break
      case 'openapi-yaml':
        content = exportOpenApiYaml(selectedProject, tasks)
        filename = `${selectedProject.name}-api-${date}.yaml`
        mimeType = 'text/yaml'
        break
      case 'markdown':
        content = exportMarkdown(selectedProject, tasks)
        filename = `${selectedProject.name}-api-${date}.md`
        mimeType = 'text/markdown'
        break
      default:
        return
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
            <p className="text-sm text-gray-600 mt-1">
              Browse API documentation and endpoints for your projects
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProjectId && (
              <Select onValueChange={handleExport}>
                <SelectTrigger className="w-[160px]">
                  <Download className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Export" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openapi-json">OpenAPI (JSON)</SelectItem>
                  <SelectItem value="openapi-yaml">OpenAPI (YAML)</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedProject ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Select a project to view its API documentation</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>{selectedProject.name}</CardTitle>
                <CardDescription>{selectedProject.description || 'No description'}</CardDescription>
              </CardHeader>
              {selectedProject.graphql_endpoint && (
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">GraphQL Endpoint:</span>
                    <a
                      href={selectedProject.graphql_endpoint}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {selectedProject.graphql_endpoint}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* API Registry / Completed Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Available APIs</CardTitle>
                <CardDescription>
                  {doneTasks?.length || 0} completed API{doneTasks?.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {doneTasks && doneTasks.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>API Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doneTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{task.api_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {task.endpoint || '-'}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{task.method || '-'}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{task.priority}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No completed APIs yet</p>
                    <p className="text-sm mt-2">
                      APIs will appear here once they are marked as "done"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scalar Integration Placeholder */}
            {selectedProject.graphql_endpoint && (
              <Card>
                <CardHeader>
                  <CardTitle>Interactive API Documentation</CardTitle>
                  <CardDescription>
                    Explore and test GraphQL queries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Scalar GraphQL documentation will be embedded here
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Endpoint: {selectedProject.graphql_endpoint}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => selectedProject.graphql_endpoint && window.open(selectedProject.graphql_endpoint, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
