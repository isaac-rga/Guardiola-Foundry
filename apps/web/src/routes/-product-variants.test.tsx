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

  it('explains why the last Product Variant cannot be deleted and enables deletion after replacement', async () => {
    const user = userEvent.setup()
    let variants = [variantFixture({ id: 'PV-BASE01', name: 'Base' })]
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))

      if (url.pathname === '/auth/me') {
        return jsonResponse(sessionFixture('operator'))
      }

      if (url.pathname === '/products/P-JACKIE' && init?.method === 'GET') {
        return jsonResponse(productDetailFixture())
      }

      if (url.pathname === '/products' && init?.method === 'GET') {
        return jsonResponse({ products: [productDetailFixture().product], collections: [] })
      }

      if (url.pathname === '/products/P-JACKIE/variants' && init?.method === 'GET') {
        return jsonResponse({ variants })
      }

      if (url.pathname === '/products/P-JACKIE/variants' && init?.method === 'POST') {
        const replacement = variantFixture({ id: 'PV-SHOW01', name: 'Jackie Showroom' })
        variants = [...variants, replacement]
        return jsonResponse(replacement, { status: 201 })
      }

      if (
        url.pathname === '/products/P-JACKIE/variants/PV-BASE01' &&
        init?.method === 'DELETE'
      ) {
        variants = variants.filter((variant) => variant.id !== 'PV-BASE01')
        return new Response(null, { status: 204 })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession('operator')
    renderProductRoute()

    const baseRow = (await screen.findByText('Base')).closest('tr')
    expect(baseRow).not.toBeNull()
    expect(
      within(baseRow as HTMLTableRowElement).getByRole('button', { name: 'Delete' })
    ).toBeDisabled()
    expect(
      within(baseRow as HTMLTableRowElement).getByText(
        'Create another Product Variant before deleting this one.'
      )
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add Product Variant' }))
    await user.type(screen.getByLabelText('Product Variant name'), 'Jackie Showroom')
    await user.click(screen.getByRole('button', { name: 'Add Variant' }))

    const updatedBaseRow = (await screen.findByText('Base')).closest('tr')
    const deleteButton = within(updatedBaseRow as HTMLTableRowElement).getByRole('button', {
      name: 'Delete',
    })
    expect(deleteButton).toBeEnabled()
    expect(
      within(updatedBaseRow as HTMLTableRowElement).queryByText(
        'Create another Product Variant before deleting this one.'
      )
    ).not.toBeInTheDocument()

    await user.click(deleteButton)
    const confirmationDialog = screen.getByRole('dialog')
    await user.click(
      within(confirmationDialog).getByRole('button', { name: 'Delete Product Variant' })
    )

    await waitFor(() => {
      expect(screen.queryByText('Base')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Jackie Showroom')).toBeInTheDocument()
  })

  it('confirms deletion with Product context and lets an Admin include and restore the Variant', async () => {
    const user = userEvent.setup()
    const baseVariant = variantFixture({ id: 'PV-BASE01', name: 'Base' })
    let variant = variantFixture({ id: 'PV-SHOW01', name: 'Jackie Showroom' })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))

      if (url.pathname === '/auth/me') {
        return jsonResponse(sessionFixture())
      }

      if (url.pathname === '/products/P-JACKIE' && init?.method === 'GET') {
        return jsonResponse(productDetailFixture())
      }

      if (url.pathname === '/products' && init?.method === 'GET') {
        return jsonResponse({ products: [productDetailFixture().product], collections: [] })
      }

      if (url.pathname === '/products/P-JACKIE/variants' && init?.method === 'GET') {
        return jsonResponse({
          variants:
            url.searchParams.get('includeDeleted') === 'true' || !variant.deletedAt
              ? [baseVariant, variant]
              : [baseVariant]
        })
      }

      if (
        url.pathname === '/products/P-JACKIE/variants/PV-SHOW01' &&
        init?.method === 'DELETE'
      ) {
        variant = { ...variant, deletedAt: '2026-09-08T16:00:00.000Z' }
        return new Response(null, { status: 204 })
      }

      if (
        url.pathname === '/products/P-JACKIE/variants/PV-SHOW01/restore' &&
        init?.method === 'POST'
      ) {
        variant = { ...variant, deletedAt: null }
        return jsonResponse(variant)
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()
    const router = renderProductRoute()

    const variantName = await screen.findByText('Jackie Showroom')
    const variantRow = variantName.closest('tr')
    expect(variantRow).not.toBeNull()

    await user.click(within(variantRow as HTMLTableRowElement).getByRole('button', { name: 'Delete' }))

    const confirmationDialog = screen.getByRole('dialog')
    expect(
      within(confirmationDialog).getByRole('heading', { name: 'Delete Jackie Showroom?' })
    ).toBeInTheDocument()
    expect(within(confirmationDialog).getByText(/Product Jackie/)).toBeInTheDocument()
    expect(
      fetchSpy.mock.calls.some(([, init]) => init?.method === 'DELETE')
    ).toBe(false)

    await user.click(
      within(confirmationDialog).getByRole('button', { name: 'Delete Product Variant' })
    )

    await waitFor(() => {
      expect(screen.queryByText('Jackie Showroom')).not.toBeInTheDocument()
    })

    await includeDeletedVariants(user)

    const deletedVariantName = await screen.findByText('Jackie Showroom')
    const deletedVariantRow = deletedVariantName.closest('tr')
    expect(deletedVariantRow).not.toBeNull()
    expect(within(deletedVariantRow as HTMLTableRowElement).getByText('Deleted')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Base Active/ })).not.toHaveTextContent('Deleted')
    expect(screen.getByRole('button', { name: 'Remove Include deleted filter' })).toBeVisible()
    expect(router.state.location.href).toBe('/app/products/P-JACKIE')

    await user.click(
      within(deletedVariantRow as HTMLTableRowElement).getByRole('button', { name: 'Restore' })
    )

    expect(await screen.findByRole('row', { name: /Jackie Showroom Active/ })).toBeVisible()
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3333/products/P-JACKIE/variants/PV-SHOW01/restore',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('does not offer deleted Variant history or recovery to an Operator', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))

      if (url.pathname === '/auth/me') {
        return jsonResponse(sessionFixture('operator'))
      }

      if (url.pathname === '/products/P-JACKIE' && init?.method === 'GET') {
        return jsonResponse(productDetailFixture())
      }

      if (url.pathname === '/products' && init?.method === 'GET') {
        return jsonResponse({ products: [productDetailFixture().product], collections: [] })
      }

      if (url.pathname === '/products/P-JACKIE/variants' && init?.method === 'GET') {
        return jsonResponse({ variants: [] })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession('operator')
    renderProductRoute()

    await screen.findByText('No Product Variants registered yet.')
    expect(screen.queryByRole('button', { name: 'Filter' })).not.toBeInTheDocument()
    expect(
      fetchSpy.mock.calls.some(([input]) => String(input).includes('includeDeleted=true'))
    ).toBe(false)
  })

  it.each([false, true])(
    'recovers from a Variant list 403 and preserves the Product draft (Include deleted: %s)',
    async (includeDeleted) => {
      const user = userEvent.setup()
      const baseVariant = variantFixture({ id: 'PV-BASE01', name: 'Base' })
      const requests: string[] = []
      let forbidden = true
      mockProductVariantRequests((url, method) => {
        if (method !== 'GET') return
        requests.push(url.search)
        if (forbidden && (url.searchParams.has('includeDeleted') === includeDeleted)) {
          return jsonResponse({ message: 'Forbidden' }, { status: 403 })
        }
        return jsonResponse({ variants: [baseVariant] })
      })

      seedStoredSession()
      const href = '/app/products/P-JACKIE?search=Jackie'
      const router = renderProductRoute(href)
      const name = await screen.findByRole('textbox', { name: 'Product name' })
      await user.type(name, ' draft')

      if (includeDeleted) {
        await screen.findByText('Base')
        await includeDeletedVariants(user)
      }

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('You do not have permission')
      expect(screen.queryByRole('table')).not.toBeInTheDocument()

      if (includeDeleted) {
        await user.click(screen.getByRole('button', { name: 'Inactivate Product' }))
        const dialog = await screen.findByRole('dialog')
        expect(within(dialog).getByRole('radio', { name: /Product and Active Variants/ })).toBeVisible()
        await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
      }

      const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      await act(async () => {
        window.dispatchEvent(new Event('visibilitychange'))
        visibility.mockReturnValue('visible')
        window.dispatchEvent(new Event('visibilitychange'))
        window.dispatchEvent(new Event('offline'))
        window.dispatchEvent(new Event('online'))
      })
      expect(screen.getByRole('alert')).toHaveTextContent('You do not have permission')
      expect(requests).toEqual(includeDeleted ? ['', '?includeDeleted=true'] : [''])

      forbidden = false
      await user.click(
        within(screen.getByRole('alert')).getByRole('button', { name: 'Clear all' })
      )

      expect(await screen.findByText('Base')).toBeVisible()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Remove Include deleted filter' })).not.toBeInTheDocument()
      expect(requests).toEqual(includeDeleted ? ['', '?includeDeleted=true', ''] : ['', ''])
      expect(name).toHaveValue('Jackie draft')
      expect(router.state.location.href).toBe(href)
      expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull()
    }
  )

  it('keeps denied Variant history hidden after a successful Variant save', async () => {
    const user = userEvent.setup()
    let finishRequest: (() => void) | undefined
    const deniedRequest = new Promise<void>((resolve) => {
      finishRequest = resolve
    })
    let forbidden = false
    const baseVariant = variantFixture({ id: 'PV-BASE01', name: 'Base' })
    const deletedVariant = variantFixture({
      id: 'PV-SHOW01',
      name: 'Jackie Showroom',
      deletedAt: '2026-09-08T16:00:00.000Z'
    })
    mockProductVariantRequests(async (url, method) => {
      if (method === 'POST') {
        return jsonResponse(variantFixture({ id: 'PV-RETAIL', name: 'Jackie Retail' }), { status: 201 })
      }
      if (method !== 'GET') return
      if (!url.searchParams.has('includeDeleted')) return jsonResponse({ variants: [baseVariant] })
      if (forbidden) {
        await deniedRequest
        return jsonResponse({ message: 'Forbidden' }, { status: 403 })
      }
      return jsonResponse({ variants: [baseVariant, deletedVariant] })
    })

    seedStoredSession()
    renderProductRoute()
    await screen.findByText('Base')
    await includeDeletedVariants(user)
    expect(await screen.findByText('Jackie Showroom')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Remove Include deleted filter' }))

    forbidden = true
    await includeDeletedVariants(user)
    expect(await screen.findByRole('status')).toHaveTextContent('Updating Product Variants…')
    expect(screen.getByText('Base')).toBeVisible()
    expect(screen.queryByText('Jackie Showroom')).not.toBeInTheDocument()
    finishRequest?.()
    expect(await screen.findByRole('alert')).toHaveTextContent('You do not have permission')

    await user.click(screen.getByRole('button', { name: 'Add Product Variant' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Product Variant name'), 'Jackie Retail')
    await user.click(within(dialog).getByRole('button', { name: 'Add Variant' }))

    expect(await screen.findByText('Added Jackie Retail.')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('You do not have permission')
    expect(screen.queryByText('Jackie Showroom')).not.toBeInTheDocument()
  })

  it('offers to inactivate current Variants after clearing the only successful list selection', async () => {
    const user = userEvent.setup()
    const baseVariant = variantFixture({ id: 'PV-BASE01', name: 'Base' })
    mockProductVariantRequests((url, method) => {
      if (method !== 'GET') return
      if (url.searchParams.has('includeDeleted')) {
        return jsonResponse({ variants: [baseVariant] })
      }
      return jsonResponse({ message: 'Unable to load Product Variants.' }, { status: 500 })
    })

    seedStoredSession()
    renderProductRoute()
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load Product Variants.')
    await includeDeletedVariants(user)
    expect(await screen.findByText('Base')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Remove Include deleted filter' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load Product Variants.')

    await user.click(screen.getByRole('button', { name: 'Inactivate Product' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('radio', { name: /Product and Active Variants/ })).toBeVisible()
  })

  it('offers sign-in after a Variant list 401 and honors the unsaved Product draft prompt', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    mockProductVariantRequests((_, method) => {
      if (method === 'GET') return jsonResponse({ message: 'Unauthorized' }, { status: 401 })
    })

    seedStoredSession()
    const router = renderProductRoute()
    const name = await screen.findByRole('textbox', { name: 'Product name' })
    await user.type(name, ' draft')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Your session has expired.')
    expect(within(alert).queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument()
    const signInAgain = within(alert).getByRole('button', { name: 'Sign in again' })
    await user.click(signInAgain)

    expect(router.state.location.pathname).toBe('/app/products/P-JACKIE')
    expect(name).toHaveValue('Jackie draft')
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull()

    await user.click(signInAgain)

    expect(await screen.findByRole('heading', { name: 'Sign in to Guardiola Foundry' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull()
  })

  it('keeps a deleted Variant visible and explains an Admin restoration name conflict', async () => {
    const user = userEvent.setup()
    const deletedVariant = variantFixture({
      id: 'PV-SHOW01',
      name: 'Jackie Showroom',
      deletedAt: '2026-09-08T16:00:00.000Z'
    })
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))

      if (url.pathname === '/auth/me') {
        return jsonResponse(sessionFixture())
      }

      if (url.pathname === '/products/P-JACKIE' && init?.method === 'GET') {
        return jsonResponse(productDetailFixture())
      }

      if (url.pathname === '/products' && init?.method === 'GET') {
        return jsonResponse({ products: [productDetailFixture().product], collections: [] })
      }

      if (url.pathname === '/products/P-JACKIE/variants' && init?.method === 'GET') {
        return jsonResponse({
          variants: url.searchParams.get('includeDeleted') === 'true' ? [deletedVariant] : []
        })
      }

      if (
        url.pathname === '/products/P-JACKIE/variants/PV-SHOW01/restore' &&
        init?.method === 'POST'
      ) {
        return jsonResponse(
          {
            errors: {
              name: [
                'Restore blocked: another Product Variant in this Product already uses this name.'
              ]
            }
          },
          { status: 422 }
        )
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()
    renderProductRoute()

    await screen.findByText('No Product Variants registered yet.')
    await includeDeletedVariants(user)
    const deletedVariantRow = (await screen.findByText('Jackie Showroom')).closest('tr')
    expect(deletedVariantRow).not.toBeNull()

    await user.click(
      within(deletedVariantRow as HTMLTableRowElement).getByRole('button', { name: 'Restore' })
    )

    expect(
      await screen.findByText(
        'Restore blocked: another Product Variant in this Product already uses this name.'
      )
    ).toHaveAttribute('role', 'alert')
    expect(screen.getByText('Jackie Showroom')).toBeInTheDocument()
    expect(within(deletedVariantRow as HTMLTableRowElement).getByText('Deleted')).toBeInTheDocument()
  })
})

function mockProductVariantRequests(
  respond: (
    url: URL,
    method: string | undefined
  ) => Response | undefined | Promise<Response | undefined>
) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = new URL(String(input))

    if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
    if (url.pathname === '/products/P-JACKIE' && init?.method === 'GET') {
      return jsonResponse(productDetailFixture())
    }
    if (url.pathname === '/products' && init?.method === 'GET') {
      return jsonResponse({ products: [productDetailFixture().product], collections: [] })
    }
    if (url.pathname === '/products/P-JACKIE/variants') {
      const response = await respond(url, init?.method)
      if (response) return response
    }
    throw new Error(`Unexpected request: ${url}`)
  })
}

async function includeDeletedVariants(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Filter' }))
  const filters = await screen.findByRole('dialog', { name: 'Table filters' })
  await user.click(within(filters).getByRole('button', { name: /Include deleted/ }))
  await user.keyboard('{Escape}')
}

function renderProductRoute(initialEntry = '/app/products/P-JACKIE') {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [initialEntry]
    })
  })
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 30_000 },
      mutations: { retry: false }
    }
  })

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
  return router
}

function seedStoredSession(role: 'admin' | 'operator' = 'admin') {
  localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({
      token: 'opaque-access-token',
      tokenType: 'Bearer',
      expiresAt: '2026-09-08T18:33:00.000Z',
      user: sessionFixture(role).user
    })
  )
}

function sessionFixture(role: 'admin' | 'operator' = 'admin') {
  return {
    tokenType: 'Bearer' as const,
    expiresAt: '2026-09-08T18:33:00.000Z',
    user: {
      id: 1,
      email: `${role}@example.com`,
      role,
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

function variantFixture(overrides: {
  id: string
  name: string
  status?: 'active' | 'inactive'
  deletedAt?: string | null
}) {
  return {
    id: overrides.id,
    productId: 'P-JACKIE',
    name: overrides.name,
    status: overrides.status ?? 'active',
    deletedAt: overrides.deletedAt ?? null,
    createdAt: '2026-09-08T15:00:00.000Z'
  }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
