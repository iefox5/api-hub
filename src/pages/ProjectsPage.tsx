import { useProjects } from '@/lib/hooks/useProjects'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Database, ExternalLink } from 'lucide-react'

export function ProjectsPage() {
  const { data: projects, isLoading, error } = useProjects()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading projects: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <p className="text-gray-600 mt-2">
          {projects?.length || 0} project{projects?.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-xl">{project.name}</CardTitle>
                {project.graphql_endpoint && (
                  <Badge variant="secondary" className="ml-2">
                    <Database className="w-3 h-3 mr-1" />
                    GraphQL
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-2">
                {project.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.graphql_endpoint && (
                <a
                  href={project.graphql_endpoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  View API Endpoint
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              <div className="text-xs text-gray-500 mt-3">
                Created {new Date(project.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No projects found</p>
        </div>
      )}
    </div>
  )
}
