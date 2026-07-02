import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AUTH_SESSION_STORAGE_KEY } from '@/lib/auth/session-storage'
import { routeTree } from '../routeTree.gen'

if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = () => false
}

if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = () => {}
}

if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = () => {}
}

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {}
}

describe('products route', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('creates a product with default statuses and shows it immediately in the list', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/auth/me')) {
        return jsonResponse({
          tokenType: 'Bearer',
          expiresAt: '2026-07-28T18:33:00.000Z',
          user: {
            id: 1,
            email: 'admin@example.com',
            role: 'admin',
            active: true,
          },
        })
      }

      if (url.endsWith('/products') && init?.method === 'GET') {
        return jsonResponse({
          products: [],
          collections: [
            { id: 1, name: '2025' },
            { id: 2, name: '2026' },
            { id: 3, name: '2027' },
          ],
        })
      }

      if (url.endsWith('/products') && init?.method === 'POST') {
        return jsonResponse(
          {
            id: 'P-AB12CD',
            name: 'Valencia Gown',
            lifecycleStatus: 'concept',
            productStatus: 'active',
            collection: null,
            createdAt: '2026-07-01T18:33:00.000Z',
            createdBy: {
              id: 1,
              email: 'admin@example.com',
            },
          },
          { status: 201 }
        )
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()

    renderProductsRoute()

    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument()
    expect(await screen.findByText('No products registered yet.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create product' }))
    await user.type(screen.getByLabelText(/product name/i), 'Valencia Gown')
    await user.click(screen.getByRole('button', { name: /^Create product$/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3333/products',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer opaque-access-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            name: 'Valencia Gown',
            lifecycleStatus: 'concept',
            productStatus: 'active',
          }),
        })
      )
    })

    expect(await screen.findByText('Valencia Gown')).toBeInTheDocument()
    expect(screen.getByText('P-AB12CD')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('submits explicit lifecycle and product status overrides from the modal', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/auth/me')) {
        return jsonResponse({
          tokenType: 'Bearer',
          expiresAt: '2026-07-28T18:33:00.000Z',
          user: {
            id: 1,
            email: 'admin@example.com',
            role: 'admin',
            active: true,
          },
        })
      }

      if (url.endsWith('/products') && init?.method === 'GET') {
        return jsonResponse({
          products: [],
          collections: [],
        })
      }

      if (url.endsWith('/products') && init?.method === 'POST') {
        return jsonResponse(
          {
            id: 'P-ZX98QP',
            name: 'Mila Cape',
            lifecycleStatus: 'testing',
            productStatus: 'inactive',
            collection: null,
            createdAt: '2026-07-01T18:33:00.000Z',
            createdBy: {
              id: 1,
              email: 'admin@example.com',
            },
          },
          { status: 201 }
        )
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()

    renderProductsRoute()

    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument()

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Create product' }))
      await user.type(screen.getByLabelText(/product name/i), 'Mila Cape')
      await user.click(screen.getByRole('combobox', { name: 'Lifecycle Status' }))
      await user.click(await screen.findByRole('option', { name: 'Testing' }))
      await user.click(screen.getByRole('combobox', { name: 'Product Status' }))
      await user.click(await screen.findByRole('option', { name: 'Inactive' }))
      await user.click(screen.getByRole('button', { name: /^Create product$/i }))
    })

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3333/products',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Mila Cape',
            lifecycleStatus: 'testing',
            productStatus: 'inactive',
          }),
        })
      )
    })
  })
})

function renderProductsRoute() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ['/app/products'],
    }),
  })
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
    },
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
