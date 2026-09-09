import {
  billOfMaterialsDetailSchema,
  createBillOfMaterialsTemplateRequestSchema,
  listBillsOfMaterialsResponseSchema,
} from '@guardiola-foundry/shared-validation'
import type {
  BillOfMaterialsDetail,
  CreateBillOfMaterialsTemplateRequest,
  ListBillsOfMaterialsResponse,
} from '@guardiola-foundry/shared-types'

import { getResponseErrorMessage, resolveApiUrl } from '@/lib/api/transport'

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

export async function createBillOfMaterialsTemplate(
  token: string,
  payload: CreateBillOfMaterialsTemplateRequest,
): Promise<BillOfMaterialsDetail> {
  const response = await fetch(resolveApiUrl('/bills-of-materials'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      createBillOfMaterialsTemplateRequestSchema.parse(payload),
    ),
  })
  const body = await response.json()
  if (!response.ok) {
    throw new Error(
      getResponseErrorMessage(body, 'Unable to save the BOM Template.'),
    )
  }
  return billOfMaterialsDetailSchema.parse(body)
}
