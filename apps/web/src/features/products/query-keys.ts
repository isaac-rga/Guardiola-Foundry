import type {
  ListProductsQuery,
  ProductSummary,
} from '@guardiola-foundry/shared-types'

export const productListQueryPrefix = ['products', 'list'] as const

export function productListQueryKey(filters: ListProductsQuery = {}) {
  return [
    ...productListQueryPrefix,
    {
      includeDeleted: filters.includeDeleted === true,
      search: filters.search ?? '',
    },
  ] as const
}

export function decodeProductListQueryKey(queryKey: readonly unknown[]) {
  if (
    queryKey[0] !== productListQueryPrefix[0] ||
    queryKey[1] !== productListQueryPrefix[1]
  ) {
    return null
  }

  const identity = queryKey[2]
  if (
    typeof identity !== 'object' ||
    identity === null ||
    !('includeDeleted' in identity) ||
    !('search' in identity) ||
    typeof identity.includeDeleted !== 'boolean' ||
    typeof identity.search !== 'string'
  ) {
    return null
  }

  return {
    includeDeleted: identity.includeDeleted,
    search: identity.search,
  }
}

export function productMatchesListQueryKey(
  product: Pick<ProductSummary, 'deletedAt' | 'name'>,
  queryKey: readonly unknown[],
) {
  const identity = decodeProductListQueryKey(queryKey)
  if (!identity || (!identity.includeDeleted && product.deletedAt)) return false

  const search = identity.search.trim().toLocaleLowerCase()
  return (
    search.length === 0 || product.name.toLocaleLowerCase().includes(search)
  )
}

export function productDetailQueryKey(productId: string) {
  return ['products', 'detail', productId] as const
}

export function productVariantsQueryPrefix(productId: string) {
  return ['products', 'detail', productId, 'variants'] as const
}
