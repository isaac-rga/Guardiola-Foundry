import { useQuery } from '@tanstack/react-query'
import type { ListSourcesQuery } from '@guardiola-foundry/shared-types'

import { listSources } from '@/features/sources/api/endpoints'

export function useSourceList(token: string, filters: ListSourcesQuery) {
  return useQuery({
    queryKey: ['sources', filters],
    queryFn: () => listSources(token, filters),
  })
}
