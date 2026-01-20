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
