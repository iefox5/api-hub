import { useState } from 'react'
import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'
import { useProjects } from '@/lib/hooks/useProjects'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function GraphQLDocsPage() {
  const { data: projects } = useProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string>()

  const selectedProject = projects?.find((p) => p.id === selectedProjectId)
  const projectsWithGraphQL = projects?.filter((p) => p.graphql_endpoint)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GraphQL Documentation</h1>
            <p className="text-sm text-gray-600 mt-1">
              Interactive GraphQL API explorer powered by Scalar
            </p>
          </div>
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projectsWithGraphQL?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scalar Viewer */}
      <div className="flex-1 overflow-hidden">
        {selectedProject?.graphql_endpoint ? (
          <ApiReferenceReact
            configuration={{
              spec: {
                url: selectedProject.graphql_endpoint,
              },
              theme: 'default',
              hideDownloadButton: false,
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {selectedProjectId
              ? 'This project does not have a GraphQL endpoint configured.'
              : 'Select a project to view its GraphQL documentation.'}
          </div>
        )}
      </div>
    </div>
  )
}
