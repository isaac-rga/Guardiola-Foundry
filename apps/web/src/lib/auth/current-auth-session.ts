import type { AuthSessionResponse } from '@guardiola-foundry/shared-types'

import { getCurrentSession } from '@/lib/api/auth'

import { clearAuthSession, loadAuthSession, saveAuthSession } from './session-storage'

export function readCurrentAuthSession() {
  return loadAuthSession()
}

export async function bootstrapCurrentAuthSession(): Promise<AuthSessionResponse | null> {
  const storedSession = loadAuthSession()

  if (!storedSession) {
    return null
  }

  try {
    const currentSession = await getCurrentSession(storedSession.token)
    const restoredSession: AuthSessionResponse = {
      token: storedSession.token,
      tokenType: currentSession.tokenType,
      expiresAt: currentSession.expiresAt,
      user: currentSession.user,
    }

    saveAuthSession(restoredSession)

    return restoredSession
  } catch {
    clearAuthSession()
    return null
  }
}
