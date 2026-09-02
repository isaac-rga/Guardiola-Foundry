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

describe('Source create route', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('creates a USD Source without calculating Landed Unit Cost and opens its stable route', async () => {
    const user = userEvent.setup()
    const createdResponse = sourceDetailResponse()
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        const url = String(input)
        if (url.endsWith('/auth/me')) return sessionResponse('operator')
        if (url.endsWith('/sources') && init?.method === 'POST') {
          return jsonResponse(createdResponse, { status: 201 })
        }
        if (url.endsWith('/sources/S-0042') && init?.method === 'GET') {
          return jsonResponse(createdResponse)
        }
        throw new Error(`Unexpected request: ${url}`)
      })
    seedStoredSession('operator')
    const { router } = renderSourceCreateRoute('/app/sources/new')

    expect(
      await screen.findByRole('heading', { name: 'Create Source' }),
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
    expect(
      screen.getByText(
        'These inputs do not calculate or update Landed Unit Cost.',
      ),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Source Name'), 'New Silk Organza')
    await user.type(screen.getByLabelText('Vendor'), 'Maison Textile')
    await user.clear(screen.getByLabelText('Purchase Price'))
    await user.type(screen.getByLabelText('Purchase Price'), '24')
    await user.type(screen.getByLabelText('Price Date'), '2026-09-01')
    await user.clear(screen.getByLabelText('Estimated Shipping (USD per kg)'))
    await user.type(
      screen.getByLabelText('Estimated Shipping (USD per kg)'),
      '9',
    )
    await user.clear(screen.getByLabelText('IGI Percentage'))
    await user.type(screen.getByLabelText('IGI Percentage'), '10')
    await user.type(
      screen.getByRole('textbox', { name: 'Vendor Shades' }),
      'Ivory 100',
    )
    await user.click(screen.getByRole('button', { name: 'Create Source' }))

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/app/sources/S-0042'),
    )
    expect(
      await screen.findByRole('heading', { name: 'New Silk Organza' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Cost needs attention')).toBeInTheDocument()
    expect(screen.getByText('Data needs attention')).toBeInTheDocument()

    const createCall = fetchSpy.mock.calls.find(
      ([input, init]) =>
        String(input).endsWith('/sources') && init?.method === 'POST',
    )
    expect(createCall).toBeDefined()
    expect(JSON.parse(String(createCall?.[1]?.body))).toEqual(
      expect.objectContaining({
        name: 'New Silk Organza',
        vendor: 'Maison Textile',
        textileFamily: 'Crepe',
        purchasePresentation: 'roll',
        purchaseUnit: 'meter',
        minimumPurchaseQuantity: 1,
        purchasePriceCents: 2400,
        priceDate: '2026-09-01',
        vendorCurrency: 'USD',
        landedUnitCostCents: null,
        estimatedShippingUsdPerKilogramCents: 900,
        igiPercentage: 10,
        vendorShades: ['Ivory 100'],
      }),
    )
  })

  it('shows field-level validation and preserves entered values after server rejection', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse('admin')
      if (url.endsWith('/sources') && init?.method === 'POST') {
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
    renderSourceCreateRoute('/app/sources/new')

    await user.type(
      await screen.findByLabelText('Source Name'),
      'Entered Source',
    )
    await user.type(screen.getByLabelText('Vendor'), 'Entered Vendor')
    await user.clear(screen.getByLabelText('Purchase Price'))
    await user.type(screen.getByLabelText('Purchase Price'), '18.5')
    await user.type(screen.getByLabelText('Price Date'), '2026-09-01')
    await user.click(screen.getByRole('button', { name: 'Create Source' }))

    expect(
      await screen.findByText('Purchase Price must be confirmed.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Source Name')).toHaveValue('Entered Source')
    expect(screen.getByLabelText('Vendor')).toHaveValue('Entered Vendor')
    expect(screen.getByLabelText('Purchase Price')).toHaveValue(18.5)
  })

  it('blocks invalid commercial-core values at the form boundary without discarding input', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) => {
        const url = String(input)
        if (url.endsWith('/auth/me')) return sessionResponse('operator')
        throw new Error(`Unexpected request: ${url}`)
      })
    seedStoredSession('operator')
    renderSourceCreateRoute('/app/sources/new')

    await user.type(
      await screen.findByLabelText('Source Name'),
      'Invalid Source',
    )
    await user.type(screen.getByLabelText('Vendor'), 'Vendor')
    await user.clear(screen.getByLabelText('Minimum Purchase Quantity'))
    await user.type(screen.getByLabelText('Minimum Purchase Quantity'), '0')
    await user.clear(screen.getByLabelText('Purchase Price'))
    await user.type(screen.getByLabelText('Purchase Price'), '-1')
    expect(screen.getByLabelText('Minimum Purchase Quantity')).toHaveValue(0)
    expect(screen.getByLabelText('Purchase Price')).toHaveValue(-1)
    await user.click(screen.getByRole('button', { name: 'Create Source' }))

    expect(
      await screen.findByText(
        'Minimum Purchase Quantity must be greater than 0.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Purchase Price cannot be negative.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Source Name')).toHaveValue('Invalid Source')
    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/\/sources$/),
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

function renderSourceCreateRoute(initialEntry: string) {
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

function sourceDetailResponse() {
  return {
    source: {
      id: 'S-0042',
      legacySourceId: null,
      name: 'New Silk Organza',
      vendor: 'Maison Textile',
      textileFamily: 'Crepe',
      purchasePresentation: 'roll',
      fixedPieceLength: null,
      purchaseUnit: 'meter',
      minimumPurchaseQuantity: 1,
      purchasePriceCents: 2400,
      priceDate: '2026-09-01',
      vendorCurrency: 'USD',
      landedUnitCostCents: null,
      sourceStatus: 'active',
      normalizedUnit: 'meter',
      vendorSku: null,
      url: null,
      description: null,
      manufacturer: null,
      fiber: null,
      composition: null,
      gsmGramsPerSquareMeter: null,
      widthCentimeters: null,
      finish: null,
      weave: null,
      presentationNotes: null,
      countryOfOrigin: null,
      comments: null,
      estimatedShippingUsdPerKilogramCents: 900,
      igiPercentage: 10,
      ivaPercentage: 16,
      costNeedsAttention: true,
      dataNeedsAttention: true,
      vendorShades: [],
      linkedMaterials: [],
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
