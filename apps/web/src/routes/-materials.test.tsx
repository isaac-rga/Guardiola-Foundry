import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AUTH_SESSION_STORAGE_KEY } from '@/lib/auth/session-storage'
import { routeTree } from '../routeTree.gen'

describe('materials route', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('redirects unauthenticated direct relationship entry before loading Materials', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { router } = renderMaterialsRoute('/app/materials?materialId=M-0001')

    expect(
      await screen.findByRole('heading', {
        name: /sign in to guardiola foundry/i,
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('renders the persisted lean Materials table with one row per Material', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)

      if (url.endsWith('/auth/me')) {
        return jsonResponse({
          tokenType: 'Bearer',
          expiresAt: '2026-07-28T18:33:00.000Z',
          user: {
            id: 1,
            email: 'operator@example.com',
            role: 'operator',
            active: true,
          },
        })
      }

      if (url.endsWith('/materials') && init?.method === 'GET') {
        return jsonResponse({
          materials: [
            {
              id: 'M-0001',
              name: 'Ivory Silk Crepe',
              materialColor: 'ivory',
              materialUse: 'base-fabric',
              materialUnit: 'meter',
              preferredSource: {
                id: 'S-0001',
                name: 'Silk Crepe 40mm',
                provider: 'Maison Textile',
                normalizedUnitCostCents: 4200,
                normalizedUnit: 'meter',
                needsAttention: false,
              },
              derivedUnitCostCents: 4200,
              alternateSourceCount: 1,
              comments:
                'Primary bridal base fabric with a long spreadsheet migration note that should stay compact in the row.',
            },
            {
              id: 'M-0002',
              name: 'Champagne Horsehair',
              materialColor: 'champagne',
              materialUse: 'structure',
              materialUnit: 'meter',
              preferredSource: {
                id: 'S-0003',
                name: 'Horsehair Braid',
                provider: 'Atelier Supply',
                normalizedUnitCostCents: 875,
                normalizedUnit: 'meter',
                needsAttention: false,
              },
              derivedUnitCostCents: 875,
              alternateSourceCount: 0,
              comments: null,
            },
          ],
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()

    renderMaterialsRoute()

    expect(await screen.findByRole('heading', { name: 'Materials' })).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3333/materials',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer opaque-access-token',
          }),
        })
      )
    })

    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(within(table).getByRole('columnheader', { name: 'Material ID' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Material Color' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Material Use' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Material Unit' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Preferred Source' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Derived Cost' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Alt. Sources' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Comments' })).toBeInTheDocument()

    const ivoryRow = within(table).getByRole('row', {
      name: /M-0001 Ivory Silk Crepe Ivory Base Fabric Meter Silk Crepe 40mm Maison Textile \$42\.00 \/ meter 1 Primary bridal base fabric/,
    })
    expect(within(ivoryRow).getByText('Silk Crepe 40mm')).toBeInTheDocument()
    expect(within(ivoryRow).getByText('Maison Textile')).toBeInTheDocument()

    expect(within(table).getByText('Champagne Horsehair')).toBeInTheDocument()
    expect(within(table).getByText('No comments')).toBeInTheDocument()
    expect(screen.queryByText('S-0001')).not.toBeInTheDocument()
  })

  it('omits Source technical fields and out-of-scope table controls', async () => {
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

      if (url.endsWith('/materials') && init?.method === 'GET') {
        return jsonResponse({
          materials: [
            {
              id: 'M-0003',
              name: 'White Chantilly Lace',
              materialColor: 'white',
              materialUse: 'lace',
              materialUnit: 'meter',
              preferredSource: {
                id: 'S-0004',
                name: 'Chantilly Lace',
                provider: 'Lace House',
                normalizedUnitCostCents: 3100,
                normalizedUnit: 'meter',
                needsAttention: false,
              },
              derivedUnitCostCents: 3100,
              alternateSourceCount: 0,
              comments: 'Keep row height compact.',
            },
          ],
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()

    renderMaterialsRoute()

    expect(await screen.findByText('White Chantilly Lace')).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /gsm/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /width/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /fiber/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /composition/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /finish/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /weave/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: /country of origin/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /create|edit|delete|restore|filter|search|bulk/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /pagination/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/summary|dashboard|chart/i)).not.toBeInTheDocument()
  })

  it('renders loading, empty, and error states from the route user perspective', async () => {
    let resolveMaterialsRequest!: (value: Response) => void
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

      if (url.endsWith('/materials') && init?.method === 'GET') {
        return await new Promise<Response>((resolve) => {
          resolveMaterialsRequest = resolve
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()

    renderMaterialsRoute()

    expect(await screen.findByText('Loading materials...')).toBeInTheDocument()

    resolveMaterialsRequest(jsonResponse({ materials: [] }))

    expect(await screen.findByText('No active materials found.')).toBeInTheDocument()

    cleanup()

    vi.restoreAllMocks()
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

      if (url.endsWith('/materials') && init?.method === 'GET') {
        return jsonResponse({ message: 'Materials service unavailable.' }, { status: 503 })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    renderMaterialsRoute()

    expect(await screen.findByRole('alert')).toHaveTextContent('Materials service unavailable.')
  })

  it('keeps a Material visible when its Preferred Source needs attention', async () => {
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

      if (url.endsWith('/materials') && init?.method === 'GET') {
        return jsonResponse({
          materials: [
            {
              id: 'M-0002',
              name: 'Champagne Horsehair',
              materialColor: 'champagne',
              materialUse: 'structure',
              materialUnit: 'meter',
              preferredSource: {
                id: 'S-0003',
                name: 'Horsehair Braid',
                provider: 'Atelier Supply',
                normalizedUnitCostCents: 875,
                normalizedUnit: 'meter',
                needsAttention: true,
              },
              derivedUnitCostCents: 875,
              alternateSourceCount: 0,
              comments: null,
            },
          ],
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

    seedStoredSession()

    renderMaterialsRoute()

    const attentionRow = (await screen.findByText('Source needs attention')).closest('tr')

    expect(attentionRow).not.toBeNull()
    expect(within(attentionRow!).getByText('Champagne Horsehair')).toBeInTheDocument()
    expect(
      within(attentionRow!).queryByRole('button', { name: /delete|restore|edit|change/i })
    ).not.toBeInTheDocument()
  })

  it('opens a read-only relationship Dialog and preserves it in route state', async () => {
    const user = userEvent.setup()
    mockAuthenticatedMaterialsJourney()
    seedStoredSession()

    const { router } = renderMaterialsRoute()

    const preferredSourceLink = await screen.findByRole('link', {
      name: 'Italian Silk Crepe',
    })
    expect(preferredSourceLink).toHaveAttribute('href', '/app/sources/S-0001')
    expect(preferredSourceLink.querySelector('.lucide-arrow-right')).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Open Ivory Silk Crepe' }),
    )

    const dialog = await screen.findByRole('dialog', {
      name: 'Ivory Silk Crepe',
    })
    expect(router.state.location.search).toEqual({ materialId: 'M-0001' })
    expect(within(dialog).getByText('M-0001')).toBeInTheDocument()
    expect(within(dialog).getByText('Ivory')).toBeInTheDocument()
    expect(within(dialog).getByText('Base Fabric')).toBeInTheDocument()
    expect(
      within(dialog).getByRole('region', { name: 'Preferred Source' }),
    ).toHaveTextContent('Italian Silk Crepe')
    expect(
      within(dialog).getByRole('region', { name: 'Active alternates' }),
    ).toHaveTextContent('Ivory Crepe Backup')
    expect(
      within(dialog).getByRole('region', { name: 'Historical relationships' }),
    ).toHaveTextContent('Retired Crepe')
    expect(
      within(dialog).getAllByRole('link', { name: /open source/i }),
    ).toHaveLength(3)
    const dialogSourceLink = within(dialog).getByRole('link', {
      name: 'Open Source Italian Silk Crepe',
    })
    expect(dialogSourceLink).toHaveAttribute('href', '/app/sources/S-0001')
    expect(dialogSourceLink.querySelector('.lucide-arrow-right')).toBeInTheDocument()
    expect(
      within(dialog).queryByRole('button', {
        name: /create|edit|retire|restore|link|unlink/i,
      }),
    ).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Close' }))

    await waitFor(() => expect(router.state.location.search).toEqual({}))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('reopens the Material Dialog on direct entry and retains the list for failure states', async () => {
    let detailState: 'loading' | 'missing' = 'loading'
    let resolveDetail!: (response: Response) => void
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse()
      if (url.endsWith('/materials') && init?.method === 'GET') {
        return jsonResponse(materialsListResponse())
      }
      if (url.endsWith('/materials/M-9999') && init?.method === 'GET') {
        if (detailState === 'loading') {
          detailState = 'missing'
          return await new Promise<Response>((resolve) => {
            resolveDetail = resolve
          })
        }
        return jsonResponse({ message: 'Material not found.' }, { status: 404 })
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession()

    renderMaterialsRoute('/app/materials?materialId=M-9999')

    expect(
      await screen.findByText('Loading Material relationships...'),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('table', { hidden: true }),
    ).toBeInTheDocument()

    resolveDetail(
      jsonResponse({ message: 'Material not found.' }, { status: 404 }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Material not found.',
    )
    expect(screen.getByRole('table', { hidden: true })).toBeInTheDocument()
  })

  it.each([
    [403, 'You do not have permission to inspect this Material.'],
    [503, 'Material relationship service unavailable.'],
  ])(
    'explains a %s relationship-detail failure while retaining the Materials view',
    async (status, message) => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const url = String(input)
        if (url.endsWith('/auth/me')) return sessionResponse()
        if (url.endsWith('/materials') && init?.method === 'GET') {
          return jsonResponse(materialsListResponse())
        }
        if (url.endsWith('/materials/M-0001') && init?.method === 'GET') {
          return jsonResponse({ message }, { status })
        }
        throw new Error(`Unexpected request: ${url}`)
      })
      seedStoredSession()

      renderMaterialsRoute('/app/materials?materialId=M-0001')

      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(screen.getByRole('table', { hidden: true })).toBeInTheDocument()
    },
  )
})

function renderMaterialsRoute(initialEntry = '/app/materials') {
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

function mockAuthenticatedMaterialsJourney() {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse()
      if (url.endsWith('/materials') && init?.method === 'GET') {
        return jsonResponse(materialsListResponse())
      }
      if (url.endsWith('/materials/M-0001') && init?.method === 'GET') {
        return jsonResponse(materialDetailResponse())
      }
      throw new Error(`Unexpected request: ${url}`)
    })
}

function materialsListResponse() {
  return {
    materials: [
      {
        id: 'M-0001',
        name: 'Ivory Silk Crepe',
        materialColor: 'ivory',
        materialUse: 'base-fabric',
        materialUnit: 'meter',
        preferredSource: {
          id: 'S-0001',
          name: 'Italian Silk Crepe',
          provider: 'Casa Tessile',
          normalizedUnitCostCents: 4200,
          normalizedUnit: 'meter',
          needsAttention: false,
        },
        derivedUnitCostCents: 4200,
        alternateSourceCount: 2,
        comments: 'Primary dress fabric.',
      },
    ],
  }
}

function materialDetailResponse() {
  return {
    material: {
      id: 'M-0001',
      name: 'Ivory Silk Crepe',
      materialColor: 'ivory',
      materialUse: 'base-fabric',
      materialUnit: 'meter',
      comments: 'Primary dress fabric.',
      sourceRelationships: [
        {
          id: 'S-0001',
          name: 'Italian Silk Crepe',
          vendor: 'Casa Tessile',
          relationship: 'preferred',
          relationshipStatus: 'active',
          vendorShade: { id: 1, nameOrCode: 'Ivory 100' },
        },
        {
          id: 'S-0002',
          name: 'Ivory Crepe Backup',
          vendor: 'Milan Textiles',
          relationship: 'alternate',
          relationshipStatus: 'active',
          vendorShade: null,
        },
        {
          id: 'S-0003',
          name: 'Retired Crepe',
          vendor: 'Archive Textiles',
          relationship: 'alternate',
          relationshipStatus: 'historical',
          vendorShade: null,
        },
      ],
    },
  }
}

function sessionResponse() {
  return jsonResponse({
    tokenType: 'Bearer',
    expiresAt: '2026-07-28T18:33:00.000Z',
    user: { id: 1, email: 'admin@example.com', role: 'admin', active: true },
  })
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
