import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AUTH_SESSION_STORAGE_KEY } from '@/lib/auth/session-storage'
import { routeTree } from '../routeTree.gen'

describe('Pattern Set catalog route', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('lets an Operator browse, create, edit, and retire Pattern Sets with proposals', async () => {
    const user = userEvent.setup()
    let patternSets = [patternSetFixture()]
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        const url = new URL(String(input))
        if (url.pathname === '/auth/me')
          return jsonResponse(sessionFixture('operator'))
        if (url.pathname === '/pattern-sets' && init?.method === 'GET') {
          return jsonResponse({ patternSets })
        }
        if (url.pathname === '/pattern-sets/PS-BASE01/usage') {
          return jsonResponse({
            billOfMaterialsLineCount: 0,
            billOfMaterialsCount: 0,
          })
        }
        if (url.pathname === '/pattern-sets' && init?.method === 'POST') {
          const created = patternSetFixture({
            id: 'PS-NEW001',
            name: 'Cape patterns',
            description: 'Mock-up evidence',
            quantityProposals: [
              {
                assumedWidthCm: 150,
                quantityMeters: 2.375,
                evidenceNote: 'First toile',
              },
            ],
          })
          patternSets = [...patternSets, created]
          return jsonResponse(created, { status: 201 })
        }
        if (
          url.pathname === '/pattern-sets/PS-BASE01' &&
          init?.method === 'PUT'
        ) {
          const updated = patternSetFixture({ name: 'Skirt patterns revised' })
          patternSets = patternSets.map((patternSet) =>
            patternSet.id === updated.id ? updated : patternSet,
          )
          return jsonResponse(updated)
        }
        if (
          url.pathname === '/pattern-sets/PS-BASE01' &&
          init?.method === 'DELETE'
        ) {
          patternSets = patternSets.filter(
            (patternSet) => patternSet.id !== 'PS-BASE01',
          )
          return new Response(null, { status: 204 })
        }
        throw new Error(`Unexpected request: ${url.pathname}`)
      })

    seedStoredSession('operator')
    renderPatternSetsRoute()

    expect(
      await screen.findByRole('heading', { name: 'Pattern Sets' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Skirt patterns')).toBeInTheDocument()
    expect(
      screen.getByText('140 cm → 3.25 m — Marker study'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create Pattern Set' }))
    await user.type(screen.getByLabelText('Pattern Set name'), 'Cape patterns')
    await user.type(screen.getByLabelText('Description'), 'Mock-up evidence')
    await user.click(screen.getByRole('button', { name: 'Add proposal' }))
    await user.clear(screen.getByLabelText('Assumed width (cm)'))
    await user.type(screen.getByLabelText('Assumed width (cm)'), '150')
    await user.clear(screen.getByLabelText('Quantity (m)'))
    await user.type(screen.getByLabelText('Quantity (m)'), '2.375')
    await user.type(screen.getByLabelText('Evidence note'), 'First toile')
    await user.click(screen.getByRole('button', { name: 'Save Pattern Set' }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3333/pattern-sets',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Cape patterns',
            description: 'Mock-up evidence',
            quantityProposals: [
              {
                assumedWidthCm: 150,
                quantityMeters: 2.375,
                evidenceNote: 'First toile',
              },
            ],
          }),
        }),
      )
    })
    expect(await screen.findByText('Cape patterns')).toBeInTheDocument()

    const originalRow = screen
      .getByText('Skirt patterns')
      .closest('tr') as HTMLTableRowElement
    await user.click(within(originalRow).getByRole('button', { name: 'Edit' }))
    const nameInput = screen.getByLabelText('Pattern Set name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Skirt patterns revised')
    await user.click(screen.getByRole('button', { name: 'Save Pattern Set' }))
    expect(
      await screen.findByText('Skirt patterns revised'),
    ).toBeInTheDocument()

    const revisedRow = screen
      .getByText('Skirt patterns revised')
      .closest('tr') as HTMLTableRowElement
    await user.click(within(revisedRow).getByRole('button', { name: 'Retire' }))
    expect(
      screen.getByText(
        'Retire Skirt patterns revised? Its identity, description, and proposals will be preserved.',
      ),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retire Pattern Set' }))
    await waitFor(() =>
      expect(
        screen.queryByText('Skirt patterns revised'),
      ).not.toBeInTheDocument(),
    )
  })

  it('hydrates the Admin filter, mixes Active and Retired records, and preserves filter history', async () => {
    const user = userEvent.setup()
    const active = patternSetFixture({ id: 'PS-BASE02' })
    const retired = patternSetFixture({
      status: 'retired',
      name: 'Archived pattern',
    })
    let restored = false
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me')
        return jsonResponse(sessionFixture('admin'))
      if (url.pathname === '/pattern-sets' && init?.method === 'GET') {
        return jsonResponse({
          patternSets: [
            active,
            ...(restored
              ? [{ ...retired, status: 'active' }]
              : url.searchParams.get('includeRetired') === 'true'
                ? [retired]
                : []),
          ],
        })
      }
      if (
        url.pathname === '/pattern-sets/PS-BASE01/restore' &&
        init?.method === 'POST'
      ) {
        restored = true
        return jsonResponse({ ...retired, status: 'active' })
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession('admin')
    const router = renderPatternSetsRoute(
      '/app/pattern-sets?includeRetired=true',
    )

    await screen.findByRole('button', { name: 'Remove Include retired filter' })
    const activeRow = (await screen.findByText('Skirt patterns')).closest(
      'tr',
    ) as HTMLTableRowElement
    expect(within(activeRow).getByText('Active')).toBeInTheDocument()
    expect(within(activeRow).queryByText('Retired')).not.toBeInTheDocument()
    const retiredRow = (await screen.findByText('Archived pattern')).closest(
      'tr',
    ) as HTMLTableRowElement
    expect(within(retiredRow).getByText('Retired')).toBeInTheDocument()
    expect(
      within(retiredRow).queryByRole('button', { name: 'Edit' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    await waitFor(() => expect(router.state.location.search).toEqual({}))
    await waitFor(() =>
      expect(screen.queryByText('Archived pattern')).not.toBeInTheDocument(),
    )
    await act(() => router.history.back())
    expect(await screen.findByText('Archived pattern')).toBeInTheDocument()
    expect(router.state.location.search).toEqual({ includeRetired: true })
    await act(() => router.history.forward())
    await waitFor(() => expect(router.state.location.search).toEqual({}))

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: /Include retired/ }))
    await user.click(screen.getByRole('button', { name: 'Close filters' }))
    expect(await screen.findByText('Archived pattern')).toBeInTheDocument()
    expect(router.state.location.search).toEqual({ includeRetired: true })
    await user.click(screen.getByRole('button', { name: 'Restore' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Restore' }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByText('Archived pattern')).toBeInTheDocument()
  })

  it.each([
    ['admin', 'includeRetired=false&unsupported=value'],
    ['admin', 'includeRetired=invalid'],
    ['operator', 'includeRetired=true'],
  ] as const)(
    'replaces non-canonical %s links (%s) and queries only the default list',
    async (role, search) => {
      const requests: string[] = []
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = new URL(String(input))
        if (url.pathname === '/auth/me')
          return jsonResponse(sessionFixture(role))
        if (url.pathname === '/pattern-sets') {
          requests.push(url.search)
          return jsonResponse({ patternSets: [patternSetFixture()] })
        }
        throw new Error(`Unexpected request: ${url.pathname}`)
      })

      seedStoredSession(role)
      const router = renderPatternSetsRoute(`/app/pattern-sets?${search}`)
      await screen.findByRole('table')
      await waitFor(() => expect(router.state.location.searchStr).toBe(''))
      expect(router.history.length).toBe(1)
      expect(requests).toEqual([''])
      if (role === 'operator') {
        expect(
          screen.queryByRole('button', { name: 'Filter' }),
        ).not.toBeInTheDocument()
      }
    },
  )

  it.each(['', '?includeRetired=true'])(
    'recovers from a table 403 at %s with a safe query and keeps the session',
    async (search) => {
      const catalogRequests: string[] = []
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = new URL(String(input))
        if (url.pathname === '/auth/me')
          return jsonResponse(sessionFixture('admin'))
        if (url.pathname === '/pattern-sets') {
          catalogRequests.push(url.search)
          return catalogRequests.length === 1
            ? jsonResponse({ message: 'Forbidden' }, { status: 403 })
            : jsonResponse({ patternSets: [patternSetFixture()] })
        }
        throw new Error(`Unexpected request: ${url.pathname}`)
      })

      seedStoredSession('admin')
      const router = renderPatternSetsRoute(`/app/pattern-sets${search}`)
      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('You do not have permission')
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
      await userEvent
        .setup()
        .click(within(alert).getByRole('button', { name: 'Clear all' }))
      expect(await screen.findByText('Skirt patterns')).toBeInTheDocument()
      expect(router.state.location.search).toEqual({})
      expect(catalogRequests).toEqual([search, ''])
      expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull()
    },
  )

  it('keeps loaded rows visible when refreshing after a successful save fails', async () => {
    const user = userEvent.setup()
    let saved = false
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me')
        return jsonResponse(sessionFixture('operator'))
      if (url.pathname === '/pattern-sets' && init?.method === 'GET') {
        return saved
          ? jsonResponse({ message: 'Catalog unavailable' }, { status: 500 })
          : jsonResponse({ patternSets: [patternSetFixture()] })
      }
      if (url.pathname === '/pattern-sets' && init?.method === 'POST') {
        saved = true
        return jsonResponse(
          patternSetFixture({ id: 'PS-NEW001', name: 'Cape patterns' }),
          { status: 201 },
        )
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession('operator')
    renderPatternSetsRoute()
    await screen.findByText('Skirt patterns')
    await user.click(screen.getByRole('button', { name: 'Create Pattern Set' }))
    await user.type(screen.getByLabelText('Pattern Set name'), 'Cape patterns')
    await user.click(screen.getByRole('button', { name: 'Save Pattern Set' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Catalog unavailable',
    )
    expect(screen.getByRole('table')).toHaveTextContent('Skirt patterns')
  })

  it('signs out after a catalog refresh returns 401 and reloads the catalog after sign-in', async () => {
    const user = userEvent.setup()
    let expired = false
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me')
        return jsonResponse(sessionFixture('admin'))
      if (url.pathname === '/auth/login') {
        return jsonResponse({
          ...sessionFixture('admin'),
          token: 'new-session-token',
        })
      }
      if (url.pathname === '/pattern-sets' && init?.method === 'GET') {
        if (
          new Headers(init.headers).get('Authorization') ===
          'Bearer new-session-token'
        ) {
          return jsonResponse({
            patternSets: [patternSetFixture({ name: 'Updated catalog' })],
          })
        }
        return expired
          ? jsonResponse({ message: 'Unauthorized' }, { status: 401 })
          : jsonResponse({ patternSets: [patternSetFixture()] })
      }
      if (url.pathname === '/pattern-sets' && init?.method === 'POST') {
        expired = true
        return jsonResponse(
          patternSetFixture({ id: 'PS-NEW001', name: 'Cape patterns' }),
          { status: 201 },
        )
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession('admin')
    const router = renderPatternSetsRoute()
    await screen.findByText('Skirt patterns')
    await user.click(screen.getByRole('button', { name: 'Create Pattern Set' }))
    await user.type(screen.getByLabelText('Pattern Set name'), 'Cape patterns')
    await user.click(screen.getByRole('button', { name: 'Save Pattern Set' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/sign-in'))
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull()

    await user.type(
      await screen.findByLabelText('Email Address'),
      'admin@example.com',
    )
    await user.type(screen.getByLabelText('Password'), 'Password123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await user.click(await screen.findByRole('link', { name: 'Pattern Sets' }))
    expect(await screen.findByText('Updated catalog')).toBeInTheDocument()
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toContain(
      'new-session-token',
    )
  })

  it('keeps duplicate-width proposal validation in the form without sending a request', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        const url = new URL(String(input))
        if (url.pathname === '/auth/me')
          return jsonResponse(sessionFixture('operator'))
        if (url.pathname === '/pattern-sets' && init?.method === 'GET')
          return jsonResponse({ patternSets: [] })
        throw new Error(`Unexpected request: ${url.pathname}`)
      })

    seedStoredSession('operator')
    renderPatternSetsRoute()
    await screen.findByText('No Pattern Sets registered yet.')
    await user.click(screen.getByRole('button', { name: 'Create Pattern Set' }))
    await user.type(
      screen.getByLabelText('Pattern Set name'),
      'Duplicate widths',
    )
    await user.click(screen.getByRole('button', { name: 'Add proposal' }))
    await user.click(screen.getByRole('button', { name: 'Add proposal' }))
    const widths = screen.getAllByLabelText('Assumed width (cm)')
    const quantities = screen.getAllByLabelText('Quantity (m)')
    for (let index = 0; index < 2; index += 1) {
      await user.clear(widths[index])
      await user.type(widths[index], '140')
      await user.clear(quantities[index])
      await user.type(quantities[index], `${index + 2}`)
    }
    await user.click(screen.getByRole('button', { name: 'Save Pattern Set' }))

    expect(
      await screen.findByText('Each assumed width may appear only once.'),
    ).toBeInTheDocument()
    expect(
      fetchSpy.mock.calls.filter(([, init]) => init?.method === 'POST'),
    ).toHaveLength(0)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('confirms the current BOM impact before editing or retiring a referenced Pattern Set', async () => {
    const user = userEvent.setup()
    const mutations: string[] = []
    let patternSets = [patternSetFixture()]
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me')
        return jsonResponse(sessionFixture('operator'))
      if (url.pathname === '/pattern-sets' && init?.method === 'GET') {
        return jsonResponse({ patternSets })
      }
      if (url.pathname === '/pattern-sets/PS-BASE01/usage') {
        return jsonResponse({
          billOfMaterialsLineCount: 3,
          billOfMaterialsCount: 2,
        })
      }
      if (
        url.pathname === '/pattern-sets/PS-BASE01' &&
        init?.method === 'PUT'
      ) {
        mutations.push('edit')
        const updated = patternSetFixture({ name: 'Revised patterns' })
        patternSets = [updated]
        return jsonResponse(updated)
      }
      if (
        url.pathname === '/pattern-sets/PS-BASE01' &&
        init?.method === 'DELETE'
      ) {
        mutations.push('retire')
        patternSets = []
        return new Response(null, { status: 204 })
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession('operator')
    renderPatternSetsRoute()
    const row = (await screen.findByText('Skirt patterns')).closest(
      'tr',
    ) as HTMLTableRowElement
    await user.click(within(row).getByRole('button', { name: 'Edit' }))
    const nameInput = screen.getByLabelText('Pattern Set name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Revised patterns')
    await user.click(screen.getByRole('button', { name: 'Save Pattern Set' }))

    expect(mutations).toEqual([])
    expect(
      await screen.findByText(
        'This change affects 3 BOM Lines across 2 Bills of Materials.',
      ),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirm edit' }))
    await waitFor(() => expect(mutations).toEqual(['edit']))

    const revisedRow = (await screen.findByText('Revised patterns')).closest(
      'tr',
    ) as HTMLTableRowElement
    await user.click(within(revisedRow).getByRole('button', { name: 'Retire' }))
    expect(
      await screen.findByText(
        'Retiring this Pattern Set affects 3 BOM Lines across 2 Bills of Materials.',
      ),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retire Pattern Set' }))
    await waitFor(() => expect(mutations).toEqual(['edit', 'retire']))
  })
})

function renderPatternSetsRoute(initialEntry = '/app/pattern-sets') {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}

function seedStoredSession(role: 'admin' | 'operator') {
  localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({
      token: 'opaque-access-token',
      tokenType: 'Bearer',
      expiresAt: '2027-09-08T18:33:00.000Z',
      user: sessionFixture(role).user,
    }),
  )
}

function sessionFixture(role: 'admin' | 'operator') {
  return {
    tokenType: 'Bearer' as const,
    expiresAt: '2027-09-08T18:33:00.000Z',
    user: { id: 1, email: `${role}@example.com`, role, active: true },
  }
}

function patternSetFixture(
  overrides: Partial<ReturnType<typeof basePatternSetFixture>> = {},
) {
  return { ...basePatternSetFixture(), ...overrides }
}

function basePatternSetFixture() {
  return {
    id: 'PS-BASE01',
    name: 'Skirt patterns',
    description: 'Floor-length configuration',
    status: 'active' as 'active' | 'retired',
    quantityProposals: [
      {
        assumedWidthCm: 140,
        quantityMeters: 3.25,
        evidenceNote: 'Marker study',
      },
    ],
    createdBy: { id: 1, email: 'operator@example.com' },
    createdAt: '2026-09-08T15:00:00.000Z',
  }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
