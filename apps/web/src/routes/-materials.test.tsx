import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AUTH_SESSION_STORAGE_KEY } from '@/lib/auth/session-storage'
import { routeTree } from '../routeTree.gen'

describe('materials route', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
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
                id: 'MS-0001',
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
                id: 'MS-0003',
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
    expect(screen.queryByText('MS-0001')).not.toBeInTheDocument()
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
                id: 'MS-0004',
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
                id: 'MS-0003',
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
})

function renderMaterialsRoute() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ['/app/materials'],
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
