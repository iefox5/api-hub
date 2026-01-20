import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useApiTasks, useUpdateTaskStatus } from '@/lib/hooks/useApiTasks'
import { useProjects } from '@/lib/hooks/useProjects'
import { TaskCard } from '@/components/TaskCard'
import { KanbanColumn } from '@/components/KanbanColumn'
import { TaskFormDialog } from '@/components/TaskFormDialog'
import { TaskDetailSheet } from '@/components/TaskDetailSheet'
import { Button } from '@/components/ui/button'
import { Loader2, Plus } from 'lucide-react'
import type { TaskStatus, ApiTask } from '@/lib/types'

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'planning', label: 'Planning', color: 'bg-gray-100' },
  { status: 'mocking', label: 'Mocking', color: 'bg-yellow-100' },
  { status: 'developing', label: 'Developing', color: 'bg-blue-100' },
  { status: 'done', label: 'Done', color: 'bg-green-100' },
]

export function TasksPage() {
  const [selectedProject, setSelectedProject] = useState<string>()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null)
  const [activeTask, setActiveTask] = useState<ApiTask | null>(null)
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null)

  const { data: tasks, isLoading } = useApiTasks({ projectId: selectedProject })
  const { data: projects } = useProjects()
  const updateStatus = useUpdateTaskStatus()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const tasksByStatus = tasks?.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = []
    acc[task.status].push(task)
    return acc
  }, {} as Record<TaskStatus, ApiTask[]>)

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as ApiTask
    setActiveTask(task)
  }

  const handleDragOver = (event: any) => {
    const overId = event.over?.id as TaskStatus | null
    if (overId && columns.some((c) => c.status === overId)) {
      setOverColumn(overId)
    } else {
      setOverColumn(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setOverColumn(null)

    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as TaskStatus
    const task = tasks?.find((t) => t.id === taskId)

    if (!task || task.status === newStatus) return

    // Optimistic update
    try {
      await updateStatus.mutateAsync({ id: taskId, status: newStatus })
    } catch (error) {
      console.error('Failed to update task status:', error)
      // TODO: Add toast notification for error
    }
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
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-4 gap-4">
              {columns.map((column) => {
                const columnTasks = tasksByStatus?.[column.status] || []
                return (
                  <KanbanColumn
                    key={column.status}
                    status={column.status}
                    label={`${column.label} (${columnTasks.length})`}
                    color={column.color}
                    isOver={overColumn === column.status}
                  >
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
                  </KanbanColumn>
                )
              })}
            </div>

            <DragOverlay>
              {activeTask ? (
                <div className="rotate-3 opacity-90">
                  <TaskCard task={activeTask} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
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
