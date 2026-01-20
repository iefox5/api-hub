import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
