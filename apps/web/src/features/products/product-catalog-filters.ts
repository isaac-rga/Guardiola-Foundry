import type {
  ProductCategory,
  ProductLifecycleStatus,
  ProductStatus,
} from '@guardiola-foundry/shared-types'

export type ProductCatalogFilters = {
  search?: string
  lifecycleStatus?: ProductLifecycleStatus
  productStatus?: ProductStatus
  productCategory?: ProductCategory | 'none'
  collection?: number | 'none'
  includeDeleted?: boolean
}

export type ProductCatalogRouteSearch = ProductCatalogFilters & {
  deletedProductName?: string
}
