import {
  getSourceResponseSchema,
  listSourcesResponseSchema,
} from '@guardiola-foundry/shared-validation'
import type {
  GetSourceResponse,
  ListSourcesQuery,
  ListSourcesResponse,
} from '@guardiola-foundry/shared-types'

import { getResponseErrorMessage, resolveApiUrl } from '@/lib/api/transport'

export async function listSources(
  token: string,
  filters: ListSourcesQuery,
): Promise<ListSourcesResponse> {
  const searchParams = new URLSearchParams()

  if (filters.search) searchParams.set('search', filters.search)
  if (filters.textileFamily)
    searchParams.set('textileFamily', filters.textileFamily)
  if (filters.status) searchParams.set('status', filters.status)
  if (filters.linkState) searchParams.set('linkState', filters.linkState)
  if (filters.attentionState)
    searchParams.set('attentionState', filters.attentionState)

  const query = searchParams.toString()
  const response = await fetch(
    resolveApiUrl(`/sources${query ? `?${query}` : ''}`),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to load Sources.'))
  }

  return listSourcesResponseSchema.parse(body)
}

export async function getSource(token: string, sourceId: string): Promise<GetSourceResponse> {
  const response = await fetch(resolveApiUrl(`/sources/${encodeURIComponent(sourceId)}`), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to load Source.'))
  }

  return getSourceResponseSchema.parse(body)
}
