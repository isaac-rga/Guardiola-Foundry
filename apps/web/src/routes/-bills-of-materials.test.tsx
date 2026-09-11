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

  it('returns an Implementation route without Variant context to the catalog', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials: [] })
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute(
      '/app/bills-of-materials?screen=builder&kind=implementation',
    )

    expect(
      await screen.findByText('No Bills of Materials registered yet.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('textbox', { name: 'BOM Name' }),
    ).not.toBeInTheDocument()
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
    await user.click(
      await screen.findByRole('button', { name: 'Discard draft' }),
    )
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
    expect(within(row).getByText('BOM-ABC234')).toBeInTheDocument()
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

  it('selects an eligible Product Variant before preserving and saving a manual Implementation draft', async () => {
    const user = userEvent.setup()
    let saveAttempts = 0
    let billsOfMaterials: unknown[] = []
    const postedBodies: unknown[] = []
    const eligibleCandidate = {
      id: 'PV-JACKIE',
      name: 'Jackie Showroom',
      status: 'active' as const,
      product: {
        id: 'P-JACKIE',
        name: 'Jackie',
        availability: 'available' as const,
      },
      selectable: true,
      outcome: 'eligible' as const,
      existingImplementation: null,
    }
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials })
      }
      if (url.pathname === '/bills-of-materials/product-variant-candidates') {
        return jsonResponse({
          items: [
            eligibleCandidate,
            {
              ...eligibleCandidate,
              id: 'PV-OCCUP2',
              name: 'Jackie Editorial',
              selectable: false,
              outcome: 'implementation-exists',
              existingImplementation: {
                id: 'BOM-USED24',
                name: 'Existing construction',
              },
            },
          ],
          hasMore: false,
        })
      }
      if (url.pathname === '/bills-of-materials' && init?.method === 'POST') {
        postedBodies.push(JSON.parse(String(init.body)))
        saveAttempts += 1
        if (saveAttempts === 1) {
          return jsonResponse(
            {
              message: 'Product Variant already has Existing construction.',
              conflictingImplementation: {
                id: 'BOM-USED24',
                name: 'Existing construction',
              },
            },
            { status: 409 },
          )
        }
        const created = {
          ...billOfMaterialsFixture(),
          kind: 'implementation' as const,
          name: 'Jackie - Blush',
          product: eligibleCandidate.product,
          productVariant: {
            id: eligibleCandidate.id,
            name: eligibleCandidate.name,
            availability: 'available' as const,
          },
        }
        billsOfMaterials = [created]
        return jsonResponse(
          { ...created, lines: [], costProjection: unavailableProjection() },
          { status: 201 },
        )
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText('No Bills of Materials registered yet.')
    await user.click(screen.getByRole('button', { name: 'Create BOM' }))
    await user.click(
      screen.getByRole('menuitem', { name: /BOM Implementation/ }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Select a Product Variant' }),
    ).toBeInTheDocument()
    await user.type(
      screen.getByRole('textbox', { name: 'Search Product Variants' }),
      'jackie',
    )

    const occupied = await screen.findByRole('button', {
      name: /Jackie Editorial.*Existing construction.*BOM-USED24/i,
    })
    expect(occupied).toBeDisabled()
    await user.click(
      screen.getByRole('button', { name: /Jackie Showroom.*PV-JACKIE/i }),
    )

    expect(
      await screen.findByRole('textbox', { name: 'BOM Typification' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Jackie Showroom')).toBeInTheDocument()
    expect(screen.getByText('PV-JACKIE')).toBeInTheDocument()
    expect(
      screen.getByText(/Fixed for this Implementation/),
    ).toBeInTheDocument()
    await user.type(
      screen.getByRole('textbox', { name: 'BOM Typification' }),
      'Jackie - Blush',
    )
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    await waitFor(() => {
      expect(postedBodies[0]).toEqual({
        kind: 'implementation',
        name: 'Jackie - Blush',
        description: null,
        productVariantId: 'PV-JACKIE',
        lines: [],
      })
    })
    expect(
      await screen.findByText(
        'Product Variant already has Existing construction.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'BOM Typification' }),
    ).toHaveValue('Jackie - Blush')
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    const row = (await screen.findByText('Jackie - Blush')).closest(
      'tr',
    ) as HTMLTableRowElement
    expect(within(row).getByText('Implementation')).toBeInTheDocument()
    expect(
      within(row).getByText(/Jackie Showroom.*PV-JACKIE/),
    ).toBeInTheDocument()
  })

  it('creates an Implementation from an associated Template catalog action', async () => {
    const user = userEvent.setup()
    const template = {
      ...billOfMaterialsFixture(),
      product: {
        id: 'P-JACKIE',
        name: 'Jackie',
        availability: 'available' as const,
      },
    }
    const candidate = {
      id: 'PV-JACKIE',
      name: 'Jackie Showroom',
      status: 'active' as const,
      product: template.product,
      selectable: true,
      outcome: 'eligible' as const,
      existingImplementation: null,
    }
    const postedBodies: unknown[] = []
    let saveAttempts = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials: [template] })
      }
      if (url.pathname === '/bills-of-materials/product-variant-candidates') {
        expect(url.searchParams.get('templateId')).toBe(template.id)
        return jsonResponse({ items: [candidate], hasMore: false })
      }
      if (
        url.pathname === `/bills-of-materials/${template.id}` &&
        init?.method === 'GET'
      ) {
        return jsonResponse({
          ...billOfMaterialsDetailFixture(),
          ...template,
        })
      }
      if (
        url.pathname === `/bills-of-materials/${template.id}/implementations` &&
        init?.method === 'POST'
      ) {
        postedBodies.push(JSON.parse(String(init.body)))
        saveAttempts += 1
        if (saveAttempts === 1) {
          return jsonResponse(
            {
              message:
                'BOM typification already exists for this Product Variant.',
              errors: {
                name: [
                  'BOM typification already exists for this Product Variant.',
                ],
              },
            },
            { status: 409 },
          )
        }
        return jsonResponse(
          {
            ...billOfMaterialsDetailFixture(),
            id: 'BOM-DER234',
            kind: 'implementation',
            name: 'Jackie - Blush',
            product: template.product,
            productVariant: {
              id: candidate.id,
              name: candidate.name,
              availability: 'available',
            },
            origin: {
              id: template.id,
              name: template.name,
              kind: 'template',
              availability: 'available',
            },
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
    await screen.findByText(template.name)
    await user.click(
      screen.getByRole('button', { name: `Actions for ${template.name}` }),
    )
    await user.click(
      screen.getByRole('menuitem', { name: 'Create Implementation' }),
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Search Product Variants' }),
      'showroom',
    )
    await user.click(
      await screen.findByRole('button', {
        name: /Jackie Showroom.*PV-JACKIE/i,
      }),
    )

    const typification = await screen.findByRole('textbox', {
      name: 'BOM Typification',
    })
    await user.type(typification, 'Jackie - Blush')
    expect(screen.getByText('Construction Board')).toBeInTheDocument()
    expect(screen.getByText('Outer skirt')).toBeInTheDocument()
    expect(
      screen.getByText(`Copied from ${template.name} when you save`),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    expect(
      await screen.findByText(
        'BOM typification already exists for this Product Variant.',
      ),
    ).toBeInTheDocument()
    expect(typification).toHaveValue('Jackie - Blush')
    expect(screen.getByText('Outer skirt')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    await waitFor(() =>
      expect(postedBodies).toEqual([
        { name: 'Jackie - Blush', productVariantId: candidate.id },
        { name: 'Jackie - Blush', productVariantId: candidate.id },
      ]),
    )
  })

  it('opens a saved Template, protects its draft, and offers deliberate stale recovery', async () => {
    const user = userEvent.setup()
    const saved = billOfMaterialsDetailFixture()
    const current = {
      ...saved,
      name: 'Current saved construction',
      updatedAt: '2026-09-08T13:00:00.000Z',
    }
    let detailLoads = 0
    const putBodies: unknown[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials: [saved] })
      }
      if (
        url.pathname === `/bills-of-materials/${saved.id}` &&
        init?.method === 'GET'
      ) {
        detailLoads += 1
        return jsonResponse(detailLoads === 1 ? saved : current)
      }
      if (
        url.pathname === `/bills-of-materials/${saved.id}` &&
        init?.method === 'PUT'
      ) {
        putBodies.push(JSON.parse(String(init.body)))
        return jsonResponse(
          {
            message:
              'This Bill of Materials changed after you opened it. Your draft was not saved.',
            currentUpdatedAt: current.updatedAt,
          },
          { status: 409 },
        )
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText(saved.name)
    await user.click(
      screen.getByRole('button', { name: `Actions for ${saved.name}` }),
    )
    await user.click(
      screen.getByRole('menuitem', { name: 'Edit Bill of Materials' }),
    )

    const name = await screen.findByRole('textbox', { name: 'BOM Name' })
    expect(name).toHaveValue(saved.name)
    expect(screen.getByText('Outer skirt')).toBeInTheDocument()
    await user.clear(name)
    await user.type(name, 'My unsaved construction')
    await user.click(screen.getByRole('button', { name: 'Back to catalog' }))
    expect(
      await screen.findByRole('heading', { name: 'Discard unsaved changes?' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue editing' }))
    expect(name).toHaveValue('My unsaved construction')

    await user.click(screen.getByRole('button', { name: 'Save BOM' }))
    expect(
      await screen.findByText(
        'This Bill of Materials changed after you opened it. Your draft was not saved.',
      ),
    ).toBeInTheDocument()
    expect(name).toHaveValue('My unsaved construction')
    expect(putBodies).toEqual([
      {
        updatedAt: saved.updatedAt,
        name: 'My unsaved construction',
        description: saved.description,
        lines: [
          {
            id: 'BML-SKRT23',
            constructionPiece: 'Outer skirt',
            materialId: 'M-0001',
            materialQuantity: 3.125,
            patternSetId: null,
            lineNote: 'Cut on grain',
            verified: true,
          },
        ],
      },
    ])

    await user.click(
      screen.getByRole('button', { name: 'Reload current saved version' }),
    )
    expect(
      await screen.findByRole('textbox', { name: 'BOM Name' }),
    ).toHaveValue('Current saved construction')
  })

  it('derives a Template from either BOM kind while retaining the local draft on save failure', async () => {
    const user = userEvent.setup()
    const origin = {
      ...billOfMaterialsDetailFixture(),
      id: 'BOM-ORIG24',
      kind: 'implementation' as const,
      name: 'Jackie atelier sample',
      product: {
        id: 'P-JACKIE',
        name: 'Jackie',
        availability: 'available' as const,
      },
      productVariant: {
        id: 'PV-JACKIE',
        name: 'Jackie Showroom',
        availability: 'available' as const,
      },
    }
    let billsOfMaterials: unknown[] = [origin]
    const postedBodies: unknown[] = []
    let saveAttempts = 0
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials })
      }
      if (
        url.pathname === `/bills-of-materials/${origin.id}` &&
        init?.method === 'GET'
      ) {
        return jsonResponse(origin)
      }
      if (
        url.pathname === `/bills-of-materials/${origin.id}/templates` &&
        init?.method === 'POST'
      ) {
        postedBodies.push(JSON.parse(String(init.body)))
        saveAttempts += 1
        if (saveAttempts === 1) {
          return jsonResponse({ message: 'Unable to derive this Template.' }, { status: 500 })
        }
        const derived = {
          ...origin,
          id: 'BOM-COPY24',
          kind: 'template' as const,
          name: 'Jackie working copy',
          product: null,
          productVariant: null,
          origin: {
            id: origin.id,
            name: origin.name,
            kind: origin.kind,
            availability: 'available' as const,
          },
        }
        billsOfMaterials = [derived, origin]
        return jsonResponse(derived, { status: 201 })
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText(origin.name)
    await user.click(
      screen.getByRole('button', { name: `Actions for ${origin.name}` }),
    )
    await user.click(screen.getByRole('menuitem', { name: 'Derive Template' }))

    const name = await screen.findByRole('textbox', { name: 'BOM Name' })
    expect(name).toHaveValue(`${origin.name} — copy`)
    expect(screen.getByLabelText('Description')).toBeDisabled()
    expect(screen.getByLabelText('Construction Piece')).toBeDisabled()
    expect(
      screen.getByText(`Origin: Implementation · ${origin.name} · ${origin.id}`),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue without Product' }))
    await user.clear(name)
    await user.type(name, 'Jackie working copy')
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    expect(await screen.findByText('Unable to derive this Template.')).toBeInTheDocument()
    expect(name).toHaveValue('Jackie working copy')
    expect(screen.getByText('Outer skirt')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    await waitFor(() =>
      expect(postedBodies).toEqual([
        { name: 'Jackie working copy', productId: null },
        { name: 'Jackie working copy', productId: null },
      ]),
    )
    expect(await screen.findByText('Jackie working copy')).toBeInTheDocument()
    expect(screen.getByText(/Origin: Jackie atelier sample/)).toBeInTheDocument()
  })

  it('preserves the local draft when the open Bill of Materials was deleted', async () => {
    const user = userEvent.setup()
    const saved = billOfMaterialsDetailFixture()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials: [saved] })
      }
      if (
        url.pathname === `/bills-of-materials/${saved.id}` &&
        init?.method === 'GET'
      ) {
        return jsonResponse(saved)
      }
      if (
        url.pathname === `/bills-of-materials/${saved.id}` &&
        init?.method === 'PUT'
      ) {
        return jsonResponse(
          {
            message:
              'This Bill of Materials was deleted while it was open. Your draft was not saved.',
            deleted: true,
          },
          { status: 409 },
        )
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText(saved.name)
    await user.click(
      screen.getByRole('button', { name: `Actions for ${saved.name}` }),
    )
    await user.click(
      screen.getByRole('menuitem', { name: 'Edit Bill of Materials' }),
    )

    const name = await screen.findByRole('textbox', { name: 'BOM Name' })
    await user.clear(name)
    await user.type(name, 'Unsaved deleted-record draft')
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    expect(
      await screen.findByText(
        'This Bill of Materials was deleted while it was open. Your draft was not saved.',
      ),
    ).toBeInTheDocument()
    expect(name).toHaveValue('Unsaved deleted-record draft')
    expect(
      screen.queryByRole('button', { name: 'Reload current saved version' }),
    ).not.toBeInTheDocument()
  })

  it('saves an existing Implementation and replaces previews with canonical projections', async () => {
    const user = userEvent.setup()
    const saved = {
      ...billOfMaterialsDetailFixture(),
      kind: 'implementation' as const,
      name: 'Jackie - Showroom',
      product: {
        id: 'P-JACKIE',
        name: 'Jackie',
        availability: 'available' as const,
      },
      productVariant: {
        id: 'PV-JACKIE',
        name: 'Jackie Showroom',
        availability: 'available' as const,
      },
    }
    const canonical = {
      ...saved,
      description: 'Updated construction context',
      updatedAt: '2026-09-08T13:00:00.000Z',
      lines: saved.lines.map((line) => ({
        ...line,
        material: {
          ...line.material!,
          preferredSource: {
            ...line.material!.preferredSource!,
            landedUnitCostCents: 5000,
          },
        },
        costProjection: { amountCents: 15625, exclusionReason: null },
      })),
      costProjection: {
        availability: 'complete' as const,
        amountCents: 15625,
        excludedLineCount: 0,
      },
    }
    const putBodies: unknown[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials: [saved] })
      }
      if (
        url.pathname === `/bills-of-materials/${saved.id}` &&
        init?.method === 'GET'
      ) {
        return jsonResponse(saved)
      }
      if (
        url.pathname === `/bills-of-materials/${saved.id}` &&
        init?.method === 'PUT'
      ) {
        putBodies.push(JSON.parse(String(init.body)))
        return jsonResponse(canonical)
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText(saved.name)
    await user.click(
      screen.getByRole('button', { name: `Actions for ${saved.name}` }),
    )
    await user.click(
      screen.getByRole('menuitem', { name: 'Edit Bill of Materials' }),
    )
    expect(await screen.findByText('Jackie Showroom')).toBeInTheDocument()
    expect(
      screen.getByText(/Fixed for this Implementation/),
    ).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Description'))
    await user.type(
      screen.getByLabelText('Description'),
      'Updated construction context',
    )
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    await waitFor(() => expect(putBodies).toHaveLength(1))
    expect(putBodies[0]).not.toHaveProperty('kind')
    expect(putBodies[0]).not.toHaveProperty('productVariantId')
    expect(await screen.findAllByText('$156.25')).toHaveLength(2)
    expect(screen.queryByText('$131.25')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Description')).toHaveValue(
      'Updated construction context',
    )
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
    expect(within(row).getByText('Jackie').closest('p')).toHaveTextContent(
      'Jackie · P-JACKIE',
    )
    expect(within(row).queryByText(/Available/)).not.toBeInTheDocument()
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
      screen.getByRole('menuitem', { name: /BOM Implementation/ }),
    ).toBeInTheDocument()
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
    expect(within(row).getByText('Jackie').closest('p')).toHaveTextContent(
      'Jackie · P-JACKIE',
    )
    expect(within(row).queryByText(/Available/)).not.toBeInTheDocument()
    await user.click(
      within(row).getByRole('button', {
        name: 'Actions for Jackie base construction',
      }),
    )
    expect(
      screen.queryByRole('menuitem', { name: 'Associate Product' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: 'Edit Bill of Materials' }),
    ).toBeInTheDocument()
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
          patternSetId: null,
          lineNote: 'Cut on grain',
          verified: false,
        },
        {
          constructionPiece: 'Outer skirt',
          materialId: 'M-0001',
          materialQuantity: 1.234,
          patternSetId: null,
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

  it('selects Pattern Sets and explicitly copies proposal evidence into Final meters', async () => {
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
      if (url.pathname === '/pattern-sets/search') {
        return jsonResponse({
          items: [
            {
              id: 'PS-SKRT23',
              name: 'Skirt patterns',
              quantityProposalCount: 2,
            },
          ],
          hasMore: false,
        })
      }
      if (url.pathname === '/pattern-sets/PS-SKRT23') {
        return jsonResponse(patternSetFixture())
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
    await user.type(screen.getByLabelText('BOM Name'), 'Pattern-aware skirt')
    await user.click(screen.getByRole('button', { name: 'Add BOM line' }))
    await user.type(screen.getByLabelText('Construction Piece'), 'Outer skirt')
    await user.click(screen.getByRole('combobox', { name: 'Choose Material' }))
    await user.type(screen.getByLabelText('Search Material'), 'silk')
    await user.click(
      await screen.findByRole('button', { name: /Ivory Silk Crepe M-0001/i }),
    )
    await user.type(screen.getByLabelText('Final meters'), '3.125')
    await user.click(screen.getByLabelText('Manually verified'))

    await user.click(
      screen.getByRole('combobox', { name: 'Choose Pattern Set' }),
    )
    expect(
      screen.getByText('Type to search the Pattern Set catalog.'),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('Search Pattern Set'), 'skirt')
    await user.click(
      await screen.findByRole('button', {
        name: /Skirt patterns PS-SKRT23 2 proposals/i,
      }),
    )

    expect(screen.getByLabelText('Final meters')).toHaveValue(3.125)
    expect(screen.getByLabelText('Manually verified')).toBeChecked()
    await user.click(screen.getByRole('button', { name: '2 proposals' }))
    expect(await screen.findByText('Assumes 140 cm')).toBeInTheDocument()
    expect(screen.getByText('Marker study')).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', {
        name: 'Use proposed quantity 3.25 meters',
      }),
    )
    expect(screen.getByLabelText('Final meters')).toHaveValue(3.25)
    expect(screen.getByLabelText('Manually verified')).not.toBeChecked()

    await user.click(screen.getByLabelText('Manually verified'))
    await user.click(
      screen.getByRole('combobox', { name: 'Choose Pattern Set' }),
    )
    await user.click(screen.getByRole('button', { name: 'No Pattern Set' }))
    expect(screen.getByLabelText('Final meters')).toHaveValue(3.25)
    expect(screen.getByLabelText('Manually verified')).toBeChecked()

    await user.click(
      screen.getByRole('combobox', { name: 'Choose Pattern Set' }),
    )
    await user.type(screen.getByLabelText('Search Pattern Set'), 'skirt')
    await user.click(
      await screen.findByRole('button', {
        name: /Skirt patterns PS-SKRT23 2 proposals/i,
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    await waitFor(() => expect(postedBodies).toHaveLength(1))
    expect(postedBodies[0]).toMatchObject({
      lines: [
        {
          materialQuantity: 3.25,
          patternSetId: 'PS-SKRT23',
          verified: true,
        },
      ],
    })
  })

  it('keeps a stale Pattern Set rejection on its field without discarding the draft', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = new URL(String(input))
      if (url.pathname === '/auth/me') return jsonResponse(sessionFixture())
      if (url.pathname === '/bills-of-materials' && init?.method === 'GET') {
        return jsonResponse({ billsOfMaterials: [] })
      }
      if (url.pathname === '/pattern-sets/search') {
        return jsonResponse({
          items: [
            {
              id: 'PS-SKRT23',
              name: 'Skirt patterns',
              quantityProposalCount: 2,
            },
          ],
          hasMore: false,
        })
      }
      if (url.pathname === '/bills-of-materials' && init?.method === 'POST') {
        return jsonResponse(
          {
            errors: {
              'lines.0.patternSetId': [
                'The selected Pattern Set is no longer available.',
              ],
            },
          },
          { status: 422 },
        )
      }
      throw new Error(`Unexpected request: ${url.pathname}`)
    })

    seedStoredSession()
    renderBillsOfMaterialsRoute()
    await screen.findByText('No Bills of Materials registered yet.')
    await user.click(screen.getByRole('button', { name: 'Create BOM' }))
    await user.click(screen.getByRole('menuitem', { name: /BOM Template/ }))
    await user.type(screen.getByLabelText('BOM Name'), 'Preserved draft')
    await user.click(screen.getByRole('button', { name: 'Add BOM line' }))
    await user.type(screen.getByLabelText('Construction Piece'), 'Outer skirt')
    await user.click(
      screen.getByRole('combobox', { name: 'Choose Pattern Set' }),
    )
    await user.type(screen.getByLabelText('Search Pattern Set'), 'skirt')
    await user.click(
      await screen.findByRole('button', {
        name: /Skirt patterns PS-SKRT23 2 proposals/i,
      }),
    )
    await user.click(screen.getByRole('button', { name: 'Save BOM' }))

    expect(
      await screen.findByText(
        'The selected Pattern Set is no longer available.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('BOM Name')).toHaveValue('Preserved draft')
    expect(
      screen.getByRole('combobox', { name: 'Choose Pattern Set' }),
    ).toHaveTextContent('Skirt patterns')
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

function renderBillsOfMaterialsRoute(initialEntry = '/app/bills-of-materials') {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [initialEntry],
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
    productVariant: null,
    origin: null,
    createdBy: { id: 1, email: 'operator@example.com' },
    createdAt: '2026-09-08T12:00:00.000Z',
    updatedAt: '2026-09-08T12:00:00.000Z',
    attentionCount: 0,
  }
}

function billOfMaterialsDetailFixture() {
  return {
    ...billOfMaterialsFixture(),
    lines: [
      {
        id: 'BML-SKRT23',
        constructionPiece: 'Outer skirt',
        material: {
          id: 'M-0001',
          name: 'Ivory Silk Crepe',
          preferredSource: {
            id: 'S-0001',
            name: 'Italian Silk Crepe',
            vendor: 'Casa Tessile',
            vendorShadeOrDetail: 'Ivory 100',
            widthCentimeters: 140,
            landedUnitCostCents: 4200,
          },
        },
        materialQuantity: 3.125,
        patternSet: null,
        lineNote: 'Cut on grain',
        order: 0,
        completeness: 'complete' as const,
        verification: {
          status: 'verified' as const,
          verifiedBy: { id: 1, email: 'operator@example.com' },
          verifiedAt: '2026-09-08T12:00:00.000Z',
        },
        attention: [],
        costProjection: { amountCents: 13125, exclusionReason: null },
      },
    ],
    costProjection: {
      availability: 'complete' as const,
      amountCents: 13125,
      excludedLineCount: 0,
    },
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

function patternSetFixture() {
  return {
    id: 'PS-SKRT23',
    name: 'Skirt patterns',
    description: 'Floor-length configuration',
    status: 'active' as const,
    quantityProposals: [
      {
        assumedWidthCm: 140,
        quantityMeters: 3.25,
        evidenceNote: 'Marker study',
      },
      {
        assumedWidthCm: 150,
        quantityMeters: 2.875,
        evidenceNote: null,
      },
    ],
    createdBy: { id: 1, email: 'operator@example.com' },
    createdAt: '2026-09-08T15:00:00.000Z',
  }
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
