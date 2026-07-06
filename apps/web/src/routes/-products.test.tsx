import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
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
    let resolveCreateRequest!: (value: Response) => void
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
        return await new Promise<Response>((resolve) => {
          resolveCreateRequest = resolve
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()

    renderProductsRoute()

    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument()
    expect(await screen.findByText('No products registered yet.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create product' }))
    const createDialog = screen.getByRole('dialog')
    await user.type(within(createDialog).getByLabelText('Product name'), 'Valencia Gown')
    await user.click(screen.getByRole('button', { name: /^Create product$/i }))

    expect(screen.getByRole('button', { name: 'Creating product…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(within(createDialog).getByLabelText('Product name')).toBeDisabled()
    expect(within(createDialog).getByRole('status')).toHaveTextContent('Creating product…')

    resolveCreateRequest(
      jsonResponse(
        {
          id: 'P-AB12CD',
          name: 'Valencia Gown',
          lifecycleStatus: 'concept',
          productStatus: 'active',
          productCategory: null,
          collection: null,
          createdAt: '2026-07-01T18:33:00.000Z',
          createdBy: {
            id: 1,
            email: 'admin@example.com',
          },
        },
        { status: 201 }
      )
    )

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

    expect(await screen.findByText('Created Valencia Gown.')).toBeInTheDocument()
    expect(await screen.findByText('Valencia Gown')).toBeInTheDocument()
    expect(screen.getByText('P-AB12CD')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a live duplicate-name warning in create without blocking submission', async () => {
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
          products: [
            {
              id: 'P-EXIST1',
              name: 'Valencia Gown',
              lifecycleStatus: 'concept',
              productStatus: 'active',
              productCategory: null,
              collection: null,
              createdAt: '2026-07-01T18:33:00.000Z',
              createdBy: {
                id: 1,
                email: 'admin@example.com',
              },
            },
          ],
          collections: [],
        })
      }

      if (url.endsWith('/products') && init?.method === 'POST') {
        return jsonResponse(
          {
            id: 'P-NEW123',
            name: 'valencia gown',
            lifecycleStatus: 'concept',
            productStatus: 'active',
            productCategory: null,
            collection: null,
            createdAt: '2026-07-02T18:33:00.000Z',
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

    await user.click(screen.getByRole('button', { name: 'Create product' }))
    const createDialog = screen.getByRole('dialog')
    await user.type(within(createDialog).getByLabelText('Product name'), '  valencia gown  ')

    expect(
      screen.getByText(
        'Active product Valencia Gown already uses this name. You can still create another record.'
      )
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Create product$/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3333/products',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'valencia gown',
            lifecycleStatus: 'concept',
            productStatus: 'active',
          }),
        })
      )
    })

    expect(await screen.findByText('Created valencia gown.')).toBeInTheDocument()
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
            productCategory: null,
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

  it('renders newest-first rows and supports search plus single-select filters', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
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
          products: [
            {
              id: 'P-OLDER1',
              name: 'Aster Dress',
              lifecycleStatus: 'concept',
              productStatus: 'active',
              productCategory: 'dress',
              collection: { id: 1, name: '2025' },
              createdAt: '2026-06-28T09:00:00.000Z',
              createdBy: {
                id: 1,
                email: 'admin@example.com',
              },
            },
            {
              id: 'P-NEWEST',
              name: 'Bianca Veil',
              lifecycleStatus: 'testing',
              productStatus: 'inactive',
              productCategory: 'accessory',
              collection: null,
              createdAt: '2026-07-01T18:33:00.000Z',
              createdBy: {
                id: 2,
                email: 'operator@example.com',
              },
            },
            {
              id: 'P-MIDDLE',
              name: 'Celeste Sketch',
              lifecycleStatus: 'approved',
              productStatus: 'active',
              productCategory: null,
              collection: { id: 2, name: '2026' },
              createdAt: '2026-06-30T14:15:00.000Z',
              createdBy: {
                id: 3,
                email: 'director@example.com',
              },
            },
          ],
          collections: [
            { id: 1, name: '2025' },
            { id: 2, name: '2026' },
          ],
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()

    renderProductsRoute()

    expect(await screen.findByPlaceholderText('Search products by name')).toBeInTheDocument()
    expect(screen.getByText('Collection 2025')).toBeInTheDocument()
    expect(screen.getByText('No collection')).toBeInTheDocument()
    expect(screen.getByText('No category')).toBeInTheDocument()

    const allRows = screen.getAllByRole('row')
    expect(allRows[1]).toHaveTextContent('Bianca Veil')
    expect(allRows[2]).toHaveTextContent('Celeste Sketch')
    expect(allRows[3]).toHaveTextContent('Aster Dress')

    await user.type(screen.getByPlaceholderText('Search products by name'), 'celeste')

    expect(screen.getByText('Celeste Sketch')).toBeInTheDocument()
    expect(screen.queryByText('Bianca Veil')).not.toBeInTheDocument()

    await user.clear(screen.getByPlaceholderText('Search products by name'))
    await user.click(screen.getByRole('combobox', { name: 'Product Category' }))
    await user.click(await screen.findByRole('option', { name: 'No category' }))

    expect(screen.getByText('Celeste Sketch')).toBeInTheDocument()
    expect(screen.queryByText('Aster Dress')).not.toBeInTheDocument()

    await user.click(screen.getByRole('combobox', { name: 'Collection' }))
    await user.click(await screen.findByRole('option', { name: 'No collection' }))

    expect(
      screen.getByText('No products match the current search and filters.')
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear search and filters' }))

    expect(screen.getByText('Bianca Veil')).toBeInTheDocument()
    expect(screen.getByText('Aster Dress')).toBeInTheDocument()
  })

  it('loads a product page directly, shows metadata, and saves edits only when explicitly submitted', async () => {
    const user = userEvent.setup()
    let resolveSaveRequest!: (value: Response) => void
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

      if (url.endsWith('/products/P-AB12CD') && init?.method === 'GET') {
        return jsonResponse({
          product: {
            id: 'P-AB12CD',
            name: 'Valencia Gown',
            shortDescription: null,
            image: null,
            lifecycleStatus: 'concept',
            productStatus: 'active',
            productCategory: null,
            collection: null,
            createdAt: '2026-07-01T18:33:00.000Z',
            createdBy: {
              id: 1,
              email: 'admin@example.com',
            },
          },
          collections: [
            { id: 1, name: '2025' },
            { id: 2, name: '2026' },
          ],
        })
      }

      if (url.endsWith('/products') && init?.method === 'GET') {
        return jsonResponse({
          products: [
            {
              id: 'P-AB12CD',
              name: 'Valencia Gown',
              lifecycleStatus: 'concept',
              productStatus: 'active',
              productCategory: null,
              collection: null,
              createdAt: '2026-07-01T18:33:00.000Z',
              createdBy: {
                id: 1,
                email: 'admin@example.com',
              },
            },
          ],
          collections: [
            { id: 1, name: '2025' },
            { id: 2, name: '2026' },
          ],
        })
      }

      if (url.endsWith('/products/P-AB12CD') && init?.method === 'PUT') {
        return await new Promise<Response>((resolve) => {
          resolveSaveRequest = resolve
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()

    renderProductsRoute('/app/products/P-AB12CD')

    expect(await screen.findByRole('heading', { name: 'Valencia Gown' })).toBeInTheDocument()
    expect(screen.getByText('Product ID')).toBeInTheDocument()
    expect(screen.getByText('Created by')).toBeInTheDocument()
    expect(screen.getByText('Created at')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Valencia Gown')).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/product name/i))
    await user.type(screen.getByLabelText(/product name/i), 'Valencia Gown Revised')
    await user.type(
      screen.getByLabelText(/short product description/i),
      'Silk sample for fittings'
    )
    await user.click(screen.getByRole('combobox', { name: 'Product Category' }))
    await user.click(await screen.findByRole('option', { name: 'Dress' }))
    await user.click(screen.getByRole('combobox', { name: 'Collection' }))
    await user.click(await screen.findByRole('option', { name: '2026' }))
    await user.click(screen.getByRole('combobox', { name: 'Lifecycle Status' }))
    await user.click(await screen.findByRole('option', { name: 'Testing' }))
    await user.click(screen.getByRole('combobox', { name: 'Product Status' }))
    await user.click(await screen.findByRole('option', { name: 'Inactive' }))

    expect(
      fetchSpy.mock.calls.find(([, requestInit]) => requestInit?.method === 'PUT')
    ).toBeUndefined()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(screen.getByRole('button', { name: 'Saving changes…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Back to products' })).toBeDisabled()
    expect(screen.getByLabelText(/product name/i)).toBeDisabled()
    expect(screen.getByText('Saving product changes…')).toBeInTheDocument()

    resolveSaveRequest(
      jsonResponse({
        id: 'P-AB12CD',
        name: 'Valencia Gown Revised',
        shortDescription: 'Silk sample for fittings',
        image: null,
        lifecycleStatus: 'testing',
        productStatus: 'inactive',
        productCategory: 'dress',
        collection: {
          id: 2,
          name: '2026',
        },
        createdAt: '2026-07-01T18:33:00.000Z',
        createdBy: {
          id: 1,
          email: 'admin@example.com',
        },
      })
    )

    await waitFor(() => {
      const requestInit = fetchSpy.mock.calls.find(
        ([requestUrl, request]) =>
          String(requestUrl).endsWith('/products/P-AB12CD') && request?.method === 'PUT'
      )?.[1]

      expect(requestInit).toBeDefined()
      expect(requestInit?.headers).toEqual(
        expect.objectContaining({
          Authorization: 'Bearer opaque-access-token',
        })
      )
      expect(requestInit?.body).toBeInstanceOf(FormData)
      expect(readFormData(requestInit?.body).entries).toEqual({
        name: 'Valencia Gown Revised',
        shortDescription: 'Silk sample for fittings',
        lifecycleStatus: 'testing',
        productStatus: 'inactive',
        productCategory: 'dress',
        collectionId: '2',
      })
    })

    expect(await screen.findByText('Changes saved.')).toBeInTheDocument()
  })

  it('shows a live duplicate-name warning on edit without blocking save', async () => {
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

      if (url.endsWith('/products/P-EDIT01') && init?.method === 'GET') {
        return jsonResponse({
          product: {
            id: 'P-EDIT01',
            name: 'Mila Cape',
            shortDescription: null,
            image: null,
            lifecycleStatus: 'concept',
            productStatus: 'active',
            productCategory: null,
            collection: null,
            createdAt: '2026-07-01T18:33:00.000Z',
            createdBy: {
              id: 1,
              email: 'admin@example.com',
            },
          },
          collections: [],
        })
      }

      if (url.endsWith('/products') && init?.method === 'GET') {
        return jsonResponse({
          products: [
            {
              id: 'P-EDIT01',
              name: 'Mila Cape',
              lifecycleStatus: 'concept',
              productStatus: 'active',
              productCategory: null,
              collection: null,
              createdAt: '2026-07-01T18:33:00.000Z',
              createdBy: {
                id: 1,
                email: 'admin@example.com',
              },
            },
            {
              id: 'P-OTHER1',
              name: 'Valencia Gown',
              lifecycleStatus: 'testing',
              productStatus: 'active',
              productCategory: null,
              collection: null,
              createdAt: '2026-07-02T18:33:00.000Z',
              createdBy: {
                id: 2,
                email: 'operator@example.com',
              },
            },
          ],
          collections: [],
        })
      }

      if (url.endsWith('/products/P-EDIT01') && init?.method === 'PUT') {
        return jsonResponse({
          id: 'P-EDIT01',
          name: ' valencia gown ',
          shortDescription: null,
          image: null,
          lifecycleStatus: 'concept',
          productStatus: 'active',
          productCategory: null,
          collection: null,
          createdAt: '2026-07-01T18:33:00.000Z',
          createdBy: {
            id: 1,
            email: 'admin@example.com',
          },
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()

    renderProductsRoute('/app/products/P-EDIT01')

    expect(await screen.findByRole('heading', { name: 'Mila Cape' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/product name/i))
    await user.type(screen.getByLabelText(/product name/i), ' valencia gown ')

    expect(
      screen.getByText(
        'Active product Valencia Gown already uses this name. You can still save this product.'
      )
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      const requestInit = fetchSpy.mock.calls.find(
        ([requestUrl, request]) =>
          String(requestUrl).endsWith('/products/P-EDIT01') && request?.method === 'PUT'
      )?.[1]

      expect(requestInit?.body).toBeInstanceOf(FormData)
      expect(readFormData(requestInit?.body).entries.name).toBe('valencia gown')
    })

    expect(await screen.findByText('Changes saved.')).toBeInTheDocument()
  })

  it('keeps optional fields optional, validates inline, and warns before leaving unsaved edits', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
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

      if (url.endsWith('/products/P-ZX98QP') && init?.method === 'GET') {
        return jsonResponse({
          product: {
            id: 'P-ZX98QP',
            name: 'Mila Cape',
            shortDescription: 'Initial fitting notes',
            image: null,
            lifecycleStatus: 'approved',
            productStatus: 'active',
            productCategory: 'other',
            collection: {
              id: 1,
              name: '2025',
            },
            createdAt: '2026-07-01T18:33:00.000Z',
            createdBy: {
              id: 1,
              email: 'admin@example.com',
            },
          },
          collections: [{ id: 1, name: '2025' }],
        })
      }

      if (url.endsWith('/products') && init?.method === 'GET') {
        return jsonResponse({
          products: [
            {
              id: 'P-ZX98QP',
              name: 'Mila Cape',
              lifecycleStatus: 'approved',
              productStatus: 'active',
              productCategory: 'other',
              collection: { id: 1, name: '2025' },
              createdAt: '2026-07-01T18:33:00.000Z',
              createdBy: {
                id: 1,
                email: 'admin@example.com',
              },
            },
          ],
          collections: [{ id: 1, name: '2025' }],
        })
      }

      if (url.endsWith('/products/P-ZX98QP') && init?.method === 'PUT') {
        return jsonResponse({
          id: 'P-ZX98QP',
          name: 'Mila Cape',
          shortDescription: null,
          image: null,
          lifecycleStatus: 'approved',
          productStatus: 'active',
          productCategory: null,
          collection: null,
          createdAt: '2026-07-01T18:33:00.000Z',
          createdBy: {
            id: 1,
            email: 'admin@example.com',
          },
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()

    const { router } = renderProductsRoute('/app/products/P-ZX98QP')

    expect(await screen.findByRole('heading', { name: 'Mila Cape' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/product name/i))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Product name is required.')).toBeInTheDocument()
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      'http://localhost:3333/products/P-ZX98QP',
      expect.objectContaining({ method: 'PUT' })
    )

    await user.type(screen.getByLabelText(/product name/i), 'Mila Cape')
    await user.clear(screen.getByLabelText(/short product description/i))
    await user.click(screen.getByRole('combobox', { name: 'Product Category' }))
    await user.click(await screen.findByRole('option', { name: 'No category' }))
    await user.click(screen.getByRole('combobox', { name: 'Collection' }))
    await user.click(await screen.findByRole('option', { name: 'No collection' }))

    await user.click(screen.getByRole('button', { name: 'Back to products' }))

    expect(confirmSpy).toHaveBeenCalledWith(
      'You have unsaved changes. Leave this product without saving?'
    )
    expect(router.state.location.pathname).toBe('/app/products/P-ZX98QP')

    confirmSpy.mockReturnValueOnce(true)

    await user.click(screen.getByRole('button', { name: 'Back to products' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/app/products')
    })

    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument()
  })

  it('uploads one image, shows the persisted saved state after reload, and removes it back to empty', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    let imageState: { fileName: string } | null = null

    fetchSpy.mockImplementation(async (input, init) => {
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

      if (url.endsWith('/products/P-IMG001') && init?.method === 'GET') {
        return jsonResponse({
          product: {
            id: 'P-IMG001',
            name: 'Celeste Gown',
            shortDescription: null,
            image: imageState,
            lifecycleStatus: 'concept',
            productStatus: 'active',
            productCategory: null,
            collection: null,
            createdAt: '2026-07-01T18:33:00.000Z',
            createdBy: {
              id: 1,
              email: 'admin@example.com',
            },
          },
          collections: [],
        })
      }

      if (url.endsWith('/products/P-IMG001') && init?.method === 'PUT') {
        const { entries, imageFileName } = readFormData(init.body)

        if (imageFileName) {
          imageState = { fileName: imageFileName }
        } else if (entries.removeImage === 'true') {
          imageState = null
        }

        return jsonResponse({
          id: 'P-IMG001',
          name: 'Celeste Gown',
          shortDescription: null,
          image: imageState,
          lifecycleStatus: 'concept',
          productStatus: 'active',
          productCategory: null,
          collection: null,
          createdAt: '2026-07-01T18:33:00.000Z',
          createdBy: {
            id: 1,
            email: 'admin@example.com',
          },
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()

    renderProductsRoute('/app/products/P-IMG001')

    expect(await screen.findByRole('heading', { name: 'Celeste Gown' })).toBeInTheDocument()
    expect(screen.getByText('No product image uploaded.')).toBeInTheDocument()

    await user.upload(
      screen.getByLabelText('Upload image'),
      new File(['image-binary'], 'celeste-gown.png', { type: 'image/png' })
    )
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      const requestInit = fetchSpy.mock.calls.find(
        ([requestUrl, request]) =>
          String(requestUrl).endsWith('/products/P-IMG001') && request?.method === 'PUT'
      )?.[1]

      expect(requestInit?.body).toBeInstanceOf(FormData)
      expect(readFormData(requestInit?.body).imageFileName).toBe('celeste-gown.png')
    })

    expect(await screen.findByText('Saved image: celeste-gown.png')).toBeInTheDocument()

    cleanup()

    renderProductsRoute('/app/products/P-IMG001')

    expect(await screen.findByText('Saved image: celeste-gown.png')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove image' }))
    expect(screen.getByText('Current image will be removed on save.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      const requestInit = [...fetchSpy.mock.calls]
        .reverse()
        .find(
          ([requestUrl, request]) =>
            String(requestUrl).endsWith('/products/P-IMG001') && request?.method === 'PUT'
      )?.[1]

      expect(readFormData(requestInit?.body).entries.removeImage).toBe('true')
      expect(readFormData(requestInit?.body).imageFileName).toBeNull()
    })

    expect(await screen.findByText('No product image uploaded.')).toBeInTheDocument()
  })
})

function renderProductsRoute(initialEntry = '/app/products') {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [initialEntry],
    }),
  })
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    ),
  }
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

function readFormData(body: BodyInit | null | undefined) {
  if (!(body instanceof FormData)) {
    throw new Error('Expected request body to be FormData.')
  }

  const entries: Record<string, string> = {}
  let imageFileName: string | null = null

  body.forEach((value, key) => {
    if (value instanceof File) {
      if (key === 'image') {
        imageFileName = value.name
      }

      return
    }

    entries[key] = value
  })

  return { entries, imageFileName }
}
