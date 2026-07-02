import {
  createProductRequestSchema,
  listProductsResponseSchema,
  productSummarySchema,
} from '@guardiola-foundry/shared-validation'
import type {
  CreateProductRequest,
  ListProductsResponse,
  ProductSummary,
} from '@guardiola-foundry/shared-types'

import { API_BASE_URL } from './config'

export async function listProducts(token: string): Promise<ListProductsResponse> {
  const response = await fetch(resolveApiUrl('/products'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(getErrorMessage(body, 'Unable to load products.'))
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
    throw new Error(getErrorMessage(body, 'Unable to create product.'))
  }

  return productSummarySchema.parse(body)
}

function resolveApiUrl(path: string) {
  if (!API_BASE_URL) {
    return path
  }

  return new URL(path.replace(/^\//, ''), ensureTrailingSlash(API_BASE_URL)).toString()
}

function ensureTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`
}

function getErrorMessage(body: unknown, fallbackMessage: string) {
  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message
  }

  if (
    typeof body === 'object' &&
    body !== null &&
    'errors' in body &&
    typeof body.errors === 'object' &&
    body.errors !== null
  ) {
    const firstFieldError = Object.values(body.errors).find(
      (value): value is string[] => Array.isArray(value) && typeof value[0] === 'string'
    )

    if (firstFieldError?.[0]) {
      return firstFieldError[0]
    }
  }

  return fallbackMessage
}
