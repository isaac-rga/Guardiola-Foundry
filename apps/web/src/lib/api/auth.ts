import {
  authSessionResponseSchema,
  changePasswordRequestSchema,
  currentSessionResponseSchema,
} from '@guardiola-foundry/shared-validation'
import type {
  AuthSessionResponse,
  ChangePasswordRequest,
  CurrentSessionResponse,
  LoginRequest,
} from '@guardiola-foundry/shared-types'

import { getResponseErrorMessage, resolveApiUrl } from './transport'

const defaultAuthErrorMessage = 'Unable to sign in. Check your credentials and try again.'

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
    throw new Error(getResponseErrorMessage(body, defaultAuthErrorMessage))
  }

  return authSessionResponseSchema.parse(body)
}

export async function getCurrentSession(token: string): Promise<CurrentSessionResponse> {
  const response = await fetch(resolveApiUrl('/auth/me'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const body = await response.json()

  if (!response.ok) {
    throw new Error(getResponseErrorMessage(body, defaultAuthErrorMessage))
  }

  return currentSessionResponseSchema.parse(body)
}

export async function logoutCurrentSession(token: string): Promise<void> {
  const response = await fetch(resolveApiUrl('/auth/logout'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.ok) {
    return
  }

  let body: unknown = null

  try {
    body = await response.json()
  } catch {
    body = null
  }

  throw new Error(getResponseErrorMessage(body, defaultAuthErrorMessage))
}

export async function changePasswordCurrentSession(
  token: string,
  payload: ChangePasswordRequest
): Promise<void> {
  const response = await fetch(resolveApiUrl('/auth/change-password'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(changePasswordRequestSchema.parse(payload)),
  })

  if (response.ok) {
    return
  }

  let body: unknown = null

  try {
    body = await response.json()
  } catch {
    body = null
  }

  throw new Error(getResponseErrorMessage(body, defaultAuthErrorMessage))
}
