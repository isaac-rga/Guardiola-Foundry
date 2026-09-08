import {
  createPatternSetRequestSchema,
  listPatternSetsResponseSchema,
  patternSetSchema,
  updatePatternSetRequestSchema,
} from '@guardiola-foundry/shared-validation'
import type {
  CreatePatternSetRequest,
  ListPatternSetsResponse,
  PatternSet,
  UpdatePatternSetRequest,
} from '@guardiola-foundry/shared-types'

import { getResponseErrorMessage, resolveApiUrl } from '@/lib/api/transport'

export async function listPatternSets(
  token: string,
  includeRetired: boolean,
): Promise<ListPatternSetsResponse> {
  const url = new URL(resolveApiUrl('/pattern-sets'), window.location.origin)
  if (includeRetired) url.searchParams.set('includeRetired', 'true')
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  const body = await response.json()
  if (!response.ok)
    throw new Error(
      getResponseErrorMessage(body, 'Unable to load Pattern Sets.'),
    )
  return listPatternSetsResponseSchema.parse(body)
}

export async function createPatternSet(
  token: string,
  payload: CreatePatternSetRequest,
): Promise<PatternSet> {
  return mutatePatternSet(
    '/pattern-sets',
    'POST',
    token,
    createPatternSetRequestSchema.parse(payload),
  )
}

export async function updatePatternSet(
  token: string,
  patternSetId: string,
  payload: UpdatePatternSetRequest,
): Promise<PatternSet> {
  return mutatePatternSet(
    `/pattern-sets/${patternSetId}`,
    'PUT',
    token,
    updatePatternSetRequestSchema.parse(payload),
  )
}

export async function retirePatternSet(
  token: string,
  patternSetId: string,
): Promise<void> {
  const response = await fetch(resolveApiUrl(`/pattern-sets/${patternSetId}`), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (response.status === 204) return
  const body = await response.json()
  throw new Error(
    getResponseErrorMessage(body, 'Unable to retire Pattern Set.'),
  )
}

export async function restorePatternSet(
  token: string,
  patternSetId: string,
): Promise<PatternSet> {
  const response = await fetch(
    resolveApiUrl(`/pattern-sets/${patternSetId}/restore`),
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    },
  )
  const body = await response.json()
  if (!response.ok)
    throw new Error(
      getResponseErrorMessage(body, 'Unable to restore Pattern Set.'),
    )
  return patternSetSchema.parse(body)
}

async function mutatePatternSet(
  path: string,
  method: 'POST' | 'PUT',
  token: string,
  payload: CreatePatternSetRequest | UpdatePatternSetRequest,
) {
  const response = await fetch(resolveApiUrl(path), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const body = await response.json()
  if (!response.ok)
    throw new Error(
      getResponseErrorMessage(body, 'Unable to save Pattern Set.'),
    )
  return patternSetSchema.parse(body)
}
