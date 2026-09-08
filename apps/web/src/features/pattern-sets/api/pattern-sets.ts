import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  PatternSet,
  PatternSetMutationRequest,
} from '@guardiola-foundry/shared-types'

import {
  createPatternSet,
  listPatternSets,
  restorePatternSet,
  retirePatternSet,
  updatePatternSet,
} from './endpoints'

const patternSetsQueryPrefix = ['pattern-sets'] as const

export function usePatternSets(token: string, includeRetired: boolean) {
  const queryClient = useQueryClient()
  const listQuery = useQuery({
    queryKey: [
      ...patternSetsQueryPrefix,
      includeRetired ? 'include-retired' : 'active',
    ],
    queryFn: () => listPatternSets(token, includeRetired),
  })
  const saveMutation = useMutation({
    mutationFn: ({
      current,
      values,
    }: {
      current: PatternSet | null
      values: PatternSetMutationRequest
    }) =>
      current
        ? updatePatternSet(token, current.id, values)
        : createPatternSet(token, values),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: patternSetsQueryPrefix }),
  })
  const retireMutation = useMutation({
    mutationFn: (patternSetId: string) => retirePatternSet(token, patternSetId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: patternSetsQueryPrefix }),
  })
  const restoreMutation = useMutation({
    mutationFn: (patternSetId: string) =>
      restorePatternSet(token, patternSetId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: patternSetsQueryPrefix }),
  })

  return {
    patternSets: listQuery.data?.patternSets ?? [],
    isLoading: listQuery.isLoading,
    loadError: listQuery.error,
    isSaving: saveMutation.isPending,
    isChangingStatus: retireMutation.isPending || restoreMutation.isPending,
    saveError: saveMutation.error,
    statusError: retireMutation.error ?? restoreMutation.error,
    savePatternSet: saveMutation.mutateAsync,
    retirePatternSet: retireMutation.mutateAsync,
    restorePatternSet: restoreMutation.mutateAsync,
  }
}
