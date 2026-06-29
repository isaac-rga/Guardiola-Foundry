import { authSessionResponseSchema } from '@guardiola-foundry/shared-validation'
import type { AuthSessionResponse } from '@guardiola-foundry/shared-types'

export const AUTH_SESSION_STORAGE_KEY = 'guardiola-foundry.auth-session'

export function saveAuthSession(session: AuthSessionResponse) {
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function loadAuthSession() {
  const rawSession = localStorage.getItem(AUTH_SESSION_STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    return authSessionResponseSchema.parse(JSON.parse(rawSession))
  } catch {
    clearAuthSession()
    return null
  }
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
}
