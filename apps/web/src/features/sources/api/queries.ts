import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateSourceRequest,
  ListSourcesQuery,
  UpdateSourceRequest,
} from '@guardiola-foundry/shared-types'

import {
  createSource,
  getCurrencyConversionRate,
  getSource,
  listSources,
  restoreSource,
  retireSource,
  updateSource,
} from '@/features/sources/api/endpoints'

const sourceListQueryKey = ['sources', 'list'] as const
const currencyConversionRateQueryKey = ['currency-conversion-rate'] as const

function sourceDetailQueryKey(sourceId: string) {
  return ['sources', 'detail', sourceId] as const
}

export function useSourceList(token: string, filters: ListSourcesQuery) {
  return useQuery({
    queryKey: [...sourceListQueryKey, filters],
    queryFn: () => listSources(token, filters),
  })
}

export function useCurrencyConversionRate(token: string) {
  return useQuery({
    queryKey: currencyConversionRateQueryKey,
    queryFn: () => getCurrencyConversionRate(token),
  })
}

export function useSourceDetail(token: string, sourceId: string) {
  return useQuery({
    queryKey: sourceDetailQueryKey(sourceId),
    queryFn: () => getSource(token, sourceId),
  })
}

export function useCreateSource(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSourceRequest) => createSource(token, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sourceListQueryKey })
    },
  })
}

export function useUpdateSource(token: string, sourceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateSourceRequest) =>
      updateSource(token, sourceId, payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(sourceDetailQueryKey(sourceId), response)
      await queryClient.invalidateQueries({ queryKey: sourceListQueryKey })
    },
  })
}

export function useRetireSource(token: string, sourceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => retireSource(token, sourceId),
    onSuccess: async (response) => {
      queryClient.setQueryData(sourceDetailQueryKey(sourceId), response)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sourceListQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['materials'] }),
      ])
    },
  })
}

export function useRestoreSource(token: string, sourceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => restoreSource(token, sourceId),
    onSuccess: async (response) => {
      queryClient.setQueryData(sourceDetailQueryKey(sourceId), response)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sourceListQueryKey }),
        queryClient.invalidateQueries({ queryKey: ['materials'] }),
      ])
    },
  })
}
