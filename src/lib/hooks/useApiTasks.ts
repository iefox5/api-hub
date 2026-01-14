import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { ApiTask, TaskStatus } from '../types'

export function useApiTasks(filters?: {
  projectId?: string
  status?: TaskStatus
  priority?: string
}) {
  return useQuery({
    queryKey: ['api_tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('api_tasks')
        .select(`
          *,
          project:projects(*)
        `)
        .order('created_at', { ascending: false })

      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }

      const { data, error } = await query

      if (error) throw error
      return data as ApiTask[]
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { data, error } = await supabase
        .from('api_tasks')
        .update({ status })
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
