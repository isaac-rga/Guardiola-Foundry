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

describe('Bills of Materials route', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('redirects an unauthenticated visitor to the existing sign-in flow', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    renderBillsOfMaterialsRoute()

    expect(
      await screen.findByRole('heading', {
        name: /sign in to guardiola foundry/i,
      }),
    ).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('abandons without creating, then validates, saves, and reloads a Template', async () => {
    const user = userEvent.setup()
    let billsOfMaterials: unknown[] = []
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        const url = new URL(String(input))
        if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
        if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
          return jsonResponse({ billsOfMaterials })
        }
        if (url.pathname === '/bills-of-materials' && init?.method === 'POST') {
          const created = billOfMaterialsFixture()
          billsOfMaterials = [created]
          return jsonResponse(created, { status: 201 })
        }
        throw new Error(`Unexpected request: ${url.pathname}`)
      })

    seedStoredSession()
    const view = renderBillsOfMaterialsRoute()
    await screen.findByText('No Bills of Materials registered yet.')
    await user.click(screen.getByRole('button', { name: 'Create BOM' }))
    await user.click(screen.getByRole('menuitem', { name: /BOM Template/ }))
    await user.type(screen.getByLabelText('BOM name'), 'Unsaved draft')
    await user.click(screen.getByRole('button', { name: 'Back to catalog' }))
    await screen.findByText('No Bills of Materials registered yet.')
    expect(
      fetchSpy.mock.calls.filter(([, init]) => init?.method === 'POST'),
    ).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Create BOM' }))
    await user.click(screen.getByRole('menuitem', { name: /BOM Template/ }))
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    expect(await screen.findByText('BOM name is required.')).toBeInTheDocument()
    expect(
      fetchSpy.mock.calls.filter(([, init]) => init?.method === 'POST'),
    ).toHaveLength(0)

    await user.type(
      screen.getByLabelText('BOM name'),
      'Jackie base construction',
    )
    await user.type(
      screen.getByLabelText('Description'),
      'Reusable starting point',
    )
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://localhost:3333/bills-of-materials',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            kind: 'template',
            name: 'Jackie base construction',
            description: 'Reusable starting point',
          }),
        }),
      )
    })
    const row = (await screen.findByText('Jackie base construction')).closest(
      'tr',
    ) as HTMLTableRowElement
    expect(within(row).getByText('Template')).toBeInTheDocument()
    expect(within(row).getByText('BOM ID BOM-ABC234')).toBeInTheDocument()

    view.unmount()
    renderBillsOfMaterialsRoute()
    expect(
      await screen.findByText('Jackie base construction'),
    ).toBeInTheDocument()
  })

  it('visibly distinguishes Templates from Implementations in the catalog', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials') {
        return jsonResponse({
          billsOfMaterials: [
            billOfMaterialsFixture(),
            {
              ...billOfMaterialsFixture(),
              id: 'BOM-DEF567',
              kind: 'implementation',
              name: 'Jackie sample implementation',
            },
          ],
        })
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()

    const templateRow = (
      await screen.findByText('Jackie base construction')
    ).closest('tr') as HTMLTableRowElement
    const implementationRow = screen
      .getByText('Jackie sample implementation')
      .closest('tr') as HTMLTableRowElement
    expect(within(templateRow).getByText('Template')).toHaveAttribute(
      'data-variant',
      'secondary',
    )
    expect(
      within(implementationRow).getByText('Implementation'),
    ).toHaveAttribute('data-variant', 'outline')

    await user.click(screen.getByRole('button', { name: 'Create BOM' }))
    expect(
      screen.getByRole('menuitem', { name: /BOM Template/ }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('menuitem', { name: /BOM Implementation/ }),
    ).not.toBeInTheDocument()
  })

  it('shows a recoverable catalog loading error', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials') {
        return jsonResponse(
          { message: 'Catalog temporarily unavailable.' },
          { status: 503 },
        )
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Catalog temporarily unavailable.',
    )
  })

  it('keeps the draft visible when authorization expires during Save', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials: [] })
      }
      if (url.pathname === '/bills-of-materials' && init?.method === 'POST') {
        return jsonResponse(
          { message: 'Authentication is required.' },
          { status: 401 },
        )
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText('No Bills of Materials registered yet.')
    await user.click(screen.getByRole('button', { name: 'Create BOM' }))
    await user.click(screen.getByRole('menuitem', { name: /BOM Template/ }))
    await user.type(screen.getByLabelText('BOM name'), 'Preserved draft')
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Authentication is required.',
    )
    expect(screen.getByLabelText('BOM name')).toHaveValue('Preserved draft')
    expect(
      screen.getByRole('heading', { name: 'Construction Board' }),
    ).toBeInTheDocument()
  })
})

function renderBillsOfMaterialsRoute() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: ['/app/bills-of-materials'],
    }),
  })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

function seedStoredSession() {
  localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify(sessionFixture()),
  )
}

function sessionFixture() {
  return {
    token: 'session-token',
    tokenType: 'Bearer' as const,
    expiresAt: '2026-09-09T12:00:00.000Z',
    user: {
      id: 1,
      email: 'operator@example.com',
      role: 'operator' as const,
      active: true,
    },
  }
}

function billOfMaterialsFixture() {
  return {
    id: 'BOM-ABC234',
    kind: 'template' as const,
    name: 'Jackie base construction',
    description: 'Reusable starting point',
    createdBy: { id: 1, email: 'operator@example.com' },
    createdAt: '2026-09-08T12:00:00.000Z',
    updatedAt: '2026-09-08T12:00:00.000Z',
  }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}
