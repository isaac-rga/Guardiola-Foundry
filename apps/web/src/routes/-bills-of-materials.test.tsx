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
          return jsonResponse(
            {
              ...created,
              lines: [],
              costProjection: unavailableProjection(),
            },
            { status: 201 },
          )
        }
        throw new Error(`Unexpected request: ${url.pathname}`)
      })

    seedStoredSession()
    const view = renderBillsOfMaterialsRoute()
    await screen.findByText('No Bills of Materials registered yet.')
    await user.click(screen.getByRole('button', { name: 'Create BOM' }))
    await user.click(screen.getByRole('menuitem', { name: /BOM Template/ }))
    await user.type(
      screen.getByRole('textbox', { name: 'BOM Name' }),
      'Unsaved draft',
    )
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
      screen.getByRole('textbox', { name: 'BOM Name' }),
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
            productId: null,
            lines: [],
          }),
        }),
      )
    })
    const row = (await screen.findByText('Jackie base construction')).closest(
      'tr',
    ) as HTMLTableRowElement
    expect(within(row).getByText('Template')).toBeInTheDocument()
    expect(within(row).getByText('BOM ID BOM-ABC234')).toBeInTheDocument()
    expect(within(row).getByText('No Product associated')).toBeInTheDocument()
    expect(
      within(row).getByText('Product relationship is optional'),
    ).toBeInTheDocument()
    expect(
      within(row).queryByText('Reusable starting point'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Type' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Product context' }),
    ).toBeInTheDocument()

    view.unmount()
    renderBillsOfMaterialsRoute()
    expect(
      await screen.findByText('Jackie base construction'),
    ).toBeInTheDocument()
  })

  it('recommends Product scope without blocking an unassociated Template', async () => {
    const user = userEvent.setup()
    const postedBodies: unknown[] = []
    let billsOfMaterials: unknown[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials })
      }
      if (url.pathname === '/products') {
        return jsonResponse({
          products: [
            {
              id: 'P-JACKIE',
              name: 'Jackie',
              lifecycleStatus: 'finished',
              productStatus: 'active',
              productCategory: 'dress',
              collection: null,
              createdAt: '2026-09-08T12:00:00.000Z',
              createdBy: { id: 1, email: 'operator@example.com' },
            },
          ],
          collections: [],
        })
      }
      if (url.pathname === '/bills-of-materials' && init?.method === 'POST') {
        postedBodies.push(JSON.parse(String(init.body)))
        const created = {
          ...billOfMaterialsFixture(),
          name: 'Jackie base',
          product: {
            id: 'P-JACKIE',
            name: 'Jackie',
            availability: 'available' as const,
          },
        }
        billsOfMaterials = [created]
        return jsonResponse(
          {
            ...created,
            lines: [],
            costProjection: unavailableProjection(),
          },
          { status: 201 },
        )
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText('No Bills of Materials registered yet.')
    await user.click(screen.getByRole('button', { name: 'Create BOM' }))
    await user.click(screen.getByRole('menuitem', { name: /BOM Template/ }))

    expect(
      screen.getByText('Product association recommended'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('BOM Template · No Product association'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Choose Product' }))
    await user.click(
      await screen.findByRole('button', { name: /Jackie.*P-JACKIE/ }),
    )
    expect(
      screen.getByText('BOM Template · Jackie · P-JACKIE'),
    ).toBeInTheDocument()

    await user.type(
      screen.getByRole('textbox', { name: 'BOM Name' }),
      'Jackie base',
    )
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    await waitFor(() => expect(postedBodies).toHaveLength(1))
    expect(postedBodies[0]).toEqual({
      kind: 'template',
      name: 'Jackie base',
      description: null,
      productId: 'P-JACKIE',
      lines: [],
    })
    const row = (await screen.findByText('Jackie base')).closest(
      'tr',
    ) as HTMLTableRowElement
    expect(within(row).getByText('Jackie')).toBeInTheDocument()
    expect(within(row).getByText('P-JACKIE · Available')).toBeInTheDocument()
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

  it('assigns a previously unassociated Template once from the catalog', async () => {
    const user = userEvent.setup()
    let template = {
      ...billOfMaterialsFixture(),
      product: null as null | {
        id: string
        name: string
        availability: 'available' | 'unavailable'
      },
    }
    const associationBodies: unknown[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials: [template] })
      }
      if (url.pathname === '/products') {
        return jsonResponse({
          products: [productFixture()],
          collections: [],
        })
      }
      if (
        url.pathname === `/bills-of-materials/${template.id}/product` &&
        init?.method === 'POST'
      ) {
        associationBodies.push(JSON.parse(String(init.body)))
        template = {
          ...template,
          product: {
            id: 'P-JACKIE',
            name: 'Jackie',
            availability: 'available',
          },
        }
        return jsonResponse({
          ...template,
          lines: [],
          costProjection: unavailableProjection(),
        })
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText('Jackie base construction')
    await user.click(
      screen.getByRole('button', {
        name: 'Actions for Jackie base construction',
      }),
    )
    await user.click(
      screen.getByRole('menuitem', { name: 'Associate Product' }),
    )
    await user.click(
      await screen.findByRole('button', { name: /Jackie.*P-JACKIE/ }),
    )

    await waitFor(() =>
      expect(associationBodies).toEqual([{ productId: 'P-JACKIE' }]),
    )
    const row = screen
      .getByText('Jackie base construction')
      .closest('tr') as HTMLTableRowElement
    expect(within(row).getByText('Jackie')).toBeInTheDocument()
    expect(within(row).getByText('P-JACKIE · Available')).toBeInTheDocument()
    expect(
      within(row).queryByRole('button', {
        name: 'Actions for Jackie base construction',
      }),
    ).not.toBeInTheDocument()
  })

  it('composes, repeats, reorders, and atomically saves BOM Lines from the Construction Board', async () => {
    const user = userEvent.setup()
    const postedBodies: unknown[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials: [] })
      }
      if (url.pathname === '/materials/search') {
        return jsonResponse(materialSearchFixture())
      }
      if (url.pathname === '/bills-of-materials' && init?.method === 'POST') {
        postedBodies.push(JSON.parse(String(init.body)))
        return jsonResponse(
          {
            ...billOfMaterialsFixture(),
            lines: [],
            costProjection: unavailableProjection(),
          },
          { status: 201 },
        )
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText('No Bills of Materials registered yet.')
    await user.click(screen.getByRole('button', { name: 'Create BOM' }))
    await user.click(screen.getByRole('menuitem', { name: /BOM Template/ }))
    await user.type(
      screen.getByRole('textbox', { name: 'BOM Name' }),
      'Layered skirt',
    )
    await user.click(screen.getByRole('button', { name: 'Add BOM line' }))
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))
    expect(
      await screen.findByText('Construction Piece is required.'),
    ).toBeInTheDocument()
    expect(postedBodies).toHaveLength(0)
    await user.type(screen.getByLabelText('Construction Piece'), 'Outer skirt')
    await user.click(screen.getByRole('combobox', { name: 'Choose Material' }))
    expect(
      screen.getByText('Type to search the Material catalog.'),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('Search Material'), 'ivory casa')
    await user.click(
      await screen.findByRole('button', { name: /Ivory Silk Crepe M-0001/i }),
    )
    await user.type(screen.getByLabelText('Final meters'), '1.2345')
    await user.type(screen.getByLabelText('Line Note'), 'Cut on grain')
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))
    expect(
      await screen.findByText(
        'Final meters must have at most three decimal places.',
      ),
    ).toBeInTheDocument()
    expect(postedBodies).toHaveLength(0)

    await user.clear(screen.getByLabelText('Final meters'))
    await user.type(screen.getByLabelText('Final meters'), '1.234')
    await waitFor(() => {
      expect(
        screen.queryByText(
          'Final meters must have at most three decimal places.',
        ),
      ).not.toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Duplicate line' }))
    await user.clear(screen.getByLabelText('Construction Piece'))
    await user.type(screen.getByLabelText('Construction Piece'), 'Lining')
    await user.click(screen.getByLabelText('Reorder Lining'))
    await user.keyboard('{ArrowUp}')
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    await waitFor(() => expect(postedBodies).toHaveLength(1))
    expect(postedBodies[0]).toEqual({
      kind: 'template',
      name: 'Layered skirt',
      description: null,
      productId: null,
      lines: [
        {
          constructionPiece: 'Lining',
          materialId: 'M-0001',
          materialQuantity: 1.234,
          lineNote: 'Cut on grain',
          verified: false,
        },
        {
          constructionPiece: 'Outer skirt',
          materialId: 'M-0001',
          materialQuantity: 1.234,
          lineNote: 'Cut on grain',
          verified: false,
        },
      ],
    })
  })

  it('verifies only Complete lines and resets only when reviewed construction facts change', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials: [] })
      }
      if (url.pathname === '/materials/search') {
        return jsonResponse(materialSearchFixture(true))
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText('No Bills of Materials registered yet.')
    await user.click(screen.getByRole('button', { name: 'Create BOM' }))
    await user.click(screen.getByRole('menuitem', { name: /BOM Template/ }))
    await user.click(screen.getByRole('button', { name: 'Add BOM line' }))

    const verification = screen.getByRole('checkbox', {
      name: 'Manually verified',
    })
    expect(verification).toBeDisabled()
    await user.type(screen.getByLabelText('Construction Piece'), 'Outer skirt')
    await user.click(screen.getByRole('combobox', { name: 'Choose Material' }))
    await user.type(screen.getByLabelText('Search Material'), 'silk')
    await user.click(
      await screen.findByRole('button', { name: /Ivory Silk Crepe M-0001/i }),
    )
    await user.type(screen.getByLabelText('Final meters'), '3.125')

    expect(verification).toBeEnabled()
    await user.click(verification)
    expect(verification).toBeChecked()
    const wholeBom = screen.getByText('Whole BOM').closest('[data-slot="card"]')
    expect(
      within(wholeBom as HTMLElement).getByText('Complete').parentElement,
    ).toHaveTextContent('Complete1')
    expect(
      within(wholeBom as HTMLElement).getByText('Verified').parentElement,
    ).toHaveTextContent('Verified1')

    await user.type(screen.getByLabelText('Line Note'), 'Cut on grain')
    await user.type(
      screen.getByRole('textbox', { name: 'BOM Name' }),
      'Reviewed',
    )
    await user.type(screen.getByLabelText('Description'), 'Stable context')
    expect(verification).toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Add BOM line' }))
    await user.type(screen.getByLabelText('Construction Piece'), 'Lining')
    await user.click(screen.getByLabelText('Reorder Lining'))
    await user.keyboard('{ArrowUp}')
    await user.click(screen.getAllByText('Outer skirt')[0])
    expect(
      screen.getByRole('checkbox', { name: 'Manually verified' }),
    ).toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Duplicate line' }))
    expect(
      screen.getByRole('checkbox', { name: 'Manually verified' }),
    ).not.toBeChecked()
    await user.click(screen.getAllByText('Outer skirt')[0])
    await user.clear(screen.getByLabelText('Construction Piece'))
    await user.type(
      screen.getByLabelText('Construction Piece'),
      'Outer overskirt',
    )
    expect(
      screen.getByRole('checkbox', { name: 'Manually verified' }),
    ).not.toBeChecked()

    await user.click(
      screen.getByRole('checkbox', { name: 'Manually verified' }),
    )
    await user.clear(screen.getByLabelText('Final meters'))
    await user.type(screen.getByLabelText('Final meters'), '3.25')
    expect(
      screen.getByRole('checkbox', { name: 'Manually verified' }),
    ).not.toBeChecked()

    await user.click(
      screen.getByRole('checkbox', { name: 'Manually verified' }),
    )
    await user.click(
      screen.getByRole('checkbox', { name: 'Manually verified' }),
    )
    expect(
      screen.getByRole('checkbox', { name: 'Manually verified' }),
    ).not.toBeChecked()

    await user.click(
      screen.getByRole('checkbox', { name: 'Manually verified' }),
    )
    await user.click(screen.getByRole('combobox', { name: 'Choose Material' }))
    await user.type(screen.getByLabelText('Search Material'), 'satin')
    await user.click(
      await screen.findByRole('button', {
        name: /Champagne Structure Satin M-0002/i,
      }),
    )
    expect(
      screen.getByRole('checkbox', { name: 'Manually verified' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('checkbox', { name: 'Manually verified' }),
    ).not.toBeChecked()
  })

  it('previews live line context, rounded BOM projections, exclusions, and sourcing attention', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials: [] })
      }
      if (url.pathname === '/materials/search') {
        return jsonResponse(materialSearchFixture(true, true))
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText('No Bills of Materials registered yet.')
    await user.click(screen.getByRole('button', { name: 'Create BOM' }))
    await user.click(screen.getByRole('menuitem', { name: /BOM Template/ }))
    const wholeBom = screen.getByText('Whole BOM').closest('[data-slot="card"]')
    expect(wholeBom).toHaveTextContent('Material projectionUnavailable')

    await user.click(screen.getByRole('button', { name: 'Add BOM line' }))
    await user.type(screen.getByLabelText('Construction Piece'), 'Outer skirt')
    await user.click(screen.getByRole('combobox', { name: 'Choose Material' }))
    await user.type(screen.getByLabelText('Search Material'), 'silk')
    await user.click(
      await screen.findByRole('button', { name: /Ivory Silk Crepe M-0001/i }),
    )

    expect(
      screen.getByText(/140 cm width · Italian Silk Crepe/),
    ).toHaveTextContent('Casa Tessile · Ivory 100 · $42.00/m')
    expect(wholeBom).toHaveTextContent('1 line excluded from projection.')

    await user.type(screen.getByLabelText('Final meters'), '1.111')
    expect(screen.getAllByText('$46.66')).toHaveLength(2)
    expect(wholeBom).not.toHaveTextContent('excluded from projection')

    await user.click(screen.getByRole('button', { name: 'Duplicate line' }))
    expect(wholeBom).toHaveTextContent('Material projection$93.32')
    await user.click(screen.getByRole('button', { name: 'Add BOM line' }))
    expect(wholeBom).toHaveTextContent('Material projection$93.32 · partial')
    expect(wholeBom).toHaveTextContent('1 line excluded from projection.')

    await user.type(screen.getByLabelText('Construction Piece'), 'Structure')
    await user.click(screen.getByRole('combobox', { name: 'Choose Material' }))
    await user.type(screen.getByLabelText('Search Material'), 'satin')
    await user.click(
      await screen.findByRole('button', {
        name: /Champagne Structure Satin M-0002/i,
      }),
    )
    await user.type(screen.getByLabelText('Final meters'), '1')
    expect(screen.getAllByText('$0.00')).toHaveLength(1)
    expect(wholeBom).toHaveTextContent('Material projection$93.32')

    await user.click(screen.getByRole('combobox', { name: 'Choose Material' }))
    await user.type(screen.getByLabelText('Search Material'), 'lace')
    await user.click(
      await screen.findByRole('button', {
        name: /White Chantilly Lace M-0003/i,
      }),
    )
    await user.type(screen.getByLabelText('Final meters'), '1')
    expect(screen.getByText('Source needs attention')).toBeInTheDocument()
    expect(screen.queryByText('$0.00')).not.toBeInTheDocument()
    expect(wholeBom).toHaveTextContent('Material projection$93.32 · partial')
  })

  it('clears Final meters when Material changes and supports removing a line', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials: [] })
      }
      if (url.pathname === '/materials/search') {
        return jsonResponse(materialSearchFixture(true))
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText('No Bills of Materials registered yet.')
    await user.click(screen.getByRole('button', { name: 'Create BOM' }))
    await user.click(screen.getByRole('menuitem', { name: /BOM Template/ }))
    await user.click(screen.getByRole('button', { name: 'Add BOM line' }))
    await user.click(screen.getByRole('combobox', { name: 'Choose Material' }))
    await user.type(screen.getByLabelText('Search Material'), 'silk')
    await user.click(
      await screen.findByRole('button', { name: /Ivory Silk Crepe M-0001/i }),
    )
    await user.type(screen.getByLabelText('Final meters'), '2.5')

    await user.click(screen.getByRole('combobox', { name: 'Choose Material' }))
    await user.type(screen.getByLabelText('Search Material'), 'satin')
    await user.click(
      await screen.findByRole('button', {
        name: /Champagne Structure Satin M-0002/i,
      }),
    )
    expect(screen.getByLabelText('Final meters')).toHaveValue(null)

    await user.click(screen.getByRole('button', { name: 'Remove line' }))
    expect(screen.getByText('No BOM Lines yet.')).toBeInTheDocument()
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
    await user.type(
      screen.getByRole('textbox', { name: 'BOM Name' }),
      'Preserved draft',
    )
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Authentication is required.',
    )
    expect(screen.getByRole('textbox', { name: 'BOM Name' })).toHaveValue(
      'Preserved draft',
    )
    expect(
      screen.getByRole('heading', { name: 'Preserved draft' }),
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
    product: null,
    createdBy: { id: 1, email: 'operator@example.com' },
    createdAt: '2026-09-08T12:00:00.000Z',
    updatedAt: '2026-09-08T12:00:00.000Z',
  }
}

function productFixture() {
  return {
    id: 'P-JACKIE',
    name: 'Jackie',
    lifecycleStatus: 'finished' as const,
    productStatus: 'active' as const,
    productCategory: 'dress' as const,
    collection: null,
    createdAt: '2026-09-08T12:00:00.000Z',
    createdBy: { id: 1, email: 'operator@example.com' },
  }
}

function materialSearchFixture(
  includeSecond = false,
  includeUnavailable = false,
) {
  const items: Array<{
    id: string
    name: string
    materialColor: 'ivory' | 'champagne' | 'white'
    materialUse: 'base-fabric' | 'structure' | 'lace'
    preferredSource: {
      id: string
      name: string
      vendor: string
      vendorShadeOrDetail: string | null
      widthCentimeters: number | null
      landedUnitCostCents: number | null
    }
    attention: Array<'source-needs-attention'>
  }> = [
    {
      id: 'M-0001',
      name: 'Ivory Silk Crepe',
      materialColor: 'ivory',
      materialUse: 'base-fabric',
      preferredSource: {
        id: 'S-0001',
        name: 'Italian Silk Crepe',
        vendor: 'Casa Tessile',
        vendorShadeOrDetail: 'Ivory 100',
        widthCentimeters: 140,
        landedUnitCostCents: 4200,
      },
      attention: [],
    },
  ]
  if (includeSecond) {
    items.push({
      id: 'M-0002',
      name: 'Champagne Structure Satin',
      materialColor: 'champagne',
      materialUse: 'structure',
      preferredSource: {
        id: 'S-0003',
        name: 'Structured Satin',
        vendor: 'Atelier Supply',
        vendorShadeOrDetail: null,
        widthCentimeters: 150,
        landedUnitCostCents: 0,
      },
      attention: [],
    })
  }
  if (includeUnavailable) {
    items.push({
      id: 'M-0003',
      name: 'White Chantilly Lace',
      materialColor: 'white',
      materialUse: 'lace',
      preferredSource: {
        id: 'S-0004',
        name: 'White Chantilly Lace',
        vendor: 'Dentelle House',
        vendorShadeOrDetail: null,
        widthCentimeters: 120,
        landedUnitCostCents: null,
      },
      attention: ['source-needs-attention'],
    })
  }
  return { items, hasMore: false }
}

function unavailableProjection() {
  return {
    availability: 'unavailable' as const,
    amountCents: null,
    excludedLineCount: 0,
  }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}
