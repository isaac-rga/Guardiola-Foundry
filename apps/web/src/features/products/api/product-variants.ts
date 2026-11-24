import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { invalidateProductVariantCandidates } from '@/features/bills-of-materials/api/query-keys'
import {
  createProductVariant,
  deleteProductVariant,
  listProductVariants,
  restoreProductVariant,
  updateProductVariant,
} from '@/features/products/api/endpoints'
import { hasApiRequestStatus } from '@/lib/api/transport'
import type {
  ListProductVariantsResponse,
  ProductVariant,
  UpdateProductVariantRequest,
} from '@guardiola-foundry/shared-types'
import { productVariantsQueryPrefix } from '../query-keys'

function shouldAutoRefetchVariantList({ state }: { state: { error: Error | null } }) {
  return !hasApiRequestStatus(state.error, 401, 403)
}

const variantListRefetchOptions = {
  refetchOnWindowFocus: shouldAutoRefetchVariantList,
  refetchOnReconnect: shouldAutoRefetchVariantList,
}

export function useProductVariants(
  token: string,
  productId: string,
  enabled: boolean,
  includeDeleted: boolean
) {
  const queryClient = useQueryClient()
  const variantsQueryPrefix = productVariantsQueryPrefix(productId)
  const currentVariantsQuery = useQuery({
    ...variantListRefetchOptions,
    queryKey: [...variantsQueryPrefix, 'default'],
    queryFn: () => listProductVariants(token, productId, { includeDeleted: false }),
    enabled,
  })
  const allVariantsQuery = useQuery({
    ...variantListRefetchOptions,
    queryKey: [...variantsQueryPrefix, 'include-deleted'],
    queryFn: () => listProductVariants(token, productId, { includeDeleted: true }),
    enabled: enabled && includeDeleted,
    staleTime: 0,
  })
  const variantsQuery = includeDeleted ? allVariantsQuery : currentVariantsQuery
  const historyAccessDenied = hasApiRequestStatus(allVariantsQuery.error, 401, 403)
  const isRevalidatingHistory =
    includeDeleted && !historyAccessDenied && allVariantsQuery.fetchStatus !== 'idle'
  const defaultVariants = hasApiRequestStatus(currentVariantsQuery.error, 401, 403)
    ? undefined
    : currentVariantsQuery.data?.variants
  const historyVariants = historyAccessDenied ? undefined : allVariantsQuery.data?.variants
  const currentVariants =
    defaultVariants ?? historyVariants?.filter((variant) => !variant.deletedAt) ?? []
  const isUpdating = isRevalidatingHistory && currentVariants.length > 0
  const saveMutation = useMutation({
    mutationFn: ({
      currentVariant,
      values,
    }: {
      currentVariant: ProductVariant | null
      values: UpdateProductVariantRequest
    }) =>
      currentVariant
        ? updateProductVariant(token, productId, currentVariant.id, values)
        : createProductVariant(token, productId, { name: values.name }),
    onSuccess: (savedVariant, variables) => {
      queryClient.setQueriesData<ListProductVariantsResponse>(
        {
          queryKey: variantsQueryPrefix,
          // Updating an errored list would clear its error and expose any stale rows.
          predicate: (query) => query.state.status === 'success',
        },
        (currentData) =>
          currentData && {
            variants: variables.currentVariant
              ? currentData.variants.map((variant) =>
                  variant.id === savedVariant.id ? savedVariant : variant
                )
              : [...currentData.variants, savedVariant],
          },
      )
      return invalidateProductVariantCandidates(queryClient)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (variantId: string) => deleteProductVariant(token, productId, variantId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: productVariantsQueryPrefix(productId),
        }),
        invalidateProductVariantCandidates(queryClient),
      ]),
  })
  const restoreMutation = useMutation({
    mutationFn: (variantId: string) => restoreProductVariant(token, productId, variantId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: productVariantsQueryPrefix(productId),
        }),
        invalidateProductVariantCandidates(queryClient),
      ]),
  })

  return {
    currentVariants,
    variants: isRevalidatingHistory
      ? currentVariants
      : (includeDeleted ? historyVariants : defaultVariants) ?? [],
    recoverDefault: currentVariantsQuery.refetch,
    isLoading: isRevalidatingHistory ? !isUpdating : variantsQuery.isLoading,
    isUpdating,
    loadError: isRevalidatingHistory ? null : variantsQuery.error,
    isSaving: saveMutation.isPending,
    isChangingAvailability: deleteMutation.isPending || restoreMutation.isPending,
    saveVariant: saveMutation.mutateAsync,
    deleteVariant: deleteMutation.mutateAsync,
    restoreVariant: restoreMutation.mutateAsync,
  }
}
