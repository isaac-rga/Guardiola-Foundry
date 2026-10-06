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
import { afterEach, expect, it, vi } from 'vitest'
import { AUTH_SESSION_STORAGE_KEY } from '@/lib/auth/session-storage'
import { routeTree } from '../routeTree.gen'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

function openCatalog(initialEntry = '/app/products', role = 'admin') {
  const user = { id: 1, email: 'admin@example.com', role, active: true }
  const session = {
    token: 'opaque-access-token',
    tokenType: 'Bearer',
    expiresAt: '2026-12-01T18:33:00.000Z',
    user,
  }
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    if (url.endsWith('/auth/me')) return Response.json(session)
    if (url.includes('/products'))
      return Response.json({
        products: [],
        collections: [
          { id: 1, name: '2026' },
          { id: 2, name: '2027' },
        ],
      })
    throw new Error(`Unexpected request: ${url}`)
  })
  return renderProductsRoute(initialEntry).router
}

it('applies and edits a criterion immediately, keeps filters open, and restores it through browser history', async () => {
  const user = userEvent.setup()
  const router = openCatalog()
  await user.click(await screen.findByRole('button', { name: 'Filter' }))
  await user.click(
    await screen.findByRole('button', { name: /Product status.*Not set/ }),
  )
  await user.click(screen.getByRole('button', { name: 'Inactive' }))
  expect(
    await screen.findByRole('button', { name: 'Product status: Inactive' }),
  ).toBeVisible()
  expect(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: /Product status.*Inactive/,
    }),
  ).toBeVisible()
  expect(router.state.location.search).toMatchObject({
    productStatus: 'inactive',
  })
  await user.click(screen.getByRole('button', { name: 'Close filters' }))
  await user.click(
    screen.getByRole('button', { name: 'Product status: Inactive' }),
  )
  expect(screen.getByRole('button', { name: 'Inactive' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await user.click(screen.getByRole('button', { name: 'Active' }))
  await user.keyboard('{Escape}')
  expect(
    screen.queryByRole('button', { name: 'Close filters' }),
  ).not.toBeInTheDocument()
  await act(async () => router.history.back())
  expect(
    await screen.findByRole('button', { name: 'Product status: Inactive' }),
  ).toBeVisible()
  await act(async () => router.history.forward())
  expect(
    await screen.findByRole('button', { name: 'Product status: Active' }),
  ).toBeVisible()
})

it('searches loaded Collections locally, orders chips by definition, removes only one criterion, and clears while staying open', async () => {
  const user = userEvent.setup()
  const router = openCatalog('/app/products?search=gown&productStatus=active')
  await user.click(await screen.findByRole('button', { name: 'Filter' }))
  await user.click(
    await screen.findByRole('button', { name: /Collection.*Not set/ }),
  )
  await user.type(
    screen.getByRole('searchbox', { name: 'Search Collection options' }),
    '2027',
  )
  expect(screen.queryByRole('button', { name: '2026' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: '2027' }))
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: /Lifecycle status/,
    }),
  )
  await user.click(screen.getByRole('button', { name: 'Testing' }))
  expect(
    screen
      .getAllByRole('button')
      .filter((button) =>
        /^(Lifecycle status:|Product status:|Collection:)/.test(
          button.textContent ?? '',
        ),
      )
      .map((button) => button.textContent),
  ).toEqual([
    'Lifecycle status: Testing',
    'Product status: Active',
    'Collection: 2027',
  ])
  await user.click(screen.getByRole('button', { name: 'Close filters' }))
  await user.click(
    screen.getByRole('button', { name: 'Remove Product status filter' }),
  )
  await waitFor(() =>
    expect(router.state.location.search.productStatus).toBeUndefined(),
  )
  expect(router.state.location.search).toMatchObject({
    search: 'gown',
    lifecycleStatus: 'testing',
    collection: 2,
  })
  await user.click(screen.getByRole('button', { name: 'Filter' }))
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Clear all',
    }),
  )
  expect(screen.getByRole('dialog')).toBeVisible()
  await waitFor(() => expect(router.state.location.searchStr).toBe(''))
  expect(
    screen.getByRole('searchbox', { name: 'Search by product name' }),
  ).toHaveValue('')
  expect(
    screen.queryByRole('button', { name: 'Clear all' }),
  ).not.toBeInTheDocument()
})

it('offers Clear all for search alone and closes by outside interaction without changing filters', async () => {
  const user = userEvent.setup()
  const router = openCatalog('/app/products?search=gown')
  await user.click(await screen.findByRole('button', { name: 'Filter' }))
  expect(
    within(await screen.findByRole('dialog')).queryByRole('button', {
      name: 'Clear all',
    }),
  ).not.toBeInTheDocument()
  await user.click(screen.getByRole('heading', { name: 'Products' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(router.state.location.search.search).toBe('gown')
  expect(
    screen.getByText('Clear search or filters to broaden the visible set.'),
  ).toBeVisible()
  await user.click(screen.getByRole('button', { name: 'Clear all' }))
  await waitFor(() => expect(router.state.location.searchStr).toBe(''))
})

it('activates Include deleted directly and omits it for Operators', async () => {
  const user = userEvent.setup()
  const router = openCatalog()
  await user.click(await screen.findByRole('button', { name: 'Filter' }))
  await user.click(
    await screen.findByRole('button', { name: /Include deleted.*Not set/ }),
  )
  expect(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: /Include deleted.*On/,
    }),
  ).toBeVisible()
  expect(
    screen.queryByRole('button', { name: 'Back to criteria' }),
  ).not.toBeInTheDocument()
  await waitFor(() =>
    expect(router.state.location.search.includeDeleted).toBe(true),
  )
  await user.click(screen.getByRole('button', { name: 'Close filters' }))
  await user.click(
    screen.getByRole('button', { name: 'Remove Include deleted filter' }),
  )
  await waitFor(() =>
    expect(router.state.location.search.includeDeleted).toBeUndefined(),
  )
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  const operatorRouter = openCatalog(
    '/app/products?includeDeleted=true',
    'operator',
  )
  await user.click(await screen.findByRole('button', { name: 'Filter' }))
  expect(
    within(await screen.findByRole('dialog')).queryByRole('button', {
      name: /Include deleted/,
    }),
  ).not.toBeInTheDocument()
  await waitFor(() =>
    expect(operatorRouter.state.location.search.includeDeleted).toBeUndefined(),
  )
})

it('recovers from a default-query 403 without losing the session', async () => {
  const user = userEvent.setup()
  const router = openCatalog()
  let forbidden = true
  vi.mocked(globalThis.fetch).mockImplementation(async (input) => {
    const url = String(input)
    if (url.endsWith('/auth/me'))
      return Response.json({
        tokenType: 'Bearer',
        expiresAt: '2026-12-01T18:33:00.000Z',
        user: {
          id: 1,
          email: 'admin@example.com',
          role: 'admin',
          active: true,
        },
      })
    if (url.includes('/products')) {
      if (forbidden)
        return Response.json({ message: 'Forbidden' }, { status: 403 })
      return Response.json({ products: [], collections: [] })
    }
    throw new Error(`Unexpected request: ${url}`)
  })
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'You do not have permission',
  )
  forbidden = false
  await user.click(
    within(screen.getByRole('alert')).getByRole('button', {
      name: 'Clear all',
    }),
  )
  expect(await screen.findByText('No products registered yet.')).toBeVisible()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull()
  expect(router.state.location.searchStr).toBe('')
})

it('closes the value editor without applying a value and removes obsolete prototype parameters', async () => {
  const user = userEvent.setup()
  const router = openCatalog(
    '/app/products?filterPrototype=A&productStatus=inactive',
  )
  await user.click(await screen.findByRole('button', { name: 'Filter' }))
  await user.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: /Product category/,
    }),
  )
  expect(screen.queryByRole('button', { name: /Any/ })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Back to criteria' }))
  expect(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: /Product category/,
    }),
  ).toBeVisible()
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: /Product category/,
    }),
  )
  await user.click(screen.getByRole('button', { name: 'Close filters' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(router.state.location.search.productCategory).toBeUndefined()
  expect(
    screen.getByRole('button', { name: 'Product status: Inactive' }),
  ).toBeVisible()
  await waitFor(() =>
    expect(router.state.location.searchStr).not.toContain('filterPrototype'),
  )
})

it('debounces remote Product search while retaining rows and announcing the refresh', async () => {
  const user = userEvent.setup()
  let resolveSearch!: (response: Response) => void
  const fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const url = new URL(String(input))

      if (url.pathname === '/auth/me') return authMeResponse()
      if (url.pathname === '/products' && init?.method === 'GET') {
        if (url.searchParams.get('search') === 'veil') {
          return await new Promise<Response>((resolve) => {
            resolveSearch = resolve
          })
        }

        return jsonResponse({
          products: [productSummary({ id: 'P-ASTER', name: 'Aster Dress' })],
          collections: [],
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

  seedStoredSession()
  const { router } = renderProductsRoute()

  expect(await screen.findByText('Aster Dress')).toBeInTheDocument()
  const searchInput = screen.getByPlaceholderText('Search products by name')
  await user.type(searchInput, 'veil')

  expect(searchInput).toHaveValue('veil')
  expect(screen.getByRole('status')).toHaveTextContent('Updating products…')
  expect(screen.getByText('Aster Dress')).toBeInTheDocument()
  expect(
    fetchSpy.mock.calls.filter(([input]) =>
      new URL(String(input)).searchParams.has('search'),
    ),
  ).toHaveLength(0)

  await waitFor(() => {
    expect(router.state.location.search.search).toBe('veil')
  })
  expect(screen.getByText('Aster Dress')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Updating products…')

  resolveSearch(
    jsonResponse({
      products: [productSummary({ id: 'P-VEIL', name: 'Bianca Veil' })],
      collections: [],
    }),
  )

  expect(await screen.findByText('Bianca Veil')).toBeInTheDocument()
  expect(screen.queryByText('Aster Dress')).not.toBeInTheDocument()
  expect(screen.queryByText('Updating products…')).not.toBeInTheDocument()
})

it('lets admins opt into deleted Products from the list and hides that control from operators', async () => {
  const user = userEvent.setup()
  const fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const url = new URL(String(input))

      if (url.pathname === '/auth/me') {
        return authMeResponse()
      }

      if (url.pathname === '/products' && init?.method === 'GET') {
        if (url.searchParams.get('includeDeleted') === 'true') {
          return jsonResponse({
            products: [
              {
                id: 'P-DEL101',
                name: 'Archived Lace',
                lifecycleStatus: 'approved',
                productStatus: 'inactive',
                deletedAt: '2026-07-08T18:33:00.000Z',
                productCategory: null,
                collection: null,
                createdAt: '2026-07-01T18:33:00.000Z',
                createdBy: {
                  id: 1,
                  email: 'admin@example.com',
                },
              },
            ],
            collections: [],
          })
        }

        return jsonResponse({
          products: [],
          collections: [],
        })
      }

      throw new Error(`Unexpected request: ${url}`)
    })

  seedStoredSession()

  renderProductsRoute()

  expect(
    await screen.findByRole('heading', { name: 'Products' }),
  ).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Filter' }))
  await user.click(
    await screen.findByRole('button', { name: /Include deleted.*Not set/ }),
  )

  await waitFor(() => {
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3333/products?includeDeleted=true',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer opaque-access-token',
        }),
      }),
    )
  })

  expect(await screen.findByText('Archived Lace')).toBeInTheDocument()
  expect(screen.getByText('Deleted', { exact: true })).toBeVisible()

  cleanup()
  vi.restoreAllMocks()

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = new URL(String(input))

    if (url.pathname === '/auth/me') {
      return authMeResponse('operator')
    }

    if (url.pathname === '/products' && init?.method === 'GET') {
      return jsonResponse({
        products: [],
        collections: [],
      })
    }

    throw new Error(`Unexpected request: ${url}`)
  })

  seedStoredSession('operator')

  renderProductsRoute()

  expect(
    await screen.findByRole('heading', { name: 'Products' }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Include deleted' }),
  ).not.toBeInTheDocument()
})

function renderProductsRoute(initialEntry = '/app/products') {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { router }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function availabilityProduct(productStatus: 'active' | 'inactive') {
  return {
    id: 'P-AVAIL1',
    name: 'Jackie',
    shortDescription: null,
    image: null,
    lifecycleStatus: 'testing',
    productStatus,
    productCategory: 'dress',
    collection: null,
    createdAt: '2026-07-01T18:33:00.000Z',
    createdBy: {
      id: 2,
      email: 'operator@example.com',
    },
  }
}

function productSummary(
  overrides: Partial<ReturnType<typeof availabilityProduct>> & {
    id: string
    name: string
    deletedAt?: string
  },
) {
  return {
    ...availabilityProduct(overrides.productStatus ?? 'active'),
    ...overrides,
  }
}

type TestRole = 'admin' | 'operator'

const testUserByRole = {
  admin: {
    id: 1,
    email: 'admin@example.com',
    role: 'admin',
    active: true,
  },
  operator: {
    id: 2,
    email: 'operator@example.com',
    role: 'operator',
    active: true,
  },
} satisfies Record<
  TestRole,
  { id: number; email: string; role: TestRole; active: boolean }
>

function authMeResponse(role: TestRole = 'admin') {
  return jsonResponse({
    tokenType: 'Bearer',
    expiresAt: '2026-07-28T18:33:00.000Z',
    user: testUserByRole[role],
  })
}

function seedStoredSession(role: TestRole = 'admin') {
  localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify({
      token: 'opaque-access-token',
      tokenType: 'Bearer',
      expiresAt: '2026-07-28T18:33:00.000Z',
      user: testUserByRole[role],
    }),
  )
}
