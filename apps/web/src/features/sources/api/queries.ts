import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateSourceRequest,
  ListSourcesQuery,
} from '@guardiola-foundry/shared-types'

import {
  createSource,
  getSource,
  listSources,
} from '@/features/sources/api/endpoints'

export function useSourceList(token: string, filters: ListSourcesQuery) {
  return useQuery({
    queryKey: ['sources', filters],
    queryFn: () => listSources(token, filters),
  })
}

export function useSourceDetail(token: string, sourceId: string) {
  return useQuery({
    queryKey: ['sources', 'detail', sourceId],
    queryFn: () => getSource(token, sourceId),
  })
}

export function useCreateSource(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSourceRequest) => createSource(token, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sources'] })
    },
  })
}
