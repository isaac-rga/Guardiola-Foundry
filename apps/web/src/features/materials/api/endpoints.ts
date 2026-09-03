import {
  getMaterialResponseSchema,
  listMaterialsResponseSchema,
} from '@guardiola-foundry/shared-validation'
import type {
  GetMaterialResponse,
  ListMaterialsResponse,
} from '@guardiola-foundry/shared-types'

import { getResponseErrorMessage, resolveApiUrl } from '@/lib/api/transport'

export async function listMaterials(token: string): Promise<ListMaterialsResponse> {
  const response = await fetch(resolveApiUrl('/materials'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to load materials.'))
  }

  return listMaterialsResponseSchema.parse(body)
}

export async function getMaterial(
  token: string,
  materialId: string,
): Promise<GetMaterialResponse> {
  const response = await fetch(
    resolveApiUrl(`/materials/${encodeURIComponent(materialId)}`),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to load Material.'))
  }

  return getMaterialResponseSchema.parse(body)
}
