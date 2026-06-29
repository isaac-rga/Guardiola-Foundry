import { afterEach, describe, expect, it, vi } from 'vitest'

import { AUTH_SESSION_STORAGE_KEY } from '@/lib/auth/session-storage'

import { bootstrapCurrentAuthSession } from './current-auth-session'

describe('bootstrapCurrentAuthSession', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('restores the current authenticated session from stored credentials', async () => {
    const storedSession = {
      token: 'opaque-access-token',
      tokenType: 'Bearer' as const,
      expiresAt: '2026-07-28T18:33:00.000Z',
      user: {
        id: 1,
        email: 'admin@example.com',
        role: 'admin' as const,
        active: true,
      },
    }

    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(storedSession))

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(
        JSON.stringify({
          tokenType: 'Bearer',
          expiresAt: storedSession.expiresAt,
          user: storedSession.user,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )

    await expect(bootstrapCurrentAuthSession()).resolves.toEqual(storedSession)
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toEqual(JSON.stringify(storedSession))
  })

  it('clears stored credentials when the current session is no longer valid', async () => {
    const storedSession = {
      token: 'revoked-access-token',
      tokenType: 'Bearer' as const,
      expiresAt: '2026-07-28T18:33:00.000Z',
      user: {
        id: 1,
        email: 'admin@example.com',
        role: 'admin' as const,
        active: true,
      },
    }

    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(storedSession))

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(
        JSON.stringify({
          message: 'Unauthorized',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )

    await expect(bootstrapCurrentAuthSession()).resolves.toBeNull()
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull()
  })
})
