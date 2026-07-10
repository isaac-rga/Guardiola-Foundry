export function productListQueryKey(includeDeleted: boolean) {
  return ['products', 'list', includeDeleted ? 'include-deleted' : 'default'] as const
}

export function productDetailQueryKey(productId: string) {
  return ['products', 'detail', productId] as const
}
