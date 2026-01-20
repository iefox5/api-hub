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
