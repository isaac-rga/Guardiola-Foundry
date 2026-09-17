import type { QueryClient } from '@tanstack/react-query'

export const productVariantCandidatesQueryKey = [
  'bills-of-materials',
  'product-variant-candidates',
] as const

export function invalidateProductVariantCandidates(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: productVariantCandidatesQueryKey,
  })
}
