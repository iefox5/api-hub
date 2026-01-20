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
