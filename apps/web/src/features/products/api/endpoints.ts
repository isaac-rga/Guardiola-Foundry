import {
  createProductRequestSchema,
  createProductVariantRequestSchema,
  getProductResponseSchema,
  listProductVariantsResponseSchema,
  listProductsResponseSchema,
  productDetailSchema,
  productSummarySchema,
  productVariantSchema,
  updateProductRequestSchema,
  updateProductVariantRequestSchema,
} from '@guardiola-foundry/shared-validation'
import type {
  CreateProductRequest,
  CreateProductVariantRequest,
  GetProductResponse,
  ListProductsResponse,
  ListProductVariantsResponse,
  ProductDetail,
  ProductSummary,
  ProductVariant,
  UpdateProductRequest,
  UpdateProductVariantRequest,
} from '@guardiola-foundry/shared-types'

import { getResponseErrorMessage, resolveApiUrl } from '@/lib/api/transport'

export type UpdateProductInput = UpdateProductRequest & {
  imageFile?: File | null
  removeImage?: boolean
}

export async function listProducts(
  token: string,
  options?: {
    includeDeleted?: boolean
  }
): Promise<ListProductsResponse> {
  const url = new URL(resolveApiUrl('/products'), window.location.origin)

  if (options?.includeDeleted) {
    url.searchParams.set('includeDeleted', 'true')
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to load products.'))
  }

  return listProductsResponseSchema.parse(body)
}

export async function createProduct(
  token: string,
  payload: CreateProductRequest
): Promise<ProductSummary> {
  const response = await fetch(resolveApiUrl('/products'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createProductRequestSchema.parse(payload)),
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to create product.'))
  }

  return productSummarySchema.parse(body)
}

export async function getProduct(token: string, productId: string): Promise<GetProductResponse> {
  const response = await fetch(resolveApiUrl(`/products/${productId}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to load product.'))
  }

  return getProductResponseSchema.parse(body)
}

export async function updateProduct(
  token: string,
  productId: string,
  payload: UpdateProductInput
): Promise<ProductDetail> {
  const parsedPayload = updateProductRequestSchema.parse(payload)
  const formData = new FormData()

  formData.set('name', parsedPayload.name)
  formData.set('shortDescription', parsedPayload.shortDescription ?? '')
  formData.set('lifecycleStatus', parsedPayload.lifecycleStatus)
  formData.set('productStatus', parsedPayload.productStatus)
  formData.set('productCategory', parsedPayload.productCategory ?? '')
  formData.set('collectionId', parsedPayload.collectionId === null ? '' : `${parsedPayload.collectionId}`)

  if (payload.removeImage) {
    formData.set('removeImage', 'true')
  }

  if (payload.imageFile) {
    formData.set('image', payload.imageFile)
  }

  const response = await fetch(resolveApiUrl(`/products/${productId}`), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to save product changes.'))
  }

  return productDetailSchema.parse(body)
}

export async function deleteProduct(token: string, productId: string): Promise<void> {
  const response = await fetch(resolveApiUrl(`/products/${productId}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 204) {
    return
  }

  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to delete product.'))
  }
}

export async function restoreProduct(token: string, productId: string): Promise<void> {
  const response = await fetch(resolveApiUrl(`/products/${productId}/restore`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 204) {
    return
  }

  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to restore product.'))
  }
}

export async function listProductVariants(
  token: string,
  productId: string
): Promise<ListProductVariantsResponse> {
  const response = await fetch(resolveApiUrl(`/products/${productId}/variants`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to load Product Variants.'))
  }

  return listProductVariantsResponseSchema.parse(body)
}

export async function createProductVariant(
  token: string,
  productId: string,
  payload: CreateProductVariantRequest
): Promise<ProductVariant> {
  const response = await fetch(resolveApiUrl(`/products/${productId}/variants`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createProductVariantRequestSchema.parse(payload)),
  })
  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to add Product Variant.'))
  }

  return productVariantSchema.parse(body)
}

export async function updateProductVariant(
  token: string,
  productId: string,
  variantId: string,
  payload: UpdateProductVariantRequest
): Promise<ProductVariant> {
  const response = await fetch(resolveApiUrl(`/products/${productId}/variants/${variantId}`), {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateProductVariantRequestSchema.parse(payload)),
  })
  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to save Product Variant.'))
  }

  return productVariantSchema.parse(body)
}
