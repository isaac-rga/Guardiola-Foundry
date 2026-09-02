import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AUTH_SESSION_STORAGE_KEY } from '@/lib/auth/session-storage'
import { routeTree } from '../routeTree.gen'

describe('Source detail route', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('shows the complete read-only Source record and active and historical Material usage', async () => {
    mockAuthenticatedSourceDetail(sourceDetailResponse())
    seedStoredSession('operator')

    renderSourceDetailRoute('/app/sources/S-0001')

    expect(
      await screen.findByRole('heading', { name: 'Italian Silk Crepe' }),
    ).toBeInTheDocument()
    expect(screen.getByText('S-0001')).toBeInTheDocument()
    expect(screen.getAllByText('Active')).toHaveLength(2)
    expect(screen.getByText('Complete')).toBeInTheDocument()

    const commercial = screen.getByRole('region', { name: 'Commercial data' })
    expect(commercial).toHaveTextContent('Casa Tessile')
    expect(commercial).toHaveTextContent('Crepe')
    expect(commercial).toHaveTextContent('Roll')
    expect(commercial).toHaveTextContent('Yard')
    expect(commercial).toHaveTextContent('$36.00')
    expect(commercial).toHaveTextContent('MX$42.00 / meter')
    expect(commercial).toHaveTextContent('July 1, 2026')

    const technical = screen.getByRole('region', { name: 'Technical data' })
    expect(technical).toHaveTextContent('100% silk')
    expect(technical).toHaveTextContent('120 g/m²')
    expect(technical).toHaveTextContent('140 cm')
    expect(technical).toHaveTextContent('Ivory 100')

    const costing = screen.getByRole('region', { name: 'Future costing inputs' })
    expect(costing).toHaveTextContent('These inputs do not recalculate Landed Unit Cost.')
    expect(costing).toHaveTextContent('USD $15.00 / kg')
    expect(costing).toHaveTextContent('IGI 15%')
    expect(costing).toHaveTextContent('IVA 16% fixed business rule')

    const materials = screen.getByRole('region', { name: 'Linked Materials' })
    expect(within(materials).getByText('Ivory Silk Crepe')).toBeInTheDocument()
    expect(within(materials).getByText('Champagne Crepe')).toBeInTheDocument()
    expect(within(materials).getByText('Preferred')).toBeInTheDocument()
    expect(within(materials).getByText('Alternate')).toBeInTheDocument()
    expect(within(materials).getByText('Historical')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Back to Sources' })).toHaveAttribute(
      'href',
      '/app/sources',
    )
    expect(screen.getByRole('link', { name: 'Edit Source' })).toHaveAttribute(
      'href',
      '/app/sources/S-0001/edit',
    )
    expect(screen.queryByRole('button', { name: /link|unlink|preferred/i })).not.toBeInTheDocument()
  })

  it('explains loading and permission-safe missing states with a route back to the catalog', async () => {
    let resolveDetailRequest!: (response: Response) => void
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse('operator')
      if (url.endsWith('/sources/S-9999') && init?.method === 'GET') {
        return await new Promise<Response>((resolve) => {
          resolveDetailRequest = resolve
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession('operator')

    renderSourceDetailRoute('/app/sources/S-9999')

    expect(await screen.findByText('Loading Source detail...')).toBeInTheDocument()

    resolveDetailRequest(jsonResponse({ message: 'Source not found.' }, { status: 404 }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Source not found.')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Return to the catalog or try this request again.',
    )
    expect(screen.getByRole('link', { name: 'Back to Sources' })).toHaveAttribute(
      'href',
      '/app/sources',
    )
  })

  it('recovers from a Source service error when the user retries', async () => {
    const user = userEvent.setup()
    let detailRequestCount = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse('admin')
      if (url.endsWith('/sources/S-0001') && init?.method === 'GET') {
        detailRequestCount += 1
        return detailRequestCount === 1
          ? jsonResponse({ message: 'Source catalog unavailable.' }, { status: 503 })
          : jsonResponse(sourceDetailResponse())
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession('admin')

    renderSourceDetailRoute('/app/sources/S-0001')

    expect(await screen.findByRole('alert')).toHaveTextContent('Source catalog unavailable.')
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(
      await screen.findByRole('heading', { name: 'Italian Silk Crepe' }),
    ).toBeInTheDocument()
    await waitFor(() => expect(detailRequestCount).toBe(2))
  })
})

function renderSourceDetailRoute(initialEntry: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

function mockAuthenticatedSourceDetail(body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input)
    if (url.endsWith('/auth/me')) return sessionResponse('operator')
    if (url.endsWith('/sources/S-0001') && init?.method === 'GET') return jsonResponse(body)
    throw new Error(`Unexpected request: ${url}`)
  })
}

function sourceDetailResponse() {
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
      linkedMaterials: [
        {
          id: 'M-0001',
          name: 'Ivory Silk Crepe',
          materialColor: 'ivory',
          materialUse: 'base-fabric',
          relationship: 'preferred',
          relationshipStatus: 'active',
          vendorShade: { id: 1, nameOrCode: 'Ivory 100' },
        },
        {
          id: 'M-0002',
          name: 'Champagne Crepe',
          materialColor: 'champagne',
          materialUse: 'base-fabric',
          relationship: 'alternate',
          relationshipStatus: 'historical',
          vendorShade: null,
        },
      ],
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
