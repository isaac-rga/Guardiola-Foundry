import {
  associateBillOfMaterialsTemplateProductRequestSchema,
  billOfMaterialsDetailSchema,
  createBillOfMaterialsRequestSchema,
  listBillsOfMaterialsResponseSchema,
  searchProductVariantCandidatesResponseSchema,
} from '@guardiola-foundry/shared-validation'
import type {
  AssociateBillOfMaterialsTemplateProductRequest,
  BillOfMaterialsDetail,
  CreateBillOfMaterialsRequest,
  ListBillsOfMaterialsResponse,
  SearchProductVariantCandidatesResponse,
} from '@guardiola-foundry/shared-types'

import { getResponseErrorMessage, resolveApiUrl } from '@/lib/api/transport'

export class BillOfMaterialsRequestError extends Error {
  readonly fieldErrors: Record<string, string[]>

  constructor(message: string, fieldErrors: Record<string, string[]>) {
    super(message)
    this.name = 'BillOfMaterialsRequestError'
    this.fieldErrors = fieldErrors
  }
}

export async function listBillsOfMaterials(
  token: string,
): Promise<ListBillsOfMaterialsResponse> {
  const response = await fetch(resolveApiUrl('/bills-of-materials'), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await response.json()
  if (!response.ok) {
    throw new Error(
      getResponseErrorMessage(body, 'Unable to load Bills of Materials.'),
    )
  }
  return listBillsOfMaterialsResponseSchema.parse(body)
}

export async function associateBillOfMaterialsTemplateProduct(
  token: string,
  billOfMaterialsId: string,
  payload: AssociateBillOfMaterialsTemplateProductRequest,
): Promise<BillOfMaterialsDetail> {
  const response = await fetch(
    resolveApiUrl(`/bills-of-materials/${billOfMaterialsId}/product`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        associateBillOfMaterialsTemplateProductRequestSchema.parse(payload),
      ),
    },
  )
  const body = await response.json()
  if (!response.ok) {
    throw new Error(
      getResponseErrorMessage(body, 'Unable to associate the Product.'),
    )
  }
  return billOfMaterialsDetailSchema.parse(body)
}

export async function createBillOfMaterials(
  token: string,
  payload: CreateBillOfMaterialsRequest,
): Promise<BillOfMaterialsDetail> {
  const response = await fetch(resolveApiUrl('/bills-of-materials'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createBillOfMaterialsRequestSchema.parse(payload)),
  })
  const body = await response.json()
  if (!response.ok) {
    throw new BillOfMaterialsRequestError(
      getResponseErrorMessage(body, 'Unable to save the Bill of Materials.'),
      readFieldErrors(body),
    )
  }
  return billOfMaterialsDetailSchema.parse(body)
}

export async function searchProductVariantCandidates(
  token: string,
  search: string,
  signal?: AbortSignal,
): Promise<SearchProductVariantCandidatesResponse> {
  const url = new URL(
    resolveApiUrl('/bills-of-materials/product-variant-candidates'),
  )
  url.searchParams.set('search', search)
  const response = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })
  const body = await response.json()
  if (!response.ok) {
    throw new Error(
      getResponseErrorMessage(body, 'Unable to search Product Variants.'),
    )
  }
  return searchProductVariantCandidatesResponseSchema.parse(body)
}

function readFieldErrors(body: unknown): Record<string, string[]> {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('errors' in body) ||
    typeof body.errors !== 'object' ||
    body.errors === null
  ) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(body.errors).filter(
      (entry): entry is [string, string[]] =>
        Array.isArray(entry[1]) &&
        entry[1].every((message) => typeof message === 'string'),
    ),
  )
}
