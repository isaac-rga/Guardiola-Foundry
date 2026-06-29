import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { routeTree } from '../routeTree.gen'

describe('sign-in route', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('redirects to the protected route after a successful sign-in', async () => {
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

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(session), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
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

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({
        initialEntries: ['/sign-in'],
      }),
    })

    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: /sign in to guardiola foundry/i })).toBeInTheDocument()

    await user.type(screen.getByLabelText(/email address/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByRole('heading', { name: /authenticated area/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/app')
    })
  })

  it('keeps the user on sign-in and shows the lockout message when the API blocks sign-in', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'Too many failed sign-in attempts. Try again in 15 minutes.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({
        initialEntries: ['/sign-in'],
      }),
    })

    render(<RouterProvider router={router} />)
    expect(await screen.findByRole('heading', { name: /sign in to guardiola foundry/i })).toBeInTheDocument()

    await user.type(screen.getByLabelText(/email address/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/password/i), 'Password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(
      await screen.findByText('Too many failed sign-in attempts. Try again in 15 minutes.')
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sign-in')
    })
  })
})
