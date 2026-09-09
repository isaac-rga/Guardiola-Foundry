import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateBillOfMaterialsTemplateRequest } from '@guardiola-foundry/shared-types'

import {
  createBillOfMaterialsTemplate,
  listBillsOfMaterials,
} from './endpoints'

const billsOfMaterialsQueryKey = ['bills-of-materials'] as const

export function useBillsOfMaterials(token: string) {
  const query = useQuery({
    queryKey: billsOfMaterialsQueryKey,
    queryFn: () => listBillsOfMaterials(token),
  })

  return {
    billsOfMaterials: query.data?.billsOfMaterials ?? [],
    isLoading: query.isLoading,
    loadError: query.error,
  }
}

export function useCreateBillOfMaterialsTemplate(token: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: CreateBillOfMaterialsTemplateRequest) =>
      createBillOfMaterialsTemplate(token, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: billsOfMaterialsQueryKey }),
  })

  return {
    createTemplate: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  }
}
