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
        name: /create|edit|retire|restore/i,
      }),
    ).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Close' }))

    await waitFor(() => expect(router.state.location.search).toEqual({}))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('links an existing Active Source with an optional Vendor Shade and keeps Source creation outside the Dialog', async () => {
    const user = userEvent.setup()
    let linked = false
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse()
      if (url.endsWith('/materials') && init?.method === 'GET') {
        return jsonResponse(materialsListResponse())
      }
      if (url.endsWith('/materials/M-0001') && init?.method === 'GET') {
        return jsonResponse(linked ? materialDetailWithNewAlternateResponse() : materialDetailResponse())
      }
      if (url.endsWith('/sources') && init?.method === 'GET') {
        return jsonResponse({ sources: [eligibleSourceSummary()] })
      }
      if (url.endsWith('/sources/S-0004') && init?.method === 'GET') {
        return jsonResponse(eligibleSourceDetailResponse())
      }
      if (url.endsWith('/materials/M-0001/sources') && init?.method === 'POST') {
        expect(JSON.parse(String(init.body))).toEqual({ sourceId: 'S-0004', vendorShadeId: 41 })
        linked = true
        return jsonResponse(materialDetailWithNewAlternateResponse(), { status: 201 })
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession()
    renderMaterialsRoute('/app/materials?materialId=M-0001')

    const dialog = await screen.findByRole('dialog', { name: 'Ivory Silk Crepe' })
    await user.click(within(dialog).getByRole('button', { name: 'Link existing Source' }))
    await user.click(await within(dialog).findByRole('combobox', { name: 'Source' }))
    await user.click(await screen.findByRole('option', { name: 'White Chantilly Lace · Dentelle House' }))
    await user.click(await within(dialog).findByRole('combobox', { name: 'Vendor Shade' }))
    await user.click(await screen.findByRole('option', { name: 'White 41' }))
    await user.click(within(dialog).getByRole('button', { name: 'Link Source' }))

    expect(await within(dialog).findByText('White Chantilly Lace')).toBeInTheDocument()
    expect(within(dialog).getByText('Vendor Shade: White 41')).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /create source/i })).not.toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3333/materials/M-0001/sources',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('requires confirmation before unlinking an alternate and directs Preferred changes to replacement', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    let unlinked = false
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse()
      if (url.endsWith('/materials') && init?.method === 'GET') {
        return jsonResponse(materialsListResponse())
      }
      if (url.endsWith('/materials/M-0001') && init?.method === 'GET') {
        return jsonResponse(
          unlinked
            ? materialDetailWithoutActiveAlternateResponse()
            : materialDetailResponse(),
        )
      }
      if (url.endsWith('/materials/M-0001/sources/S-0002') && init?.method === 'DELETE') {
        unlinked = true
        return jsonResponse(materialDetailWithoutActiveAlternateResponse())
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession()
    renderMaterialsRoute('/app/materials?materialId=M-0001')

    const dialog = await screen.findByRole('dialog', { name: 'Ivory Silk Crepe' })
    expect(within(dialog).getByText('Replace the Preferred Source before unlinking it.')).toBeInTheDocument()

    const unlinkButton = within(dialog).getByRole('button', { name: 'Unlink Ivory Crepe Backup' })
    await user.click(unlinkButton)
    expect(confirmSpy).toHaveBeenCalledWith(
      'Unlink Ivory Crepe Backup from Ivory Silk Crepe? The Source will remain in the catalog.',
    )
    expect(fetchSpy).not.toHaveBeenCalledWith(
      'http://localhost:3333/materials/M-0001/sources/S-0002',
      expect.objectContaining({ method: 'DELETE' }),
    )

    await user.click(unlinkButton)
    await waitFor(() =>
      expect(within(dialog).queryByText('Ivory Crepe Backup')).not.toBeInTheDocument(),
    )
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3333/materials/M-0001/sources/S-0002',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('replaces the Preferred Source, refreshes Material cost and Source catalog state, and keeps the Dialog open', async () => {
    const user = userEvent.setup()
    let replaced = false
    let sourceListRequests = 0
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse()
      if (url.endsWith('/materials') && init?.method === 'GET') {
        return jsonResponse(replaced ? materialsListAfterReplacementResponse() : materialsListResponse())
      }
      if (url.endsWith('/materials/M-0001') && init?.method === 'GET') {
        return jsonResponse(replaced ? materialDetailAfterReplacementResponse() : materialDetailResponse())
      }
      if (url.endsWith('/sources') && init?.method === 'GET') {
        sourceListRequests += 1
        return jsonResponse({ sources: [eligibleSourceSummary()] })
      }
      if (url.endsWith('/materials/M-0001/preferred-source') && init?.method === 'PUT') {
        expect(JSON.parse(String(init.body))).toEqual({ sourceId: 'S-0002' })
        replaced = true
        return jsonResponse(materialDetailAfterReplacementResponse())
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession()
    renderMaterialsRoute('/app/materials?materialId=M-0001')

    const dialog = await screen.findByRole('dialog', { name: 'Ivory Silk Crepe' })
    await user.click(within(dialog).getByRole('button', { name: 'Link existing Source' }))
    await waitFor(() => expect(sourceListRequests).toBe(1))
    await user.click(within(dialog).getByRole('button', { name: 'Make Ivory Crepe Backup Preferred' }))

    await waitFor(() => {
      expect(within(dialog).getByRole('region', { name: 'Preferred Source' })).toHaveTextContent(
        'Ivory Crepe Backup',
      )
      expect(sourceListRequests).toBe(2)
    })
    const materialRow = within(screen.getByRole('table', { hidden: true })).getByRole('row', {
      name: /M-0001 Ivory Silk Crepe/,
      hidden: true,
    })
    expect(materialRow).toHaveTextContent('$39.00 / meter')
    expect(materialRow).toHaveTextContent('1')
    expect(dialog).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:3333/materials/M-0001/preferred-source',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('visibly disables Preferred replacement when an alternate lacks Landed Unit Cost', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse()
      if (url.endsWith('/materials') && init?.method === 'GET') {
        return jsonResponse(materialsListResponse())
      }
      if (url.endsWith('/materials/M-0001') && init?.method === 'GET') {
        return jsonResponse(materialDetailWithMissingCostAlternateResponse())
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession()
    renderMaterialsRoute('/app/materials?materialId=M-0001')

    const dialog = await screen.findByRole('dialog', { name: 'Ivory Silk Crepe' })
    expect(within(dialog).getByRole('button', { name: 'Make Budget Crepe Preferred' })).toBeDisabled()
    expect(within(dialog).getByText('Landed Unit Cost required')).toBeInTheDocument()
  })

  it('keeps the Dialog open and explains a Preferred replacement failure', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse()
      if (url.endsWith('/materials') && init?.method === 'GET') {
        return jsonResponse(materialsListResponse())
      }
      if (url.endsWith('/materials/M-0001') && init?.method === 'GET') {
        return jsonResponse(materialDetailResponse())
      }
      if (url.endsWith('/materials/M-0001/preferred-source') && init?.method === 'PUT') {
        return jsonResponse(
          { message: 'Preferred Source could not be replaced. Please try again.' },
          { status: 409 },
        )
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession()
    renderMaterialsRoute('/app/materials?materialId=M-0001')

    const dialog = await screen.findByRole('dialog', { name: 'Ivory Silk Crepe' })
    await user.click(within(dialog).getByRole('button', { name: 'Make Ivory Crepe Backup Preferred' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Preferred Source could not be replaced. Please try again.',
    )
    expect(within(dialog).getByRole('region', { name: 'Preferred Source' })).toHaveTextContent(
      'Italian Silk Crepe',
    )
    expect(dialog).toBeInTheDocument()
  })

  it.each([
    ['link', 'This Source is already linked to the Material.'],
    ['unlink', 'Material relationship service unavailable.'],
  ])('keeps the Dialog open and explains a %s failure', async (operation, message) => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/auth/me')) return sessionResponse()
      if (url.endsWith('/materials') && init?.method === 'GET') {
        return jsonResponse(materialsListResponse())
      }
      if (url.endsWith('/materials/M-0001') && init?.method === 'GET') {
        return jsonResponse(materialDetailResponse())
      }
      if (url.endsWith('/sources') && init?.method === 'GET') {
        return jsonResponse({ sources: [eligibleSourceSummary()] })
      }
      if (url.endsWith('/sources/S-0004') && init?.method === 'GET') {
        return jsonResponse(eligibleSourceDetailResponse())
      }
      if (url.endsWith('/materials/M-0001/sources') && init?.method === 'POST') {
        return jsonResponse({ message }, { status: 409 })
      }
      if (url.endsWith('/materials/M-0001/sources/S-0002') && init?.method === 'DELETE') {
        return jsonResponse({ message }, { status: 503 })
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    seedStoredSession()
    renderMaterialsRoute('/app/materials?materialId=M-0001')

    const dialog = await screen.findByRole('dialog', { name: 'Ivory Silk Crepe' })
    if (operation === 'link') {
      await user.click(within(dialog).getByRole('button', { name: 'Link existing Source' }))
      await user.click(await within(dialog).findByRole('combobox', { name: 'Source' }))
      await user.click(await screen.findByRole('option', { name: 'White Chantilly Lace · Dentelle House' }))
      await user.click(within(dialog).getByRole('button', { name: 'Link Source' }))
    } else {
      await user.click(within(dialog).getByRole('button', { name: 'Unlink Ivory Crepe Backup' }))
    }

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(message)
    expect(dialog).toBeInTheDocument()
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
          preferredEligibility: 'already-preferred',
          vendorShade: { id: 1, nameOrCode: 'Ivory 100' },
        },
        {
          id: 'S-0002',
          name: 'Ivory Crepe Backup',
          vendor: 'Milan Textiles',
          relationship: 'alternate',
          relationshipStatus: 'active',
          preferredEligibility: 'eligible',
          vendorShade: null,
        },
        {
          id: 'S-0003',
          name: 'Retired Crepe',
          vendor: 'Archive Textiles',
          relationship: 'alternate',
          relationshipStatus: 'historical',
          preferredEligibility: 'source-not-active',
          vendorShade: null,
        },
      ],
    },
  }
}

function materialDetailWithNewAlternateResponse() {
  const response = materialDetailResponse()
  response.material.sourceRelationships.push({
    id: 'S-0004',
    name: 'White Chantilly Lace',
    vendor: 'Dentelle House',
    relationship: 'alternate',
    relationshipStatus: 'active',
    preferredEligibility: 'eligible',
    vendorShade: { id: 41, nameOrCode: 'White 41' },
  })
  return response
}

function materialDetailAfterReplacementResponse() {
  const response = materialDetailResponse()
  const [preferred, alternate, historical] = response.material.sourceRelationships

  response.material.sourceRelationships = [
    {
      ...alternate,
      relationship: 'preferred',
      preferredEligibility: 'already-preferred',
    },
    {
      ...preferred,
      relationship: 'alternate',
      preferredEligibility: 'eligible',
    },
    historical,
  ]
  return response
}

function materialsListAfterReplacementResponse() {
  const response = materialsListResponse()
  response.materials[0].preferredSource = {
    id: 'S-0002',
    name: 'Ivory Crepe Backup',
    provider: 'Milan Textiles',
    normalizedUnitCostCents: 3900,
    normalizedUnit: 'meter',
    needsAttention: false,
  }
  response.materials[0].derivedUnitCostCents = 3900
  response.materials[0].alternateSourceCount = 1
  return response
}

function materialDetailWithMissingCostAlternateResponse() {
  const response = materialDetailResponse()
  response.material.sourceRelationships.push({
    id: 'S-0005',
    name: 'Budget Crepe',
    vendor: 'Pending Cost Textiles',
    relationship: 'alternate',
    relationshipStatus: 'active',
    preferredEligibility: 'missing-landed-unit-cost',
    vendorShade: null,
  })
  return response
}

function materialDetailWithoutActiveAlternateResponse() {
  const response = materialDetailResponse()
  response.material.sourceRelationships = response.material.sourceRelationships.filter(
    (source) => source.id !== 'S-0002',
  )
  return response
}

function eligibleSourceSummary() {
  return {
    id: 'S-0004',
    name: 'White Chantilly Lace',
    vendor: 'Dentelle House',
    textileFamily: 'Encaje',
    purchasePresentation: 'roll',
    purchaseUnit: 'yard',
    vendorCurrency: 'USD',
    purchasePriceCents: 6800,
    landedUnitCostCents: 7600,
    linkedMaterialCount: 0,
    costNeedsAttention: false,
    dataNeedsAttention: true,
  }
}

function eligibleSourceDetailResponse() {
  return {
    source: {
      id: 'S-0004',
      legacySourceId: 'SRC-300',
      name: 'White Chantilly Lace',
      vendor: 'Dentelle House',
      textileFamily: 'Encaje',
      purchasePresentation: 'roll',
      fixedPieceLength: null,
      purchaseUnit: 'yard',
      minimumPurchaseQuantity: 1,
      purchasePriceCents: 6800,
      priceDate: '2026-07-01',
      vendorCurrency: 'USD',
      landedUnitCostCents: 7600,
      sourceStatus: 'active',
      normalizedUnit: 'meter',
      vendorSku: null,
      url: null,
      description: null,
      manufacturer: null,
      fiber: null,
      composition: null,
      gsmGramsPerSquareMeter: null,
      widthCentimeters: null,
      finish: null,
      weave: null,
      presentationNotes: null,
      countryOfOrigin: null,
      comments: null,
      estimatedShippingUsdPerKilogramCents: null,
      igiPercentage: null,
      ivaPercentage: 16,
      costNeedsAttention: false,
      dataNeedsAttention: true,
      vendorShades: [{ id: 41, nameOrCode: 'White 41' }],
      linkedMaterials: [],
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
