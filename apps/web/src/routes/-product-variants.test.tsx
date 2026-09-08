import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
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

describe('Product Variants on the product route', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('lists, registers, renames, and changes the status of Product Variants', async () => {
    const user = userEvent.setup()
    let variants = [variantFixture({ id: 'PV-SHOW01', name: 'Jackie Showroom' })]
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/auth/me')) {
        return jsonResponse(sessionFixture())
      }

      if (url.endsWith('/products/P-JACKIE') && init?.method === 'GET') {
        return jsonResponse(productDetailFixture())
      }

      if (url.endsWith('/products') && init?.method === 'GET') {
        return jsonResponse({
          products: [productDetailFixture().product],
          collections: []
        })
      }

      if (url.endsWith('/products/P-JACKIE/variants') && init?.method === 'GET') {
        return jsonResponse({ variants })
      }

      if (url.endsWith('/products/P-JACKIE/variants') && init?.method === 'POST') {
        variants = [...variants, variantFixture({ id: 'PV-BOUT01', name: 'Jackie Boutique' })]
        return jsonResponse(variants[1], { status: 201 })
      }

      if (url.endsWith('/products/P-JACKIE/variants/PV-BOUT01') && init?.method === 'PUT') {
        variants = variants.map((variant) =>
          variant.id === 'PV-BOUT01'
            ? variantFixture({
                id: 'PV-BOUT01',
                name: 'Jackie Retail',
                status: 'inactive'
              })
            : variant
        )
        return jsonResponse(variants[1])
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()
    renderProductRoute()

    expect(await screen.findByText('Product Variants')).toBeInTheDocument()
    expect(await screen.findByText('Jackie Showroom')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add Product Variant' }))
    const createDialog = screen.getByRole('dialog')
    await user.type(within(createDialog).getByLabelText('Product Variant name'), 'Jackie Boutique')
    await user.click(within(createDialog).getByRole('button', { name: 'Add Variant' }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3333/products/P-JACKIE/variants',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Jackie Boutique' })
        })
      )
    })
    expect(await screen.findByText('Jackie Boutique')).toBeInTheDocument()

    const boutiqueRow = screen.getByText('Jackie Boutique').closest('tr')
    expect(boutiqueRow).not.toBeNull()
    await user.click(
      within(boutiqueRow as HTMLTableRowElement).getByRole('button', {
        name: 'Edit'
      })
    )

    const editDialog = screen.getByRole('dialog')
    const nameInput = within(editDialog).getByLabelText('Product Variant name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Jackie Retail')
    await user.click(
      within(editDialog).getByRole('combobox', {
        name: 'Product Variant status'
      })
    )
    await user.click(await screen.findByRole('option', { name: 'Inactive' }))
    await user.click(within(editDialog).getByRole('button', { name: 'Save Variant' }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3333/products/P-JACKIE/variants/PV-BOUT01',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Jackie Retail', status: 'inactive' })
        })
      )
    })

    const retailRow = (await screen.findByText('Jackie Retail')).closest('tr')
    expect(retailRow).not.toBeNull()
    expect(within(retailRow as HTMLTableRowElement).getByText('Inactive')).toBeInTheDocument()
    expect(within(retailRow as HTMLTableRowElement).getByText('PV-BOUT01')).toBeInTheDocument()
  })

  it('preserves an entered Variant name and explains an availability failure', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/auth/me')) {
        return jsonResponse(sessionFixture())
      }

      if (url.endsWith('/products/P-JACKIE') && init?.method === 'GET') {
        return jsonResponse(productDetailFixture())
      }

      if (url.endsWith('/products') && init?.method === 'GET') {
        return jsonResponse({
          products: [productDetailFixture().product],
          collections: []
        })
      }

      if (url.endsWith('/products/P-JACKIE/variants') && init?.method === 'GET') {
        return jsonResponse({ variants: [] })
      }

      if (url.endsWith('/products/P-JACKIE/variants') && init?.method === 'POST') {
        return jsonResponse(
          {
            errors: {
              productId: ['Product Variants can only be added to an active Product.']
            }
          },
          { status: 422 }
        )
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()
    renderProductRoute()

    await screen.findByText('Product Variants')
    await user.click(screen.getByRole('button', { name: 'Add Product Variant' }))
    const nameInput = screen.getByLabelText('Product Variant name')
    await user.type(nameInput, 'Jackie Trunk Show')
    await user.click(screen.getByRole('button', { name: 'Add Variant' }))

    expect(await screen.findByText('Product Variants can only be added to an active Product.')).toHaveAttribute(
      'role',
      'alert'
    )
    expect(screen.getByLabelText('Product Variant name')).toHaveValue('Jackie Trunk Show')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('preserves an overlong Variant name and explains the validation limit', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/auth/me')) {
        return jsonResponse(sessionFixture())
      }

      if (url.endsWith('/products/P-JACKIE') && init?.method === 'GET') {
        return jsonResponse(productDetailFixture())
      }

      if (url.endsWith('/products') && init?.method === 'GET') {
        return jsonResponse({ products: [productDetailFixture().product], collections: [] })
      }

      if (url.endsWith('/products/P-JACKIE/variants') && init?.method === 'GET') {
        return jsonResponse({ variants: [] })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()
    renderProductRoute()

    await screen.findByText('Product Variants')
    await user.click(screen.getByRole('button', { name: 'Add Product Variant' }))
    const overlongName = 'V'.repeat(256)
    const nameInput = screen.getByLabelText('Product Variant name')
    await user.type(nameInput, overlongName)
    await user.click(screen.getByRole('button', { name: 'Add Variant' }))

    expect(await screen.findByText('Product Variant name must be 255 characters or fewer.')).toBeInTheDocument()
    expect(nameInput).toHaveValue(overlongName)
    expect(
      fetchSpy.mock.calls.filter(
        ([input, init]) => String(input).endsWith('/products/P-JACKIE/variants') && init?.method === 'POST'
      )
    ).toHaveLength(0)
  })
})

function renderProductRoute() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ['/app/products/P-JACKIE']
    })
  })
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

function seedStoredSession() {
  localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({
      token: 'opaque-access-token',
      tokenType: 'Bearer',
      expiresAt: '2026-09-08T18:33:00.000Z',
      user: sessionFixture().user
    })
  )
}

function sessionFixture() {
  return {
    tokenType: 'Bearer' as const,
    expiresAt: '2026-09-08T18:33:00.000Z',
    user: {
      id: 1,
      email: 'admin@example.com',
      role: 'admin' as const,
      active: true
    }
  }
}

function productDetailFixture() {
  return {
    state: 'active' as const,
    product: {
      id: 'P-JACKIE',
      name: 'Jackie',
      shortDescription: null,
      image: null,
      lifecycleStatus: 'testing' as const,
      productStatus: 'active' as const,
      productCategory: 'dress' as const,
      collection: null,
      createdAt: '2026-09-01T18:33:00.000Z',
      createdBy: { id: 1, email: 'admin@example.com' }
    },
    collections: []
  }
}

function variantFixture(overrides: { id: string; name: string; status?: 'active' | 'inactive' }) {
  return {
    id: overrides.id,
    productId: 'P-JACKIE',
    name: overrides.name,
    status: overrides.status ?? 'active',
    createdAt: '2026-09-08T15:00:00.000Z'
  }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
