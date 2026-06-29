import { authSessionResponseSchema } from '@guardiola-foundry/shared-validation'
import type { AuthSessionResponse, LoginRequest } from '@guardiola-foundry/shared-types'

import { API_BASE_URL } from './config'

export async function signIn(credentials: LoginRequest): Promise<AuthSessionResponse> {
  const response = await fetch(resolveApiUrl('/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(getErrorMessage(body))
  }

  return authSessionResponseSchema.parse(body)
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

function getErrorMessage(body: unknown) {
  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message
  }

  return 'Unable to sign in. Check your credentials and try again.'
}
