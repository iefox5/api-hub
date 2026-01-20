import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { useMockResponses, callMockApi } from '@/lib/hooks/useMockResponses'
import type { ApiTask } from '@/lib/types'
import { Copy, Play, Loader2, Pencil, Trash2 } from 'lucide-react'
import { TaskFormDialog } from './TaskFormDialog'
import { useDeleteTask } from '@/lib/hooks/useApiTasks'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'

interface TaskDetailSheetProps {
  task: ApiTask | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailSheet({ task, open, onOpenChange }: TaskDetailSheetProps) {
  const { data: mockResponses } = useMockResponses(task?.id || '')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState('success')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const deleteTask = useDeleteTask()

  if (!task) return null

  const mockUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mock/${task.id}`

  const handleTest = async () => {
    setTesting(true)
    try {
      const result = await callMockApi(task.id, selectedScenario)
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: (error as Error).message })
    } finally {
      setTesting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">{task.title}</SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{task.title}"? This will also delete all associated Mock data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700"
                      onClick={async () => {
                        await deleteTask.mutateAsync(task.id)
                        onOpenChange(false)
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <SheetDescription className="flex items-center gap-2 mt-2">
            <Badge>{task.status}</Badge>
            <Badge variant="outline">{task.priority}</Badge>
            <Badge variant="secondary">{task.api_type}</Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Project</label>
              <p className="text-sm text-gray-900 mt-1">{task.project?.name}</p>
            </div>

            {task.description && (
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {task.endpoint && (
              <div>
                <label className="text-sm font-medium text-gray-700">Endpoint</label>
                <p className="text-sm text-gray-900 mt-1 font-mono">
                  {task.method} {task.endpoint}
                </p>
              </div>
            )}

            {task.assignee && (
              <div>
                <label className="text-sm font-medium text-gray-700">Assignee</label>
                <p className="text-sm text-gray-900 mt-1">{task.assignee}</p>
              </div>
            )}
          </div>

          {/* Mock API Section */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold mb-4">Mock API</h3>

            {/* Mock URL */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700">Mock API URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded border overflow-x-auto">
                  {mockUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(mockUrl)}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Test Section */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value)}
                  className="text-sm border rounded-md px-3 py-2"
                >
                  {mockResponses?.map((response) => (
                    <option key={response.scenario} value={response.scenario}>
                      {response.scenario} ({response.status_code})
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleTest}
                  disabled={testing}
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-2" />
                      Test
                    </>
                  )}
                </Button>
              </div>

              {testResult && (
                <div className="mt-3">
                  <label className="text-xs font-medium text-gray-700">Response</label>
                  <pre className="mt-1 text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Mock Responses */}
            {mockResponses && mockResponses.length > 0 && (
              <Tabs defaultValue={mockResponses[0].scenario} className="mt-6">
                <TabsList>
                  {mockResponses.map((response) => (
                    <TabsTrigger key={response.scenario} value={response.scenario}>
                      {response.scenario}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {mockResponses.map((response) => (
                  <TabsContent key={response.scenario} value={response.scenario}>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-gray-700">Status Code</label>
                        <p className="text-sm mt-1">{response.status_code}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">Response Data</label>
                        <pre className="mt-1 text-xs bg-gray-100 p-3 rounded overflow-x-auto border">
                          {JSON.stringify(response.response_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          {/* Contract */}
          {task.contract && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold mb-2">API Contract</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto border">
                {JSON.stringify(task.contract, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <TaskFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          task={task}
        />
      </SheetContent>
    </Sheet>
  )
}
