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

describe('sources route', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('opens a Source row through its stable app-owned Source ID route', async () => {
    mockAuthenticatedSources({ sources: [sourceSummary()] })
    seedStoredSession('operator')

    renderSourcesRoute('/app/sources')

    expect(
      await screen.findByRole(
        'link',
        {
          name: 'S-0001 Ivory Silk Crepe',
        },
        { timeout: 5_000 },
      ),
    ).toHaveAttribute('href', '/app/sources/S-0001')
  })

  it('renders sibling navigation and the complete operational Source table', async () => {
    const fetchSpy = mockAuthenticatedSources({
      sources: Array.from({ length: 156 }, (_, index) =>
        sourceSummary(`S-${String(index + 1).padStart(4, '0')}`),
      ),
    })
    seedStoredSession('admin')

    renderSourcesRoute('/app/sources')

    expect(
      await screen.findByRole('heading', { name: 'Sources' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Source' })).toHaveAttribute(
      'href',
      '/app/sources/new',
    )
    const areaNavigation = screen.getByRole('navigation', {
      name: 'Materials area views',
    })
    expect(
      within(areaNavigation).getByRole('link', { name: 'Materials' }),
    ).toHaveAttribute('href', '/app/materials')
    expect(
      within(areaNavigation).getByRole('link', { name: 'Sources' }),
    ).toHaveAttribute('aria-current', 'page')

    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(157)
    expect(table.parentElement).toHaveClass('overflow-x-auto')
    for (const column of [
      'Source ID',
      'Source Name',
      'Vendor',
      'Textile Family',
      'Presentation / Unit',
      'Vendor Price',
      'Landed Unit Cost',
      'Linked Materials',
      'Attention',
    ]) {
      expect(
        within(table).getByRole('columnheader', { name: column }),
      ).toBeInTheDocument()
    }
    expect(within(table).getAllByText('Cost needs attention')).toHaveLength(156)
    expect(within(table).getAllByText('Data needs attention')).toHaveLength(156)
    expect(table).toHaveTextContent('USD 18.00')
    expect(
      screen.queryByRole('columnheader', {
        name: /gsm|width|composition|finish/i,
      }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: /pagination/i }),
    ).not.toBeInTheDocument()

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3333/sources',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer opaque-access-token',
          }),
        }),
      )
    })
  })

  it('displays the configured global rate, reciprocal, and Effective Date as read-only context', async () => {
    mockAuthenticatedSources(
      { sources: [sourceSummary()] },
      {
        state: 'configured',
        usdToMxnRate: 17.125,
        mxnToUsdRate: 1 / 17.125,
        effectiveDate: '2026-08-31',
      },
    )
    seedStoredSession('operator')

    renderSourcesRoute('/app/sources')

    const rateContext = await screen.findByRole('region', {
      name: 'Currency Conversion Rate',
    })
    await waitFor(() => {
      expect(rateContext).toHaveTextContent('USD:MXN17.125')
      expect(rateContext).toHaveTextContent('MXN:USD0.058394')
      expect(rateContext).toHaveTextContent('Effective DateAug 31, 2026')
    })
    expect(rateContext).toHaveTextContent(
      'Informational only · no Source price or Landed Unit Cost conversion.',
    )
    expect(
      screen.getByRole('navigation', { name: 'Materials area views' })
        .nextElementSibling,
    ).toBe(rateContext)
    expect(within(rateContext).queryByRole('button')).not.toBeInTheDocument()
    expect(within(rateContext).queryByRole('link')).not.toBeInTheDocument()
  })

  it.each([
    ['missing', 'Not configured. Source catalog work is still available.'],
    [
      'invalid',
      'Invalid configuration. Source catalog work is still available.',
    ],
  ])(
    'keeps the Source catalog available when rate configuration is %s',
    async (state, message) => {
      mockAuthenticatedSources({ sources: [sourceSummary()] }, { state })
      seedStoredSession('admin')

      renderSourcesRoute('/app/sources')

      expect(await screen.findByText(message)).toBeInTheDocument()
      expect(await screen.findByRole('table')).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: 'Create Source' }),
      ).toHaveAttribute('href', '/app/sources/new')
    },
  )

  it('hydrates filters from the URL and keeps changes synchronized with it', async () => {
    const user = userEvent.setup()
    const fetchSpy = mockAuthenticatedSources({ sources: [sourceSummary()] })
    seedStoredSession('admin')
    const { router } = renderSourcesRoute(
      '/app/sources?search=silk&textileFamily=Crepe&includeRetired=true&linkState=linked&attentionState=data-needs-attention',
    )

    expect(
      await screen.findByRole('heading', { name: 'Sources' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('searchbox', { name: 'Search Sources' }),
    ).toHaveValue('silk')
    expect(
      screen.getByRole('button', { name: 'Include retired' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Textile family: Crepe' }),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3333/sources?search=silk&textileFamily=Crepe&includeRetired=true&linkState=linked&attentionState=data-needs-attention',
        expect.any(Object),
      )
    })

    await user.type(
      screen.getByRole('searchbox', { name: 'Search Sources' }),
      ' organza',
    )

    await waitFor(() => {
      expect(router.state.location.search.search).toBe('silk organza')
    })

    await user.click(
      screen.getByRole('button', { name: 'Textile family: Crepe' }),
    )
    await user.click(screen.getByRole('button', { name: 'Organza' }))
    await user.click(screen.getByRole('button', { name: 'Close filters' }))
    await user.click(
      screen.getByRole('button', { name: 'Remove Include retired filter' }),
    )

    await waitFor(() => {
      expect(router.state.location.search).toEqual({
        search: 'silk organza',
        textileFamily: 'Organza',
        linkState: 'linked',
        attentionState: 'data-needs-attention',
      })
    })
  })

  it('hides Retired controls from Operators and explains empty and permission states', async () => {
    let sourceResponse = jsonResponse({ sources: [] })
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse('operator')
      if (url.endsWith('/currency-conversion-rate'))
        return jsonResponse({ state: 'missing' })
      if (url.includes('/sources') && init?.method === 'GET')
        return sourceResponse
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession('operator')

    renderSourcesRoute('/app/sources')

    expect(
      await screen.findByText('No Sources match this view.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('combobox', { name: 'Source Status' }),
    ).not.toBeInTheDocument()

    cleanup()
    sourceResponse = jsonResponse(
      {
        message:
          'You do not have permission to view this Source catalog selection.',
      },
      { status: 403 },
    )
    renderSourcesRoute('/app/sources?status=retired')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You do not have permission to view this Source catalog selection.',
    )
  })

  it.each([
    ['status=active', {}],
    ['status=retired', { includeRetired: true }],
    ['includeRetired=false&textileFamily=invalid&unsupported=value', {}],
  ])(
    'canonicalizes %s by replacing the existing history entry',
    async (query, expected) => {
      mockAuthenticatedSources({ sources: [sourceSummary()] })
      seedStoredSession('admin')
      const { router } = renderSourcesRoute(`/app/sources?${query}`)
      await screen.findByRole('table')
      await waitFor(() =>
        expect(router.state.location.search).toEqual(expected),
      )
      expect(router.history.length).toBe(1)
      expect(router.state.location.search).not.toHaveProperty('status')
    },
  )

  it.each(['includeRetired=true', 'status=retired'])(
    'sanitizes Operator %s before the first Source request',
    async (query) => {
      const fetchSpy = mockAuthenticatedSources(
        { sources: [] },
        { state: 'missing' },
        'operator',
      )
      seedStoredSession('operator')
      const { router } = renderSourcesRoute(`/app/sources?${query}`)
      await screen.findByText('No Sources match this view.')
      await waitFor(() => expect(router.state.location.search).toEqual({}))
      const requests = fetchSpy.mock.calls
        .map(([input]) => String(input))
        .filter((url) => url.includes('/sources'))
      expect(requests).toEqual(['http://localhost:3333/sources'])
      await userEvent
        .setup()
        .click(screen.getByRole('button', { name: 'Filter' }))
      expect(
        screen.queryByRole('button', { name: 'Include retired' }),
      ).not.toBeInTheDocument()
      expect(router.history.length).toBe(1)
    },
  )

  it.each(['', '?includeRetired=true&search=silk&linkState=linked'])(
    'recovers from a table 403 at %s by clearing and retrying safe defaults',
    async (query) => {
      let denied = true
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = String(input)
        if (url.endsWith('/auth/me')) return sessionResponse('admin')
        if (url.endsWith('/currency-conversion-rate'))
          return jsonResponse({ state: 'missing' })
        if (url.includes('/sources'))
          return denied
            ? jsonResponse({ message: 'Forbidden' }, { status: 403 })
            : jsonResponse({ sources: [sourceSummary()] })
        throw new Error(`Unexpected request: ${url}`)
      })
      seedStoredSession('admin')
      const { router } = renderSourcesRoute(`/app/sources${query}`)
      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('You do not have permission')
      denied = false
      await userEvent
        .setup()
        .click(within(alert).getByRole('button', { name: 'Clear all' }))
      await screen.findByRole('table')
      expect(router.state.location.search).toEqual({})
      expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull()
    },
  )

  it('marks only Retired Source names and restores criteria through back and forward history', async () => {
    const user = userEvent.setup()
    mockAuthenticatedSources({
      sources: [
        sourceSummary(),
        {
          ...sourceSummary('S-0002'),
          name: 'Retired Crepe',
          sourceStatus: 'retired',
        },
      ],
    })
    seedStoredSession('admin')
    const { router } = renderSourcesRoute('/app/sources?includeRetired=true')
    const table = await screen.findByRole('table')
    expect(within(table).getAllByText('Retired')).toHaveLength(1)
    expect(within(table).getByText('Retired').parentElement).toHaveTextContent(
      'Retired Crepe',
    )
    expect(within(table).queryByText('Active')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: /Textile family/ }))
    await user.click(screen.getByRole('button', { name: 'Crepe' }))
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        includeRetired: true,
        textileFamily: 'Crepe',
      }),
    )
    expect(router.history.length).toBe(2)
    await act(async () => router.history.back())
    await waitFor(() =>
      expect(router.state.location.search).toEqual({ includeRetired: true }),
    )
    await act(async () => router.history.forward())
    await waitFor(() =>
      expect(router.state.location.search).toEqual({
        includeRetired: true,
        textileFamily: 'Crepe',
      }),
    )
  })

  it('debounces remote search and retains rows with an accessible updating status', async () => {
    let resolveSearch!: (response: Response) => void
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input) => {
        const url = String(input)
        if (url.endsWith('/auth/me')) return sessionResponse('admin')
        if (url.endsWith('/currency-conversion-rate'))
          return jsonResponse({ state: 'missing' })
        if (url.endsWith('/sources'))
          return jsonResponse({ sources: [sourceSummary()] })
        if (url.includes('/sources?search=silk'))
          return new Promise<Response>((resolve) => {
            resolveSearch = resolve
          })
        throw new Error(`Unexpected request: ${url}`)
      })
    seedStoredSession('admin')
    const { router } = renderSourcesRoute('/app/sources')
    await screen.findByRole('table')
    await userEvent
      .setup()
      .type(screen.getByRole('searchbox', { name: 'Search Sources' }), 'silk')
    expect(
      screen.getByRole('searchbox', { name: 'Search Sources' }),
    ).toHaveValue('silk')
    expect(router.state.location.search).toEqual({})
    expect(
      fetchSpy.mock.calls
        .map(([input]) => String(input))
        .filter((url) => url.includes('/sources?')),
    ).toEqual([])
    expect(screen.getByRole('status')).toHaveTextContent('Updating Sources')
    await waitFor(() => expect(resolveSearch).toBeDefined())
    expect(screen.getByRole('table')).toHaveTextContent('Ivory Silk Crepe')
    resolveSearch(jsonResponse({ sources: [] }))
    await screen.findByText('No Sources match this view.')
    expect(router.state.location.search).toEqual({ search: 'silk' })
    expect(router.history.length).toBe(1)
  })

  it('retries safe defaults after 403 even when the default list cache is fresh', async () => {
    const requests: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse('admin')
      if (url.endsWith('/currency-conversion-rate'))
        return jsonResponse({ state: 'missing' })
      if (url.includes('/sources')) {
        requests.push(url)
        return url.includes('includeRetired')
          ? jsonResponse({ message: 'Forbidden' }, { status: 403 })
          : jsonResponse({ sources: [sourceSummary()] })
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession('admin')
    renderSourcesRoute('/app/sources', 30_000)
    await screen.findByRole('table')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: /Include retired/ }))
    await user.click(screen.getByRole('button', { name: 'Close filters' }))
    const alert = await screen.findByRole('alert')
    await user.click(within(alert).getByRole('button', { name: 'Clear all' }))
    await screen.findByRole('table')
    await waitFor(() =>
      expect(requests).toEqual([
        'http://localhost:3333/sources',
        'http://localhost:3333/sources?includeRetired=true',
        'http://localhost:3333/sources',
      ]),
    )
  })

  it('explains loading and service error states', async () => {
    let resolveSourcesRequest!: (response: Response) => void
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse('admin')
      if (url.endsWith('/currency-conversion-rate'))
        return jsonResponse({ state: 'missing' })
      if (url.includes('/sources') && init?.method === 'GET') {
        return await new Promise<Response>((resolve) => {
          resolveSourcesRequest = resolve
        })
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession('admin')

    renderSourcesRoute('/app/sources')

    expect(await screen.findByText('Loading Sources...')).toBeInTheDocument()

    resolveSourcesRequest(
      jsonResponse({ message: 'Source catalog unavailable.' }, { status: 503 }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Source catalog unavailable.',
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Refresh the page to try again.',
    )
  })
})

function renderSourcesRoute(initialEntry: string, staleTime = 0) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime } },
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

function mockAuthenticatedSources(
  body: unknown,
  currencyRate: unknown = { state: 'missing' },
  role: 'admin' | 'operator' = 'admin',
) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse(role)
      if (url.endsWith('/currency-conversion-rate'))
        return jsonResponse(currencyRate)
      if (url.includes('/sources') && init?.method === 'GET')
        return jsonResponse(body)
      throw new Error(`Unexpected request: ${url}`)
    })
}

function sourceSummary(id = 'S-0001') {
  return {
    id,
    sourceStatus: 'active',
    name: 'Ivory Silk Crepe',
    vendor: 'Maison Textile',
    textileFamily: 'Crepe',
    purchasePresentation: 'roll',
    purchaseUnit: 'meter',
    vendorCurrency: 'USD',
    purchasePriceCents: 1800,
    landedUnitCostCents: null,
    linkedMaterialCount: 1,
    costNeedsAttention: true,
    dataNeedsAttention: true,
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
