export const PRODUCT_VARIANT_NAME_MAX_LENGTH = 255

export type ProductVariantStatus = 'active' | 'inactive'

export interface ProductVariant {
  id: string
  productId: string
  name: string
  status: ProductVariantStatus
  deletedAt: string | null
  createdAt: string
}

export interface ListProductVariantsResponse {
  variants: ProductVariant[]
}

export interface CreateProductVariantRequest {
  name: string
}

export interface UpdateProductVariantRequest {
  name: string
  status: ProductVariantStatus
}
