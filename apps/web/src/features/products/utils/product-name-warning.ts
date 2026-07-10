import type { ProductSummary } from '@guardiola-foundry/shared-types'

export function findDuplicateProductName(
  products: ProductSummary[],
  name: string,
  options?: {
    excludeProductId?: string
  }
) {
  const normalizedName = normalizeProductName(name)

  if (normalizedName.length === 0) {
    return null
  }

  return (
    products.find((product) => {
      if (options?.excludeProductId && product.id === options.excludeProductId) {
        return false
      }

      if (product.productStatus !== 'active') {
        return false
      }

      return normalizeProductName(product.name) === normalizedName
    }) ?? null
  )
}

function normalizeProductName(name: string) {
  return name.trim().toLocaleLowerCase()
}
