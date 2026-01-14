import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { MockResponse } from '../types'

export function useMockResponses(taskId: string) {
  return useQuery({
    queryKey: ['mock_responses', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mock_responses')
        .select('*')
        .eq('task_id', taskId)
        .order('scenario')

      if (error) throw error
      return data as MockResponse[]
    },
    enabled: !!taskId,
  })
}

export async function callMockApi(taskId: string, scenario: string = 'success') {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const mockUrl = `${supabaseUrl}/functions/v1/mock/${taskId}`

  const response = await fetch(mockUrl, {
    method: 'GET',
    headers: {
      'x-mock-scenario': scenario,
    },
  })

  const data = await response.json()

  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    data,
  }
}
