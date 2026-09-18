import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useUpdateSource } from './queries'

describe('Source query cache', () => {
  afterEach(() => vi.restoreAllMocks())

  it('invalidates Material searches when visible Source context changes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        source: {
          id: 'S-0001',
          legacySourceId: null,
          name: 'Updated source',
          vendor: 'Updated vendor',
          textileFamily: 'Crepe',
          purchasePresentation: 'roll',
          fixedPieceLength: null,
          purchaseUnit: 'meter',
          minimumPurchaseQuantity: 1,
          purchasePriceCents: 1000,
          priceDate: '2026-09-14',
          vendorCurrency: 'USD',
          landedUnitCostCents: 1100,
          sourceStatus: 'active',
          normalizedUnit: 'meter',
          vendorSku: null,
          url: null,
          description: null,
          manufacturer: null,
          fiber: null,
          composition: null,
          gsmGramsPerSquareMeter: null,
          widthCentimeters: 140,
          finish: null,
          weave: null,
          presentationNotes: null,
          countryOfOrigin: null,
          comments: null,
          estimatedShippingUsdPerKilogramCents: null,
          igiPercentage: null,
          ivaPercentage: 16,
          costNeedsAttention: false,
          dataNeedsAttention: false,
          vendorShades: [],
          linkedMaterials: [],
        },
      }),
    )
    const queryClient = createQueryClient()
    queryClient.setQueryData(['materials', 'search', 'silk'], {
      items: [],
      hasMore: false,
    })
    queryClient.setQueryData(['pattern-sets', 'search', 'skirt'], {
      items: [],
      hasMore: false,
    })
    const { result } = renderHook(() => useUpdateSource('token', 'S-0001'), {
      wrapper: createWrapper(queryClient),
    })

    await act(() =>
      result.current.mutateAsync({
        name: 'Updated source',
        vendor: 'Updated vendor',
        textileFamily: 'Crepe',
        purchasePresentation: 'roll',
        purchaseUnit: 'meter',
        minimumPurchaseQuantity: 1,
        purchasePriceCents: 1000,
        priceDate: '2026-09-14',
        vendorCurrency: 'USD',
        description: null,
        widthCentimeters: 140,
        landedUnitCostCents: 1100,
      }),
    )

    expect(
      queryClient.getQueryState(['materials', 'search', 'silk'])?.isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryState(['pattern-sets', 'search', 'skirt'])
        ?.isInvalidated,
    ).toBe(false)
  })
})

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}
