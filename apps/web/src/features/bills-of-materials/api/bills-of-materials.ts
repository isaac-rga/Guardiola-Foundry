import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AssociateBillOfMaterialsTemplateProductRequest,
  ApplyBillOfMaterialsTemplateRequest,
  CreateBillOfMaterialsRequest,
  DeriveBillOfMaterialsTemplateRequest,
  ListBillsOfMaterialsQuery,
  ProductSummary,
  UpdateBillOfMaterialsRequest,
} from '@guardiola-foundry/shared-types'

import { listProducts } from '@/features/products/api/endpoints'
import { ApiRequestError } from '@/lib/api/transport'
import {
  invalidateProductVariantCandidates,
  productVariantCandidatesQueryKey,
} from './query-keys'
import {
  associateBillOfMaterialsTemplateProduct,
  applyBillOfMaterialsTemplate,
  createBillOfMaterials,
  deleteBillOfMaterials,
  deriveBillOfMaterialsTemplate,
  getBillOfMaterials,
  listBillsOfMaterials,
  restoreBillOfMaterials,
  searchProductVariantCandidates,
  updateBillOfMaterials,
} from './endpoints'

const billsOfMaterialsQueryKey = ['bills-of-materials'] as const
const templateProductCandidatesQueryKey = [
  'bills-of-materials',
  'template-product-candidates',
] as const

export function useBillsOfMaterials(
  token: string,
  filters: ListBillsOfMaterialsQuery = {},
) {
  const query = useQuery({
    queryKey: [...billsOfMaterialsQueryKey, filters],
    queryFn: () => listBillsOfMaterials(token, filters),
  })

  return {
    billsOfMaterials: query.data?.billsOfMaterials ?? [],
    summary: query.data?.summary ?? null,
    isLoading: query.isLoading,
    loadError: query.error,
    reload: query.refetch,
  }
}

export function useDeleteBillOfMaterials(token: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: string) => deleteBillOfMaterials(token, id),
    onSuccess: () =>
      invalidateCandidateAffectingBillOfMaterialsQueries(queryClient),
  })
  return {
    deleteBillOfMaterials: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}

export function useRestoreBillOfMaterials(token: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (id: string) => restoreBillOfMaterials(token, id),
    onSuccess: () =>
      invalidateCandidateAffectingBillOfMaterialsQueries(queryClient),
  })
  return {
    restoreBillOfMaterials: mutation.mutateAsync,
    isRestoring: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  }
}

export function useCreateBillOfMaterials(token: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: CreateBillOfMaterialsRequest) =>
      createBillOfMaterials(token, payload),
    onSuccess: () =>
      invalidateCandidateAffectingBillOfMaterialsQueries(queryClient),
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
    onSuccess: async (billOfMaterials) => {
      queryClient.setQueryData(
        [...billsOfMaterialsQueryKey, billOfMaterialsId],
        billOfMaterials,
      )
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: billsOfMaterialsQueryKey,
          exact: true,
        }),
        invalidateProductVariantCandidates(queryClient),
      ])
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
  scope: { productId?: string; templateId?: string } = {},
) {
  const query = useQuery({
    queryKey: [
      ...productVariantCandidatesQueryKey,
      token,
      scope.productId
        ? `product:${scope.productId}`
        : scope.templateId
          ? `template:${scope.templateId}`
          : 'manual',
      search,
    ],
    queryFn: ({ signal }) =>
      searchProductVariantCandidates(token, search, scope, signal),
    enabled: search.length > 0,
    staleTime: 30_000,
    retry: false,
  })

  return {
    ...query,
    isAuthenticationError:
      query.error instanceof ApiRequestError && query.error.status === 401,
    isErrorRetryable: !isCandidateAuthenticationOrAuthorizationError(
      query.error,
    ),
  }
}

export function useApplyBillOfMaterialsTemplate(
  token: string,
  templateId: string,
) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: ApplyBillOfMaterialsTemplateRequest) =>
      applyBillOfMaterialsTemplate(token, templateId, payload),
    onSuccess: () =>
      invalidateCandidateAffectingBillOfMaterialsQueries(queryClient),
  })

  return {
    applyTemplate: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  }
}

export function useDeriveBillOfMaterialsTemplate(
  token: string,
  originId: string,
) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: DeriveBillOfMaterialsTemplateRequest) =>
      deriveBillOfMaterialsTemplate(token, originId, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: billsOfMaterialsQueryKey }),
  })

  return {
    deriveTemplate: mutation.mutateAsync,
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
        invalidateCandidateAffectingBillOfMaterialsQueries(queryClient),
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

function invalidateCandidateAffectingBillOfMaterialsQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  return Promise.all([
    queryClient.invalidateQueries({
      predicate: ({ queryKey }) =>
        queryKey[0] === billsOfMaterialsQueryKey[0] &&
        queryKey[1] !== productVariantCandidatesQueryKey[1],
    }),
    invalidateProductVariantCandidates(queryClient),
  ])
}

function isCandidateAuthenticationOrAuthorizationError(error: Error | null) {
  return (
    error instanceof ApiRequestError && [401, 403].includes(error.status)
  )
}
