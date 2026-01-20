import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/Layout'
import { ProjectsPage } from './pages/ProjectsPage'
import { TasksPage } from './pages/TasksPage'
import { DocsPage } from './pages/DocsPage'
import { ApiKeysPage } from './pages/ApiKeysPage'
import { GraphQLDocsPage } from './pages/GraphQLDocsPage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="docs" element={<DocsPage />} />
            <Route path="graphql-docs" element={<GraphQLDocsPage />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
