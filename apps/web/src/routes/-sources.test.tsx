import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import {
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
      await screen.findByRole('link', {
        name: 'S-0001 Ivory Silk Crepe',
      }, { timeout: 5_000 }),
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

  it('hydrates filters from the URL and keeps changes synchronized with it', async () => {
    const user = userEvent.setup()
    const fetchSpy = mockAuthenticatedSources({ sources: [sourceSummary()] })
    seedStoredSession('admin')
    const { router } = renderSourcesRoute(
      '/app/sources?search=silk&textileFamily=Crepe&status=retired&linkState=linked&attentionState=data-needs-attention',
    )

    expect(
      await screen.findByRole('heading', { name: 'Sources' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('searchbox', { name: 'Search Sources' }),
    ).toHaveValue('silk')
    expect(
      screen.getByRole('combobox', { name: 'Textile Family' }),
    ).toHaveTextContent('Crepe')
    expect(
      screen.getByRole('combobox', { name: 'Source Status' }),
    ).toHaveTextContent('Retired')
    expect(
      screen.getByRole('combobox', { name: 'Material Link' }),
    ).toHaveTextContent('Linked')
    expect(
      screen.getByRole('combobox', { name: 'Attention' }),
    ).toHaveTextContent('Data needs attention')
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3333/sources?search=silk&textileFamily=Crepe&status=retired&linkState=linked&attentionState=data-needs-attention',
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

    await selectFilter(user, 'Textile Family', 'Organza')
    await selectFilter(user, 'Source Status', 'Active')
    await selectFilter(user, 'Material Link', 'Unlinked')
    await selectFilter(user, 'Attention', 'Cost needs attention')

    await waitFor(() => {
      expect(router.state.location.search).toEqual({
        search: 'silk organza',
        textileFamily: 'Organza',
        status: 'active',
        linkState: 'unlinked',
        attentionState: 'cost-needs-attention',
      })
    })
  })

  it('hides Retired controls from Operators and explains empty and permission states', async () => {
    let sourceResponse = jsonResponse({ sources: [] })
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse('operator')
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
          'Only Admins can view Retired Sources. Remove the Status filter to view Active Sources.',
      },
      { status: 403 },
    )
    renderSourcesRoute('/app/sources?status=retired')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Only Admins can view Retired Sources. Remove the Status filter to view Active Sources.',
    )
  })

  it('explains loading and service error states', async () => {
    let resolveSourcesRequest!: (response: Response) => void
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse('admin')
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

function renderSourcesRoute(initialEntry: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
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

function mockAuthenticatedSources(body: unknown) {
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse('admin')
      if (url.includes('/sources') && init?.method === 'GET')
        return jsonResponse(body)
      throw new Error(`Unexpected request: ${url}`)
    })
}

function sourceSummary(id = 'S-0001') {
  return {
    id,
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

async function selectFilter(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
  const trigger = screen.getByRole('combobox', { name: label })

  await user.click(trigger)
  await user.click(await screen.findByRole('option', { name: option }))
  await waitFor(() => expect(trigger).toHaveTextContent(option))
}
