import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  LinkMaterialSourceRequest,
  ReplacePreferredSourceRequest,
} from '@guardiola-foundry/shared-types'

import {
  getMaterial,
  linkMaterialSource,
  listMaterials,
  replacePreferredSource,
  searchMaterials,
  unlinkMaterialSource,
} from '@/features/materials/api/endpoints'
import {
  materialDetailQueryKey,
  materialListQueryKey,
} from '@/features/materials/query-keys'
import { ApiRequestError } from '@/lib/api/transport'

export function useMaterialList(token: string) {
  return useQuery({
    queryKey: materialListQueryKey,
    queryFn: () => listMaterials(token),
  })
}

export function useMaterialDetail(token: string, materialId: string) {
  return useQuery({
    queryKey: materialDetailQueryKey(materialId),
    queryFn: () => getMaterial(token, materialId),
  })
}

export function useMaterialSearch(token: string, search: string) {
  const query = useQuery({
    queryKey: ['materials', 'search', search],
    queryFn: ({ signal }) => searchMaterials(token, search, signal),
    enabled: search.length > 0,
    staleTime: 30_000,
  })

  return {
    ...query,
    isErrorRetryable: isCatalogSearchErrorRetryable(query.error),
  }
}

function isCatalogSearchErrorRetryable(error: Error | null) {
  return !(
    error instanceof ApiRequestError && [401, 403].includes(error.status)
  )
}

export function useLinkMaterialSource(token: string, materialId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LinkMaterialSourceRequest) =>
      linkMaterialSource(token, materialId, payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(materialDetailQueryKey(materialId), response)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: materialListQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['sources'] }),
      ])
    },
  })
}

export function useUnlinkMaterialSource(token: string, materialId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sourceId: string) =>
      unlinkMaterialSource(token, materialId, sourceId),
    onSuccess: async (response) => {
      queryClient.setQueryData(materialDetailQueryKey(materialId), response)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: materialListQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['sources'] }),
      ])
    },
  })
}

export function useReplacePreferredSource(token: string, materialId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ReplacePreferredSourceRequest) =>
      replacePreferredSource(token, materialId, payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(materialDetailQueryKey(materialId), response)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: materialListQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['sources'] }),
      ])
    },
  })
}
