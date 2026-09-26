import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { invalidateProductVariantCandidates } from '@/features/bills-of-materials/api/query-keys'
import {
  createProductVariant,
  deleteProductVariant,
  listProductVariants,
  restoreProductVariant,
  updateProductVariant,
} from '@/features/products/api/endpoints'
import type {
  ListProductVariantsResponse,
  ProductVariant,
  UpdateProductVariantRequest,
} from '@guardiola-foundry/shared-types'
import { productVariantsQueryPrefix } from '../query-keys'

export function useProductVariants(
  token: string,
  productId: string,
  enabled: boolean,
  includeDeleted: boolean
) {
  const queryClient = useQueryClient()
  const queryKey = productVariantsQueryKey(productId, includeDeleted)
  const variantsQuery = useQuery({
    queryKey,
    queryFn: () => listProductVariants(token, productId, { includeDeleted }),
    enabled,
  })
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
      queryClient.setQueryData<ListProductVariantsResponse>(queryKey, (currentData) => ({
        variants: variables.currentVariant
          ? (currentData?.variants ?? []).map((variant) =>
              variant.id === savedVariant.id ? savedVariant : variant
            )
          : [...(currentData?.variants ?? []), savedVariant],
      }))
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
    variants: variantsQuery.data?.variants ?? [],
    isLoading: variantsQuery.isLoading,
    loadError: variantsQuery.error,
    isSaving: saveMutation.isPending,
    isChangingAvailability: deleteMutation.isPending || restoreMutation.isPending,
    saveVariant: saveMutation.mutateAsync,
    deleteVariant: deleteMutation.mutateAsync,
    restoreVariant: restoreMutation.mutateAsync,
  }
}

function productVariantsQueryKey(productId: string, includeDeleted: boolean) {
  return [...productVariantsQueryPrefix(productId), includeDeleted ? 'include-deleted' : 'default'] as const
}
