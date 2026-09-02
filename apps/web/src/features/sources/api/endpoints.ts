import {
  createSourceRequestSchema,
  createSourceResponseSchema,
  getSourceResponseSchema,
  listSourcesResponseSchema,
  updateSourceRequestSchema,
  updateSourceResponseSchema,
} from '@guardiola-foundry/shared-validation'
import type {
  CreateSourceRequest,
  CreateSourceResponse,
  GetSourceResponse,
  ListSourcesQuery,
  ListSourcesResponse,
  UpdateSourceRequest,
  UpdateSourceResponse,
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

export async function getSource(
  token: string,
  sourceId: string,
): Promise<GetSourceResponse> {
  const response = await fetch(
    resolveApiUrl(`/sources/${encodeURIComponent(sourceId)}`),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )
  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, 'Unable to load Source.'))
  }

  return getSourceResponseSchema.parse(body)
}

export class SourceValidationError extends Error {
  readonly fieldErrors: Partial<Record<keyof CreateSourceRequest, string[]>>

  constructor(
    message: string,
    fieldErrors: Partial<Record<keyof CreateSourceRequest, string[]>>,
  ) {
    super(message)
    this.name = 'SourceValidationError'
    this.fieldErrors = fieldErrors
  }
}

export async function createSource(
  token: string,
  payload: CreateSourceRequest,
): Promise<CreateSourceResponse> {
  const response = await fetch(resolveApiUrl('/sources'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createSourceRequestSchema.parse(payload)),
  })
  const body = await response.json()

  if (!response.ok) {
    const fieldErrors = readSourceFieldErrors(body)

    if (fieldErrors) {
      throw new SourceValidationError(
        'Review the highlighted Source fields.',
        fieldErrors,
      )
    }

    throw new Error(getResponseErrorMessage(body, 'Unable to create Source.'))
  }

  return createSourceResponseSchema.parse(body)
}

export async function updateSource(
  token: string,
  sourceId: string,
  payload: UpdateSourceRequest,
): Promise<UpdateSourceResponse> {
  const response = await fetch(
    resolveApiUrl(`/sources/${encodeURIComponent(sourceId)}`),
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateSourceRequestSchema.parse(payload)),
    },
  )
  const body = await response.json()

  if (!response.ok) {
    const fieldErrors = readSourceFieldErrors(body)

    if (fieldErrors) {
      throw new SourceValidationError(
        'Review the highlighted Source fields.',
        fieldErrors,
      )
    }

    throw new Error(
      getResponseErrorMessage(body, 'Unable to save Source changes.'),
    )
  }

  return updateSourceResponseSchema.parse(body)
}

function readSourceFieldErrors(body: unknown) {
  if (
    typeof body !== 'object' ||
    body === null ||
    !('errors' in body) ||
    typeof body.errors !== 'object' ||
    body.errors === null
  ) {
    return null
  }

  return body.errors as Partial<Record<keyof CreateSourceRequest, string[]>>
}
