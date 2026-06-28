import type { AuthSessionResponse } from '@guardiola-foundry/shared-types'

export const AUTH_SESSION_STORAGE_KEY = 'guardiola-foundry.auth-session'

export function saveAuthSession(session: AuthSessionResponse) {
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
}
