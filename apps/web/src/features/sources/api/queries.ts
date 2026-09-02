import { useQuery } from '@tanstack/react-query'
import type { ListSourcesQuery } from '@guardiola-foundry/shared-types'

import { getSource, listSources } from '@/features/sources/api/endpoints'

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
