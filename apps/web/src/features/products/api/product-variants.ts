import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createProductVariant, listProductVariants, updateProductVariant } from '@/features/products/api/endpoints'
import type {
  ListProductVariantsResponse,
  ProductVariant,
  UpdateProductVariantRequest,
} from '@guardiola-foundry/shared-types'

export function useProductVariants(token: string, productId: string, enabled: boolean) {
  const queryClient = useQueryClient()
  const queryKey = productVariantsQueryKey(productId)
  const variantsQuery = useQuery({
    queryKey,
    queryFn: () => listProductVariants(token, productId),
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
    },
  })

  return {
    variants: variantsQuery.data?.variants ?? [],
    isLoading: variantsQuery.isLoading,
    loadError: variantsQuery.error,
    isSaving: saveMutation.isPending,
    saveVariant: saveMutation.mutateAsync,
  }
}

function productVariantsQueryKey(productId: string) {
  return ['products', 'detail', productId, 'variants'] as const
}
