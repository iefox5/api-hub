import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'
import type { Project } from '../types'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Project[]
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Project
    },
    enabled: !!id,
  })
}
