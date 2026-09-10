import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AssociateBillOfMaterialsTemplateProductRequest,
  CreateBillOfMaterialsTemplateRequest,
  ProductSummary,
} from '@guardiola-foundry/shared-types'

import { listProducts } from '@/features/products/api/endpoints'
import {
  associateBillOfMaterialsTemplateProduct,
  createBillOfMaterialsTemplate,
  listBillsOfMaterials,
} from './endpoints'

const billsOfMaterialsQueryKey = ['bills-of-materials'] as const
const templateProductCandidatesQueryKey = [
  'bills-of-materials',
  'template-product-candidates',
] as const

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

export function useTemplateProductCandidates(token: string, enabled: boolean) {
  const query = useQuery({
    queryKey: templateProductCandidatesQueryKey,
    enabled,
    queryFn: async () => {
      const [productsResponse, billsOfMaterialsResponse] = await Promise.all([
        listProducts(token),
        listBillsOfMaterials(token),
      ])
      const occupiedProductIds = new Set(
        billsOfMaterialsResponse.billsOfMaterials.flatMap((billOfMaterials) =>
          billOfMaterials.kind === 'template' && billOfMaterials.product
            ? [billOfMaterials.product.id]
            : [],
        ),
      )

      return productsResponse.products.filter(
        (product): product is ProductSummary =>
          product.productStatus === 'active' &&
          !product.deletedAt &&
          !occupiedProductIds.has(product.id),
      )
    },
  })

  return {
    candidates: query.data ?? [],
    isLoading: query.isLoading,
    loadError: query.error,
  }
}

export function useAssociateBillOfMaterialsTemplateProduct(
  token: string,
  billOfMaterialsId: string,
) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: AssociateBillOfMaterialsTemplateProductRequest) =>
      associateBillOfMaterialsTemplateProduct(
        token,
        billOfMaterialsId,
        payload,
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: billsOfMaterialsQueryKey }),
        queryClient.invalidateQueries({
          queryKey: templateProductCandidatesQueryKey,
        }),
      ])
    },
  })

  return {
    associateProduct: mutation.mutateAsync,
    isAssociating: mutation.isPending,
    associationError: mutation.error,
  }
}
