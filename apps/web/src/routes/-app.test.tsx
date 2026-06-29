import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('signs out the current authenticated session from the protected route', async () => {
    const user = userEvent.setup()
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

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
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
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    const router = createTestRouter('/app')

    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: /authenticated area/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3333/auth/logout',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer opaque-access-token',
          }),
        })
      )
      expect(router.state.location.pathname).toBe('/sign-in')
    })

    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull()
    expect(await screen.findByRole('heading', { name: /sign in to guardiola foundry/i })).toBeInTheDocument()
  })

  it('changes the password and returns the user to sign-in', async () => {
    const user = userEvent.setup()
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

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
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
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    const router = createTestRouter('/app')

    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: /authenticated area/i })).toBeInTheDocument()

    await user.type(screen.getByLabelText(/current password/i), 'Password123')
    await user.type(screen.getByLabelText(/new password/i), 'NewPassword123')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3333/auth/change-password',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer opaque-access-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            currentPassword: 'Password123',
            newPassword: 'NewPassword123',
          }),
        })
      )
      expect(router.state.location.pathname).toBe('/sign-in')
    })

    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull()
    expect(await screen.findByRole('heading', { name: /sign in to guardiola foundry/i })).toBeInTheDocument()
  })

  it('shows the API error when password change fails and keeps the user on the protected route', async () => {
    const user = userEvent.setup()
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

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
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
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: 'Current password is incorrect.',
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

    expect(await screen.findByRole('heading', { name: /authenticated area/i })).toBeInTheDocument()

    await user.type(screen.getByLabelText(/current password/i), 'WrongPassword123')
    await user.type(screen.getByLabelText(/new password/i), 'NewPassword123')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect.')
    expect(router.state.location.pathname).toBe('/app')
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toEqual(JSON.stringify(session))
  })

  it('validates the new password length before calling the password-change endpoint', async () => {
    const user = userEvent.setup()
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

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
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

    expect(await screen.findByRole('heading', { name: /authenticated area/i })).toBeInTheDocument()

    await user.type(screen.getByLabelText(/current password/i), 'Password123')
    await user.type(screen.getByLabelText(/new password/i), 'short')
    await user.click(screen.getByRole('button', { name: /change password/i }))

    expect(await screen.findByText('Too small: expected string to have >=8 characters')).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
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
