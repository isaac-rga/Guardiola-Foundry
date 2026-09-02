import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AUTH_SESSION_STORAGE_KEY } from '@/lib/auth/session-storage'
import { routeTree } from '../routeTree.gen'

describe('Source edit route', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('edits Source data and Vendor Shades, refreshes detail and catalog caches, and keeps identity read-only', async () => {
    const user = userEvent.setup()
    const originalDetail = sourceDetailResponse()
    const updatedDetail = sourceDetailResponse({
      name: 'Updated Silk Crepe',
      landedUnitCostCents: null,
      estimatedShippingUsdPerKilogramCents: 9900,
      costNeedsAttention: true,
      vendorShades: [{ id: 1, nameOrCode: 'Ivory 101' }],
    })
    let listRequestCount = 0
    let hasUpdated = false
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        const url = String(input)
        if (url.endsWith('/auth/me')) return sessionResponse('operator')
        if (
          new URL(url).pathname.endsWith('/sources') &&
          init?.method === 'GET'
        ) {
          listRequestCount += 1
          return jsonResponse(
            sourceListResponse(
              listRequestCount === 1
                ? 'Italian Silk Crepe'
                : 'Updated Silk Crepe',
            ),
          )
        }
        if (url.endsWith('/sources/S-0001') && init?.method === 'GET') {
          return jsonResponse(hasUpdated ? updatedDetail : originalDetail)
        }
        if (url.endsWith('/sources/S-0001') && init?.method === 'PUT') {
          hasUpdated = true
          return jsonResponse(updatedDetail)
        }
        throw new Error(`Unexpected request: ${url}`)
      })
    seedStoredSession('operator')
    const { router } = renderSourceRoute('/app/sources')

    await user.click(
      await screen.findByRole('link', { name: /Italian Silk Crepe/ }),
    )
    await user.click(await screen.findByRole('link', { name: 'Edit Source' }))

    expect(
      await screen.findByRole('heading', { name: 'Edit Source' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Commercial data' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Technical data' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Future costing inputs' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Vendor Shades' }),
    ).toBeInTheDocument()
    expect(screen.getByText('S-0001')).toBeInTheDocument()
    expect(screen.getByText('SRC-100')).toBeInTheDocument()
    expect(screen.queryByLabelText('Source ID')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Legacy Source ID')).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('Source Name'))
    await user.type(screen.getByLabelText('Source Name'), 'Updated Silk Crepe')
    await user.clear(screen.getByLabelText('Landed Unit Cost (MXN per meter)'))
    await user.clear(screen.getByLabelText('Estimated Shipping (USD per kg)'))
    await user.type(
      screen.getByLabelText('Estimated Shipping (USD per kg)'),
      '99',
    )
    await user.clear(screen.getByRole('textbox', { name: 'Vendor Shades' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Vendor Shades' }),
      'Ivory 101',
    )
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(await screen.findByText('Changes saved.')).toBeInTheDocument()
    const updateCall = fetchSpy.mock.calls.find(
      ([input, init]) =>
        String(input).endsWith('/sources/S-0001') && init?.method === 'PUT',
    )
    expect(updateCall).toBeDefined()
    expect(JSON.parse(String(updateCall?.[1]?.body))).toEqual(
      expect.objectContaining({
        name: 'Updated Silk Crepe',
        landedUnitCostCents: null,
        estimatedShippingUsdPerKilogramCents: 9900,
        vendorShades: ['Ivory 101'],
      }),
    )
    expect(JSON.parse(String(updateCall?.[1]?.body))).not.toHaveProperty('id')
    expect(JSON.parse(String(updateCall?.[1]?.body))).not.toHaveProperty(
      'legacySourceId',
    )

    await user.click(screen.getByRole('link', { name: 'View Source' }))
    expect(
      await screen.findByRole('heading', { name: 'Updated Silk Crepe' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Cost needs attention')).toBeInTheDocument()
    expect(screen.getByText('USD $99.00 / kg')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/app/sources/S-0001')

    await user.click(screen.getByRole('link', { name: 'Back to Sources' }))
    expect(
      await screen.findByRole('link', { name: /Updated Silk Crepe/ }),
    ).toBeInTheDocument()
    await waitFor(() => expect(listRequestCount).toBe(2))
  })

  it('shows field errors without discarding unsaved edits', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse('admin')
      if (url.endsWith('/sources/S-0001') && init?.method === 'GET') {
        return jsonResponse(sourceDetailResponse())
      }
      if (url.endsWith('/sources/S-0001') && init?.method === 'PUT') {
        return jsonResponse(
          {
            errors: {
              purchasePriceCents: ['Purchase Price must be confirmed.'],
            },
          },
          { status: 422 },
        )
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession('admin')
    renderSourceRoute('/app/sources/S-0001/edit')

    await screen.findByRole('heading', { name: 'Edit Source' })
    await user.clear(screen.getByLabelText('Vendor'))
    await user.type(screen.getByLabelText('Vendor'), 'Unsaved Vendor')
    await user.clear(screen.getByLabelText('Purchase Price'))
    await user.type(screen.getByLabelText('Purchase Price'), '42.5')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    expect(
      await screen.findByText('Purchase Price must be confirmed.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Vendor')).toHaveValue('Unsaved Vendor')
    expect(screen.getByLabelText('Purchase Price')).toHaveValue(42.5)
  })
})

function renderSourceRoute(initialEntry: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return {
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  }
}

function sourceListResponse(name: string) {
  return {
    sources: [
      {
        id: 'S-0001',
        name,
        vendor: 'Casa Tessile',
        textileFamily: 'Crepe',
        purchasePresentation: 'roll',
        purchaseUnit: 'yard',
        vendorCurrency: 'USD',
        purchasePriceCents: 3600,
        landedUnitCostCents: name.startsWith('Updated') ? null : 4200,
        linkedMaterialCount: 1,
        costNeedsAttention: name.startsWith('Updated'),
        dataNeedsAttention: false,
      },
    ],
  }
}

function sourceDetailResponse(overrides: Record<string, unknown> = {}) {
  return {
    source: {
      id: 'S-0001',
      legacySourceId: 'SRC-100',
      name: 'Italian Silk Crepe',
      vendor: 'Casa Tessile',
      textileFamily: 'Crepe',
      purchasePresentation: 'roll',
      fixedPieceLength: null,
      purchaseUnit: 'yard',
      minimumPurchaseQuantity: 1,
      purchasePriceCents: 3600,
      priceDate: '2026-07-01',
      vendorCurrency: 'USD',
      landedUnitCostCents: 4200,
      sourceStatus: 'active',
      normalizedUnit: 'meter',
      vendorSku: 'CREPE-IVORY-01',
      url: 'https://vendor.example/italian-silk-crepe',
      description: 'Silk crepe for bridal base fabric.',
      manufacturer: 'Casa Tessile Mill',
      fiber: 'Silk',
      composition: '100% silk',
      gsmGramsPerSquareMeter: 120,
      widthCentimeters: 140,
      finish: 'Matte',
      weave: 'Crepe weave',
      presentationNotes: 'Rolled on a cardboard tube.',
      countryOfOrigin: 'Italy',
      comments: 'Complete fixture.',
      estimatedShippingUsdPerKilogramCents: 1500,
      igiPercentage: 15,
      ivaPercentage: 16,
      costNeedsAttention: false,
      dataNeedsAttention: false,
      vendorShades: [{ id: 1, nameOrCode: 'Ivory 100' }],
      linkedMaterials: [],
      ...overrides,
    },
  }
}

function sessionResponse(role: 'admin' | 'operator') {
  return jsonResponse({
    tokenType: 'Bearer',
    expiresAt: '2026-09-30T18:33:00.000Z',
    user: { id: 1, email: `${role}@example.com`, role, active: true },
  })
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function seedStoredSession(role: 'admin' | 'operator') {
  localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({
      token: 'opaque-access-token',
      tokenType: 'Bearer',
      expiresAt: '2026-09-30T18:33:00.000Z',
      user: { id: 1, email: `${role}@example.com`, role, active: true },
    }),
  )
}
