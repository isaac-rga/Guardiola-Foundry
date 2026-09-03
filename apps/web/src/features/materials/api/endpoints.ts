import {
  getMaterialResponseSchema,
  linkMaterialSourceRequestSchema,
  linkMaterialSourceResponseSchema,
  listMaterialsResponseSchema,
  unlinkMaterialSourceResponseSchema,
} from '@guardiola-foundry/shared-validation'
import type {
  GetMaterialResponse,
  LinkMaterialSourceRequest,
  LinkMaterialSourceResponse,
  ListMaterialsResponse,
  UnlinkMaterialSourceResponse,
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

export async function linkMaterialSource(
  token: string,
  materialId: string,
  payload: LinkMaterialSourceRequest,
): Promise<LinkMaterialSourceResponse> {
  const response = await fetch(
    resolveApiUrl(`/materials/${encodeURIComponent(materialId)}/sources`),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(linkMaterialSourceRequestSchema.parse(payload)),
    },
  )
  const body = await response.json()

  if (!response.ok) {
    throw new Error(
      getResponseErrorMessage(body, 'Unable to link Source to Material.'),
    )
  }

  return linkMaterialSourceResponseSchema.parse(body)
}

export async function unlinkMaterialSource(
  token: string,
  materialId: string,
  sourceId: string,
): Promise<UnlinkMaterialSourceResponse> {
  const response = await fetch(
    resolveApiUrl(
      `/materials/${encodeURIComponent(materialId)}/sources/${encodeURIComponent(sourceId)}`,
    ),
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  const body = await response.json()

  if (!response.ok) {
    throw new Error(
      getResponseErrorMessage(body, 'Unable to unlink Source from Material.'),
    )
  }

  return unlinkMaterialSourceResponseSchema.parse(body)
}
