import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { useProjects } from '@/lib/hooks/useProjects'
import { useCreateApiTask, useUpdateTask } from '@/lib/hooks/useApiTasks'
import type { ApiTask, ApiType, PriorityLevel } from '@/lib/types'

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: ApiTask | null  // If provided, edit mode
}

const initialFormData = {
  title: '',
  description: '',
  project_id: '',
  api_type: 'rest' as ApiType,
  priority: 'P2' as PriorityLevel,
  endpoint: '',
  method: 'GET',
  assignee: '',
}

export function TaskFormDialog({ open, onOpenChange, task }: TaskFormDialogProps) {
  const { data: projects } = useProjects()
  const createTask = useCreateApiTask()
  const updateTask = useUpdateTask()

  const isEditMode = !!task

  const [formData, setFormData] = useState(initialFormData)

  // Populate form when editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        project_id: task.project_id,
        api_type: task.api_type,
        priority: task.priority,
        endpoint: task.endpoint || '',
        method: task.method || 'GET',
        assignee: task.assignee || '',
      })
    } else {
      setFormData(initialFormData)
    }
  }, [task, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEditMode && task) {
        await updateTask.mutateAsync({
          id: task.id,
          title: formData.title,
          description: formData.description || null,
          api_type: formData.api_type,
          priority: formData.priority,
          endpoint: formData.endpoint || null,
          method: formData.method || null,
          assignee: formData.assignee || null,
        })
      } else {
        await createTask.mutateAsync({
          ...formData,
          description: formData.description || null,
          endpoint: formData.endpoint || null,
          method: formData.method || null,
          assignee: formData.assignee || null,
          status: 'planning',
          contract: null,
          created_by: null,
        })
      }

      setFormData(initialFormData)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  const isPending = createTask.isPending || updateTask.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Create API Task'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the task details'
              : 'Create a new API development task for your project'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., User authentication API"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the API functionality..."
              rows={3}
            />
          </div>

          {/* Project and API Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select
                required
                value={formData.project_id}
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                disabled={isEditMode}  // Can't change project after creation
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_type">API Type *</Label>
              <Select
                value={formData.api_type}
                onValueChange={(value) => setFormData({ ...formData, api_type: value as ApiType })}
              >
                <SelectTrigger id="api_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="graphql">GraphQL</SelectItem>
                  <SelectItem value="rest">REST</SelectItem>
                  <SelectItem value="edge-function">Edge Function</SelectItem>
                  <SelectItem value="n8n">n8n Workflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority and Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as PriorityLevel })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P0">P0 - Critical</SelectItem>
                  <SelectItem value="P1">P1 - High</SelectItem>
                  <SelectItem value="P2">P2 - Medium</SelectItem>
                  <SelectItem value="P3">P3 - Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                placeholder="e.g., E019"
              />
            </div>
          </div>

          {/* Endpoint and Method */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                placeholder="/api/users"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Method</Label>
              <Select
                value={formData.method}
                onValueChange={(value) => setFormData({ ...formData, method: value })}
              >
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
