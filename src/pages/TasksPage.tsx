import { useState } from 'react'
import { useApiTasks } from '@/lib/hooks/useApiTasks'
import { useProjects } from '@/lib/hooks/useProjects'
import { TaskCard } from '@/components/TaskCard'
import { TaskFormDialog } from '@/components/TaskFormDialog'
import { TaskDetailSheet } from '@/components/TaskDetailSheet'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import type { TaskStatus, ApiTask } from '@/lib/types'

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'planning', label: 'Planning', color: 'bg-gray-50' },
  { status: 'mocking', label: 'Mocking', color: 'bg-yellow-50' },
  { status: 'developing', label: 'Developing', color: 'bg-blue-50' },
  { status: 'done', label: 'Done', color: 'bg-green-50' },
]

export function TasksPage() {
  const [selectedProject, setSelectedProject] = useState<string>()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null)
  const { data: tasks, isLoading } = useApiTasks({ projectId: selectedProject })
  const { data: projects } = useProjects()

  const tasksByStatus = tasks?.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = []
    acc[task.status].push(task)
    return acc
  }, {} as Record<TaskStatus, typeof tasks>)

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
            <h1 className="text-2xl font-bold text-gray-900">API Tasks</h1>
            <p className="text-sm text-gray-600 mt-1">
              {tasks?.length || 0} task{tasks?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Project filter */}
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value || undefined)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Projects</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="p-6 min-w-max">
          <div className="grid grid-cols-4 gap-4">
            {columns.map((column) => {
              const columnTasks = tasksByStatus?.[column.status] || []
              return (
                <div key={column.status} className="flex flex-col">
                  {/* Column header */}
                  <div className={`p-3 rounded-t-lg ${column.color}`}>
                    <h3 className="font-semibold text-sm">
                      {column.label}
                      <span className="ml-2 text-gray-500">
                        ({columnTasks.length})
                      </span>
                    </h3>
                  </div>

                  {/* Column content */}
                  <div className="flex-1 bg-gray-50 rounded-b-lg p-3 space-y-3 min-h-[400px]">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => setSelectedTask(task)}
                      />
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="text-center text-sm text-gray-400 py-8">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <TaskFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </div>
  )
}
