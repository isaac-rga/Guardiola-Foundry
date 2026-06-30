import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AUTH_SESSION_STORAGE_KEY } from '@/lib/auth/session-storage'
import { routeTree } from '../routeTree.gen'

describe('authenticated app shell routes', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('redirects unauthenticated visitors to sign-in before shell content renders', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const router = createTestRouter('/app')

    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', { name: /sign in to guardiola foundry/i })
    ).toBeInTheDocument()
    expect(screen.queryByText(/a calm operating view for the atelier/i)).not.toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('renders the authenticated home route inside the shared shell', async () => {
    seedStoredSession()
    mockCurrentSession()

    const router = createTestRouter('/app')

    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', { name: /a calm operating view for the atelier/i })
    ).toBeInTheDocument()
    expect(screen.getByAltText('Guardiola Bridal')).toBeInTheDocument()
    expect(screen.getByText('Production queue')).toBeInTheDocument()
    expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute(
      'href',
      '/app/products'
    )
  })

  it('surfaces route-owned page metadata in the application bar for child routes', async () => {
    seedStoredSession()
    mockCurrentSession()

    const router = createTestRouter('/app/products')

    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument()
    expect(screen.getByText('Current style list')).toBeInTheDocument()
    expect(screen.getByText('Product lifecycle')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('shows user settings in the shared shell and keeps password change behavior intact', async () => {
    const user = userEvent.setup()

    seedStoredSession()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(currentSessionResponse())
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    const router = createTestRouter('/app/user-settings')

    render(<RouterProvider router={router} />)

    expect(await screen.findByText('Account details')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getAllByText('admin@example.com')).toHaveLength(2)
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getAllByText('Admin')).toHaveLength(2)

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
  })

  it('signs out from the shared account menu and returns to sign-in', async () => {
    const user = userEvent.setup()

    seedStoredSession()
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(currentSessionResponse())
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    const router = createTestRouter('/app')

    render(<RouterProvider router={router} />)

    expect(
      await screen.findByRole('heading', { name: /a calm operating view for the atelier/i })
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /open account menu/i }))

    const menu = await screen.findByRole('menu')
    await user.click(within(menu).getByRole('menuitem', { name: /log out/i }))

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

function seedStoredSession() {
  localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({
      token: 'opaque-access-token',
      tokenType: 'Bearer',
      expiresAt: '2026-07-28T18:33:00.000Z',
      user: {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        active: true,
      },
    })
  )
}

function mockCurrentSession() {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(currentSessionResponse())
}

function currentSessionResponse() {
  return new Response(
    JSON.stringify({
      tokenType: 'Bearer',
      expiresAt: '2026-07-28T18:33:00.000Z',
      user: {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        active: true,
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}
