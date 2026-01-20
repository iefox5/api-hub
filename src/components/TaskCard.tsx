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
