import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AssociateBillOfMaterialsTemplateProductRequest,
  ApplyBillOfMaterialsTemplateRequest,
  CreateBillOfMaterialsRequest,
  ProductSummary,
  UpdateBillOfMaterialsRequest,
} from '@guardiola-foundry/shared-types'

import { listProducts } from '@/features/products/api/endpoints'
import {
  associateBillOfMaterialsTemplateProduct,
  applyBillOfMaterialsTemplate,
  createBillOfMaterials,
  getBillOfMaterials,
  listBillsOfMaterials,
  searchProductVariantCandidates,
  updateBillOfMaterials,
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

export function useCreateBillOfMaterials(token: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: CreateBillOfMaterialsRequest) =>
      createBillOfMaterials(token, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: billsOfMaterialsQueryKey }),
  })

  return {
    createBillOfMaterials: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  }
}

export function useBillOfMaterials(token: string, billOfMaterialsId: string) {
  return useQuery({
    queryKey: [...billsOfMaterialsQueryKey, billOfMaterialsId],
    queryFn: () => getBillOfMaterials(token, billOfMaterialsId),
  })
}

export function useUpdateBillOfMaterials(
  token: string,
  billOfMaterialsId: string,
) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: UpdateBillOfMaterialsRequest) =>
      updateBillOfMaterials(token, billOfMaterialsId, payload),
    onSuccess: (billOfMaterials) => {
      queryClient.setQueryData(
        [...billsOfMaterialsQueryKey, billOfMaterialsId],
        billOfMaterials,
      )
      return queryClient.invalidateQueries({
        queryKey: billsOfMaterialsQueryKey,
        exact: true,
      })
    },
  })

  return {
    updateBillOfMaterials: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
    resetSaveError: mutation.reset,
  }
}

export function useProductVariantCandidates(
  token: string,
  search: string,
  templateId?: string,
) {
  return useQuery({
    queryKey: [
      'bills-of-materials',
      'product-variant-candidates',
      templateId ?? 'manual',
      search,
    ],
    queryFn: ({ signal }) =>
      searchProductVariantCandidates(token, search, templateId, signal),
    enabled: search.length > 0,
    staleTime: 30_000,
  })
}

export function useApplyBillOfMaterialsTemplate(token: string, templateId: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: ApplyBillOfMaterialsTemplateRequest) =>
      applyBillOfMaterialsTemplate(token, templateId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: billsOfMaterialsQueryKey }),
  })

  return {
    applyTemplate: mutation.mutateAsync,
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
