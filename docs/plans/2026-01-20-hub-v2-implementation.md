# Hub V2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add task CRUD, drag-and-drop kanban, mock editor, contract editor, and documentation export to API Hub.

**Architecture:** Extend existing React + Supabase stack. Add @dnd-kit for drag-drop, @scalar for GraphQL docs. All state management via TanStack Query hooks.

**Tech Stack:** React 18, TypeScript, Supabase, TanStack Query, @dnd-kit, @scalar/api-reference-react, Tailwind CSS

---

## Task 1: Task Edit Functionality

**Files:**
- Modify: `src/lib/hooks/useApiTasks.ts`
- Modify: `src/components/CreateTaskDialog.tsx` → rename to `TaskFormDialog.tsx`
- Modify: `src/components/TaskDetailSheet.tsx`
- Modify: `src/pages/TasksPage.tsx`

### Step 1.1: Add useUpdateTask hook

Open `src/lib/hooks/useApiTasks.ts` and add after `useCreateApiTask`:

```typescript
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ApiTask> & { id: string }) => {
      const { data, error } = await supabase
        .from('api_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_tasks'] })
    },
  })
}
```

### Step 1.2: Verify hook compiles

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

### Step 1.3: Rename CreateTaskDialog to TaskFormDialog

```bash
mv src/components/CreateTaskDialog.tsx src/components/TaskFormDialog.tsx
```

### Step 1.4: Update TaskFormDialog to support edit mode

Replace entire `src/components/TaskFormDialog.tsx`:

```typescript
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
```

### Step 1.5: Update TasksPage imports

In `src/pages/TasksPage.tsx`, change:

```typescript
// Before
import { CreateTaskDialog } from '@/components/CreateTaskDialog'

// After
import { TaskFormDialog } from '@/components/TaskFormDialog'
```

And update the component usage:

```typescript
// Before
<CreateTaskDialog
  open={createDialogOpen}
  onOpenChange={setCreateDialogOpen}
/>

// After
<TaskFormDialog
  open={createDialogOpen}
  onOpenChange={setCreateDialogOpen}
/>
```

### Step 1.6: Add Edit button to TaskDetailSheet

In `src/components/TaskDetailSheet.tsx`, add imports and state:

```typescript
// Add to imports
import { Pencil } from 'lucide-react'
import { TaskFormDialog } from './TaskFormDialog'

// Add state in component
const [editDialogOpen, setEditDialogOpen] = useState(false)
```

Add Edit button in SheetHeader (after SheetDescription):

```typescript
<SheetHeader>
  <div className="flex items-center justify-between">
    <SheetTitle className="text-xl">{task.title}</SheetTitle>
    <Button
      size="sm"
      variant="outline"
      onClick={() => setEditDialogOpen(true)}
    >
      <Pencil className="w-4 h-4 mr-1" />
      Edit
    </Button>
  </div>
  <SheetDescription className="flex items-center gap-2 mt-2">
    <Badge>{task.status}</Badge>
    <Badge variant="outline">{task.priority}</Badge>
    <Badge variant="secondary">{task.api_type}</Badge>
  </SheetDescription>
</SheetHeader>
```

Add dialog at end of Sheet (before closing `</Sheet>`):

```typescript
<TaskFormDialog
  open={editDialogOpen}
  onOpenChange={setEditDialogOpen}
  task={task}
/>
```

### Step 1.7: Build and verify

Run: `npm run build`
Expected: Build succeeds

### Step 1.8: Commit Task 1

```bash
git add -A
git commit -m "feat: add task edit functionality

- Add useUpdateTask hook
- Rename CreateTaskDialog to TaskFormDialog
- Support edit mode with pre-populated form
- Add Edit button in TaskDetailSheet

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Task Delete Functionality

**Files:**
- Modify: `src/lib/hooks/useApiTasks.ts`
- Create: `src/components/ui/alert-dialog.tsx`
- Modify: `src/components/TaskDetailSheet.tsx`

### Step 2.1: Add useDeleteTask hook

In `src/lib/hooks/useApiTasks.ts`, add after `useUpdateTask`:

```typescript
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_tasks'] })
    },
  })
}
```

### Step 2.2: Create AlertDialog component

Create `src/components/ui/alert-dialog.tsx`:

```typescript
import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root
const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
```

### Step 2.3: Install radix alert-dialog

Run: `npm install @radix-ui/react-alert-dialog`

### Step 2.4: Add Delete button to TaskDetailSheet

In `src/components/TaskDetailSheet.tsx`, add imports:

```typescript
import { Trash2 } from 'lucide-react'
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
```

Add hook and state:

```typescript
const deleteTask = useDeleteTask()
```

Add Delete button next to Edit button in header:

```typescript
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
```

### Step 2.5: Build and verify

Run: `npm run build`
Expected: Build succeeds

### Step 2.6: Commit Task 2

```bash
git add -A
git commit -m "feat: add task delete functionality

- Add useDeleteTask hook
- Create AlertDialog component
- Add Delete button with confirmation in TaskDetailSheet

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Drag-and-Drop Status Update

**Files:**
- Modify: `package.json` (add @dnd-kit)
- Create: `src/components/KanbanColumn.tsx`
- Modify: `src/components/TaskCard.tsx`
- Modify: `src/pages/TasksPage.tsx`

### Step 3.1: Install @dnd-kit

Run: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`

### Step 3.2: Create KanbanColumn component

Create `src/components/KanbanColumn.tsx`:

```typescript
import { useDroppable } from '@dnd-kit/core'
import type { TaskStatus } from '@/lib/types'

interface KanbanColumnProps {
  status: TaskStatus
  label: string
  color: string
  children: React.ReactNode
  isOver?: boolean
}

export function KanbanColumn({ status, label, color, children, isOver }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
  })

  return (
    <div className="flex flex-col">
      {/* Column header */}
      <div className={`p-3 rounded-t-lg ${color}`}>
        <h3 className="font-semibold text-sm">{label}</h3>
      </div>

      {/* Column content */}
      <div
        ref={setNodeRef}
        className={`flex-1 rounded-b-lg p-3 space-y-3 min-h-[400px] transition-colors ${
          isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : 'bg-gray-50'
        }`}
      >
        {children}
      </div>
    </div>
  )
}
```

### Step 3.3: Update TaskCard for dragging

Replace `src/components/TaskCard.tsx`:

```typescript
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader } from './ui/card'
import type { ApiTask } from '@/lib/types'
import { Database, Code, Webhook, Workflow, GripVertical } from 'lucide-react'

const priorityColors = {
  P0: 'bg-red-100 text-red-800 border-red-200',
  P1: 'bg-orange-100 text-orange-800 border-orange-200',
  P2: 'bg-blue-100 text-blue-800 border-blue-200',
  P3: 'bg-gray-100 text-gray-800 border-gray-200',
}

const apiTypeIcons = {
  graphql: Database,
  rest: Code,
  'edge-function': Webhook,
  n8n: Workflow,
}

interface TaskCardProps {
  task: ApiTask
  onClick?: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const Icon = apiTypeIcons[task.api_type]

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-400 hover:text-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <h3 className="font-medium text-sm line-clamp-2 flex-1">
            {task.title}
          </h3>
          <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {task.project && (
          <Badge variant="secondary" className="text-xs">
            {task.project.name}
          </Badge>
        )}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${priorityColors[task.priority]}`}
          >
            {task.priority}
          </Badge>
          {task.assignee && (
            <span className="text-xs text-gray-600">{task.assignee}</span>
          )}
        </div>
        {task.endpoint && (
          <div className="text-xs text-gray-500 truncate">
            {task.method} {task.endpoint}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### Step 3.4: Update TasksPage with DnD context

Replace `src/pages/TasksPage.tsx`:

```typescript
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
```

### Step 3.5: Build and verify

Run: `npm run build`
Expected: Build succeeds

### Step 3.6: Commit Task 3

```bash
git add -A
git commit -m "feat: add drag-and-drop for task status updates

- Install @dnd-kit/core and @dnd-kit/sortable
- Create KanbanColumn droppable component
- Make TaskCard draggable with grip handle
- Implement DndContext in TasksPage with visual feedback

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Mock Data Editor

**Files:**
- Modify: `src/lib/hooks/useMockResponses.ts`
- Create: `src/components/MockEditor.tsx`
- Modify: `src/components/TaskDetailSheet.tsx`

### Step 4.1: Add mutation hooks to useMockResponses

In `src/lib/hooks/useMockResponses.ts`, add:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { MockResponse } from '../types'

// ... existing useMockResponses function ...

export function useUpsertMockResponse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      scenario,
      statusCode,
      responseData,
    }: {
      taskId: string
      scenario: string
      statusCode: number
      responseData: any
    }) => {
      const { data, error } = await supabase
        .from('mock_responses')
        .upsert(
          {
            task_id: taskId,
            scenario,
            status_code: statusCode,
            response_data: responseData,
          },
          { onConflict: 'task_id,scenario' }
        )
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mock_responses', variables.taskId] })
    },
  })
}

export function useDeleteMockResponse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, scenario }: { taskId: string; scenario: string }) => {
      const { error } = await supabase
        .from('mock_responses')
        .delete()
        .eq('task_id', taskId)
        .eq('scenario', scenario)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mock_responses', variables.taskId] })
    },
  })
}
```

### Step 4.2: Create MockEditor component

Create `src/components/MockEditor.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { useUpsertMockResponse } from '@/lib/hooks/useMockResponses'
import { Save, AlertCircle } from 'lucide-react'
import type { MockResponse } from '@/lib/types'

interface MockEditorProps {
  taskId: string
  mockResponse?: MockResponse
  scenario: string
  onSaved?: () => void
}

export function MockEditor({ taskId, mockResponse, scenario, onSaved }: MockEditorProps) {
  const [statusCode, setStatusCode] = useState(mockResponse?.status_code || 200)
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const upsertMock = useUpsertMockResponse()

  useEffect(() => {
    if (mockResponse) {
      setJsonText(JSON.stringify(mockResponse.response_data, null, 2))
      setStatusCode(mockResponse.status_code)
    } else {
      // Default templates based on scenario
      const templates: Record<string, any> = {
        success: { data: [], message: 'Success' },
        empty: { data: [], message: 'No data found' },
        error: { error: 'Internal Server Error', code: 'INTERNAL_ERROR' },
      }
      setJsonText(JSON.stringify(templates[scenario] || {}, null, 2))
      setStatusCode(scenario === 'error' ? 500 : 200)
    }
    setIsDirty(false)
    setError(null)
  }, [mockResponse, scenario])

  const handleJsonChange = (value: string) => {
    setJsonText(value)
    setIsDirty(true)
    setError(null)

    // Validate JSON
    try {
      JSON.parse(value)
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`)
    }
  }

  const handleSave = async () => {
    try {
      const responseData = JSON.parse(jsonText)
      await upsertMock.mutateAsync({
        taskId,
        scenario,
        statusCode,
        responseData,
      })
      setIsDirty(false)
      onSaved?.()
    } catch (e) {
      setError(`Save failed: ${(e as Error).message}`)
    }
  }

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm capitalize">{scenario}</h4>
        <div className="flex items-center gap-2">
          <Label htmlFor={`status-${scenario}`} className="text-xs">
            Status:
          </Label>
          <Input
            id={`status-${scenario}`}
            type="number"
            min={100}
            max={599}
            value={statusCode}
            onChange={(e) => {
              setStatusCode(parseInt(e.target.value) || 200)
              setIsDirty(true)
            }}
            className="w-20 h-8 text-sm"
          />
        </div>
      </div>

      <Textarea
        value={jsonText}
        onChange={(e) => handleJsonChange(e.target.value)}
        rows={6}
        className="font-mono text-xs"
        placeholder="Enter JSON response data..."
      />

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-xs">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!isDirty || !!error || upsertMock.isPending}
        >
          <Save className="w-3 h-3 mr-1" />
          {upsertMock.isPending ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
```

### Step 4.3: Update TaskDetailSheet with MockEditor

In `src/components/TaskDetailSheet.tsx`, add import:

```typescript
import { MockEditor } from './MockEditor'
```

Replace the Mock Responses section (the Tabs component) with:

```typescript
{/* Mock Responses - Editable */}
<div className="mt-6 space-y-4">
  <h4 className="text-sm font-medium text-gray-700">Mock Responses</h4>
  {['success', 'empty', 'error'].map((scenario) => {
    const existingResponse = mockResponses?.find((r) => r.scenario === scenario)
    return (
      <MockEditor
        key={scenario}
        taskId={task.id}
        scenario={scenario}
        mockResponse={existingResponse}
      />
    )
  })}
</div>
```

### Step 4.4: Build and verify

Run: `npm run build`
Expected: Build succeeds

### Step 4.5: Commit Task 4

```bash
git add -A
git commit -m "feat: add Mock data editor

- Add useUpsertMockResponse and useDeleteMockResponse hooks
- Create MockEditor component with JSON validation
- Integrate editable mock responses in TaskDetailSheet

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: API Contract Editor

**Files:**
- Create: `src/components/ContractEditor.tsx`
- Modify: `src/components/TaskDetailSheet.tsx`
- Modify: `src/lib/types.ts`

### Step 5.1: Add ApiContract type

In `src/lib/types.ts`, add:

```typescript
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
```

### Step 5.2: Create ContractEditor component

Create `src/components/ContractEditor.tsx`:

```typescript
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { useUpdateTask } from '@/lib/hooks/useApiTasks'
import { Save, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import type { ApiTask, ApiContract } from '@/lib/types'

interface ContractEditorProps {
  task: ApiTask
}

const defaultContract: ApiContract = {
  request: {
    headers: {},
    params: {},
    query: {},
    body: {},
  },
  response: {
    '200': {
      description: 'Success response',
      body: {},
    },
  },
}

export function ContractEditor({ task }: ContractEditorProps) {
  const [expanded, setExpanded] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const updateTask = useUpdateTask()

  useEffect(() => {
    const contract = task.contract || defaultContract
    setJsonText(JSON.stringify(contract, null, 2))
    setIsDirty(false)
    setError(null)
  }, [task.contract])

  const handleJsonChange = (value: string) => {
    setJsonText(value)
    setIsDirty(true)
    setError(null)

    try {
      JSON.parse(value)
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`)
    }
  }

  const handleSave = async () => {
    try {
      const contract = JSON.parse(jsonText)
      await updateTask.mutateAsync({
        id: task.id,
        contract,
      })
      setIsDirty(false)
    } catch (e) {
      setError(`Save failed: ${(e as Error).message}`)
    }
  }

  return (
    <div className="border-t pt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-semibold mb-4 hover:text-gray-700"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        API Contract
      </button>

      {expanded && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Define the request/response structure for this API. This helps frontend developers understand the expected data format.
          </p>

          <Textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={15}
            className="font-mono text-xs"
            placeholder="Enter API contract JSON..."
          />

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || !!error || updateTask.isPending}
            >
              <Save className="w-3 h-3 mr-1" />
              {updateTask.isPending ? 'Saving...' : 'Save Contract'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

### Step 5.3: Add ContractEditor to TaskDetailSheet

In `src/components/TaskDetailSheet.tsx`, add import:

```typescript
import { ContractEditor } from './ContractEditor'
```

Replace the existing Contract section with:

```typescript
{/* Contract Editor */}
<ContractEditor task={task} />
```

### Step 5.4: Build and verify

Run: `npm run build`
Expected: Build succeeds

### Step 5.5: Commit Task 5

```bash
git add -A
git commit -m "feat: add API contract editor

- Add ApiContract type definition
- Create ContractEditor component with collapsible JSON editor
- Integrate contract editing in TaskDetailSheet

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Export API Documentation

**Files:**
- Create: `src/lib/exporters/openapi.ts`
- Create: `src/lib/exporters/markdown.ts`
- Modify: `src/pages/DocsPage.tsx`

### Step 6.1: Install js-yaml

Run: `npm install js-yaml && npm install -D @types/js-yaml`

### Step 6.2: Create OpenAPI exporter

Create `src/lib/exporters/openapi.ts`:

```typescript
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
        for (const [name, def] of Object.entries(params)) {
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
        for (const [name, def] of Object.entries(query)) {
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
      for (const [code, response] of Object.entries(task.contract.response)) {
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
```

### Step 6.3: Create Markdown exporter

Create `src/lib/exporters/markdown.ts`:

```typescript
import type { ApiTask, Project } from '../types'

export function exportMarkdown(project: Project, tasks: ApiTask[]): string {
  const doneTasks = tasks.filter((t) => t.status === 'done')

  let md = `# ${project.name} API Documentation\n\n`

  if (project.description) {
    md += `${project.description}\n\n`
  }

  if (project.graphql_endpoint) {
    md += `**Endpoint:** \`${project.graphql_endpoint}\`\n\n`
  }

  md += `---\n\n`
  md += `## APIs\n\n`

  for (const task of doneTasks) {
    md += `### ${task.title}\n\n`

    if (task.description) {
      md += `${task.description}\n\n`
    }

    if (task.endpoint) {
      md += `**Endpoint:** \`${task.method || 'GET'} ${task.endpoint}\`\n\n`
    }

    md += `**Type:** ${task.api_type}\n\n`
    md += `**Priority:** ${task.priority}\n\n`

    if (task.contract) {
      md += `#### Contract\n\n`
      md += '```json\n'
      md += JSON.stringify(task.contract, null, 2)
      md += '\n```\n\n'
    }

    md += `---\n\n`
  }

  md += `\n*Generated on ${new Date().toISOString().split('T')[0]}*\n`

  return md
}
```

### Step 6.4: Update DocsPage with export button

First, read the current DocsPage to understand its structure, then add export functionality.

In `src/pages/DocsPage.tsx`, add imports:

```typescript
import { Download } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { exportOpenApiJson, exportOpenApiYaml } from '@/lib/exporters/openapi'
import { exportMarkdown } from '@/lib/exporters/markdown'
```

Add export handler function inside component:

```typescript
const handleExport = (format: string) => {
  if (!selectedProject || !tasks) return

  const project = projects?.find((p) => p.id === selectedProject)
  if (!project) return

  let content: string
  let filename: string
  let mimeType: string
  const date = new Date().toISOString().split('T')[0]

  switch (format) {
    case 'openapi-json':
      content = exportOpenApiJson(project, tasks)
      filename = `${project.name}-api-${date}.json`
      mimeType = 'application/json'
      break
    case 'openapi-yaml':
      content = exportOpenApiYaml(project, tasks)
      filename = `${project.name}-api-${date}.yaml`
      mimeType = 'text/yaml'
      break
    case 'markdown':
      content = exportMarkdown(project, tasks)
      filename = `${project.name}-api-${date}.md`
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
```

Add export dropdown in the header (next to project selector):

```typescript
{selectedProject && (
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
```

### Step 6.5: Build and verify

Run: `npm run build`
Expected: Build succeeds

### Step 6.6: Commit Task 6

```bash
git add -A
git commit -m "feat: add API documentation export

- Create OpenAPI exporter (JSON and YAML)
- Create Markdown exporter
- Add export dropdown in DocsPage

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Scalar GraphQL Documentation

**Files:**
- Modify: `package.json` (add @scalar)
- Create: `src/pages/GraphQLDocsPage.tsx`
- Modify: `src/components/Layout.tsx`
- Modify: `src/App.tsx`

### Step 7.1: Install Scalar

Run: `npm install @scalar/api-reference-react`

### Step 7.2: Create GraphQLDocsPage

Create `src/pages/GraphQLDocsPage.tsx`:

```typescript
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
```

### Step 7.3: Add route in App.tsx

In `src/App.tsx`, add import:

```typescript
import { GraphQLDocsPage } from './pages/GraphQLDocsPage'
```

Add route (inside Routes):

```typescript
<Route path="/graphql-docs" element={<GraphQLDocsPage />} />
```

### Step 7.4: Add navigation link in Layout

In `src/components/Layout.tsx`, add import:

```typescript
import { Database } from 'lucide-react'
```

Add navigation item (in the nav links array):

```typescript
{ to: '/graphql-docs', icon: Database, label: 'GraphQL Docs' },
```

### Step 7.5: Build and verify

Run: `npm run build`
Expected: Build succeeds (may have warnings about Scalar bundle size)

### Step 7.6: Commit Task 7

```bash
git add -A
git commit -m "feat: add Scalar GraphQL documentation viewer

- Install @scalar/api-reference-react
- Create GraphQLDocsPage with project selector
- Add navigation link in Layout

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Final Steps

### Step F.1: Final build verification

Run: `npm run build`
Expected: Build succeeds with no errors

### Step F.2: Create final summary commit

```bash
git add -A
git commit -m "chore: Hub V2 implementation complete

Features added:
- Task edit and delete functionality
- Drag-and-drop kanban board
- Mock data editor
- API contract editor
- Export to OpenAPI/Markdown
- Scalar GraphQL documentation viewer

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

### Step F.3: Push feature branch

```bash
git push -u origin feature/hub-v2
```

---

## Summary

| Task | Description | Files Changed |
|------|-------------|---------------|
| T1 | Task Edit | useApiTasks.ts, TaskFormDialog.tsx, TaskDetailSheet.tsx |
| T2 | Task Delete | useApiTasks.ts, alert-dialog.tsx, TaskDetailSheet.tsx |
| T3 | Drag-and-Drop | KanbanColumn.tsx, TaskCard.tsx, TasksPage.tsx |
| T4 | Mock Editor | useMockResponses.ts, MockEditor.tsx, TaskDetailSheet.tsx |
| T5 | Contract Editor | ContractEditor.tsx, types.ts, TaskDetailSheet.tsx |
| T6 | Export Docs | openapi.ts, markdown.ts, DocsPage.tsx |
| T7 | Scalar GraphQL | GraphQLDocsPage.tsx, Layout.tsx, App.tsx |

**New Dependencies:**
- `@radix-ui/react-alert-dialog`
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `js-yaml`, `@types/js-yaml`
- `@scalar/api-reference-react`
