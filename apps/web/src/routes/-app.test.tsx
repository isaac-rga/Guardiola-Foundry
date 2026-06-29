import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AUTH_SESSION_STORAGE_KEY } from '@/lib/auth/session-storage'
import { routeTree } from '../routeTree.gen'

describe('protected app route', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('redirects unauthenticated visitors to sign-in', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const router = createTestRouter('/app')

    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: /sign in to guardiola foundry/i })).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('shows the current authenticated user on the protected route', async () => {
    const session = {
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

    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(
        JSON.stringify({
          tokenType: 'Bearer',
          expiresAt: session.expiresAt,
          user: session.user,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )

    const router = createTestRouter('/app')

    render(<RouterProvider router={router} />)

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3333/auth/me',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer opaque-access-token',
          }),
        })
      )
    })

    expect(await screen.findByRole('heading', { name: /authenticated area/i })).toBeInTheDocument()
    expect(screen.getByText('Signed in as admin@example.com.')).toBeInTheDocument()
    expect(screen.getByText('Current role: admin.')).toBeInTheDocument()
  })

  it('returns visitors to sign-in when the stored session is no longer valid', async () => {
    const session = {
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

    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))

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

    const router = createTestRouter('/app')

    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: /sign in to guardiola foundry/i })).toBeInTheDocument()
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull()
  })
})

function createTestRouter(initialEntry: string) {
  return createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [initialEntry],
    }),
  })
}
