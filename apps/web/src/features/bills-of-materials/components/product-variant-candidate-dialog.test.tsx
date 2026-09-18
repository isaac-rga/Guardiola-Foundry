import type { QueryClient } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createQueryClientWrapper,
  createTestQueryClient,
} from '@/test/query-client-wrapper'
import { ProductVariantCandidateDialog } from './product-variant-candidate-dialog'

describe('ProductVariantCandidateDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('carries Product identity when searching in Product context', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ items: [], hasMore: false }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )

    renderDialog({ productId: 'P-JACKIE' })
    await user.type(
      screen.getByRole('textbox', { name: 'Search Product Variants' }),
      '  Shówroom   ',
    )

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
    const requestUrl = new URL(String(fetchSpy.mock.calls[0][0]))
    expect(requestUrl.searchParams.get('productId')).toBe('P-JACKIE')
    expect(requestUrl.searchParams.get('search')).toBe('showroom')
  })

  it('announces an ineligible reason only while the dialog remains open', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 'PV-OCCUP2',
              name: 'Jackie Editorial',
              status: 'active',
              product: {
                id: 'P-JACKIE',
                name: 'Jackie',
                availability: 'available',
              },
              selectable: false,
              outcome: 'implementation-exists',
              existingImplementation: {
                id: 'BOM-USED24',
                name: 'Existing construction',
              },
            },
          ],
          hasMore: false,
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 },
      ),
    )

    renderDialogHarness(onSelect)
    await user.click(
      screen.getByRole('button', { name: 'Open Product Variant picker' }),
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Search Product Variants' }),
      'editorial',
    )
    const candidate = await screen.findByRole('button', {
      name: /Jackie Editorial.*Existing construction.*BOM-USED24/i,
    })

    expect(candidate).toHaveAttribute('aria-disabled', 'true')
    expect(candidate).not.toBeDisabled()
    await user.click(candidate)

    expect(onSelect).not.toHaveBeenCalled()
    expect(
      screen.getByRole('heading', { name: 'Select a Product Variant' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Existing Implementation: Existing construction · BOM-USED24',
    )
    expect(screen.getAllByRole('status', { hidden: true })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Close' }))

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Select a Product Variant' }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.queryAllByRole('status', { hidden: true })).toHaveLength(0)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('closes after an eligible choice, restores trigger focus, and announces the selection', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: 'PV-JACKIE',
              name: 'Jackie Showroom',
              status: 'active',
              product: {
                id: 'P-JACKIE',
                name: 'Jackie',
                availability: 'available',
              },
              selectable: true,
              outcome: 'eligible',
              existingImplementation: null,
            },
          ],
          hasMore: false,
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 },
      ),
    )

    let statusAtSelectionCallback = ''
    const onSelect = vi.fn(() => {
      statusAtSelectionCallback = screen.getByRole('status').textContent ?? ''
    })
    renderDialogHarness(onSelect)
    const trigger = screen.getByRole('button', {
      name: 'Open Product Variant picker',
    })
    const focusSpy = vi.spyOn(trigger, 'focus')
    expect(screen.queryAllByRole('status', { hidden: true })).toHaveLength(0)
    await user.click(trigger)
    await user.type(
      screen.getByRole('textbox', { name: 'Search Product Variants' }),
      'showroom',
    )
    expect(screen.getAllByRole('status', { hidden: true })).toHaveLength(1)
    await user.click(
      await screen.findByRole('button', {
        name: /Jackie Showroom.*PV-JACKIE/i,
      }),
    )

    await waitFor(() => expect(trigger).toHaveFocus())
    expect(
      screen.queryByRole('heading', { name: 'Select a Product Variant' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Jackie Showroom selected.',
    )
    expect(screen.getAllByRole('status', { hidden: true })).toHaveLength(1)
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.invocationCallOrder[0]).toBeGreaterThan(
      focusSpy.mock.invocationCallOrder.at(-1)!,
    )
    expect(statusAtSelectionCallback).toContain('Jackie Showroom selected.')
  })

  it('retries recoverable failures but leaves authentication and authorization to the session flow', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const search = new URL(String(input)).searchParams.get('search')
      if (search === 'recoverable') {
        return errorResponse(
          'Candidate search is temporarily unavailable.',
          500,
        )
      }
      if (search === 'authentication') {
        return errorResponse('Authentication required.', 401)
      }
      return errorResponse('Candidate search is not allowed.', 403)
    })

    renderDialog()
    const input = screen.getByRole('textbox', {
      name: 'Search Product Variants',
    })
    await user.type(input, 'recoverable')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Candidate search is temporarily unavailable.',
    )
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'authentication')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Authentication required.',
    )
    expect(
      screen.queryByRole('button', { name: 'Try again' }),
    ).not.toBeInTheDocument()
    expect(input).toHaveValue('authentication')

    await user.clear(input)
    await user.type(input, 'authorization')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Candidate search is not allowed.',
    )
    expect(
      screen.queryByRole('button', { name: 'Try again' }),
    ).not.toBeInTheDocument()
    expect(input).toHaveValue('authorization')
  })

  it('announces empty and bounded result states without losing the query', async () => {
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const search = new URL(String(input)).searchParams.get('search')
      return candidateResponse(
        search === 'empty' ? [] : [eligibleCandidate('PV-JACKIE', 'Jackie')],
        search === 'many',
      )
    })

    renderDialog()
    const input = screen.getByRole('textbox', {
      name: 'Search Product Variants',
    })
    await user.type(input, 'empty')
    expect(
      await screen.findByText(/No matches for “empty”/),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'No Product Variant matches.',
    )

    await user.clear(input)
    await user.type(input, 'many')
    expect(
      await screen.findByText('More matches exist. Refine your search.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 Product Variant results. More matches exist.',
    )
    expect(input).toHaveValue('many')
  })

  it('ignores a superseded response and returns to idle when the query is cleared', async () => {
    const user = userEvent.setup()
    const requests = new Map<
      string,
      { resolve: (response: Response) => void; signal: AbortSignal }
    >()
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (input, init) =>
        new Promise((resolve) => {
          requests.set(new URL(String(input)).searchParams.get('search')!, {
            resolve,
            signal: init?.signal as AbortSignal,
          })
        }),
    )

    renderDialog()
    const input = screen.getByRole('textbox', {
      name: 'Search Product Variants',
    })
    await user.type(input, 'first')
    await waitFor(() => expect(requests.has('first')).toBe(true))
    expect(
      screen.getByText('Searching Product Variants...'),
    ).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'second')
    await waitFor(() => expect(requests.has('second')).toBe(true))
    expect(requests.get('first')?.signal.aborted).toBe(true)
    requests
      .get('second')
      ?.resolve(candidateResponse([eligibleCandidate('PV-SECOND', 'Second')]))
    expect(
      await screen.findByRole('button', { name: /Second.*PV-SECOND/i }),
    ).toBeInTheDocument()
    requests
      .get('first')
      ?.resolve(candidateResponse([eligibleCandidate('PV-FIRST2', 'First')]))
    expect(
      screen.queryByRole('button', { name: /First.*PV-FIRST2/i }),
    ).not.toBeInTheDocument()

    await user.clear(input)
    expect(
      screen.getByText('Type to search Product Variants.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Second.*PV-SECOND/i }),
    ).not.toBeInTheDocument()
  })

  it('reuses an identical same-session search within the cache window', async () => {
    const user = userEvent.setup()
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        candidateResponse([eligibleCandidate('PV-JACKIE', 'Jackie')]),
      )

    renderDialogHarness()
    const trigger = screen.getByRole('button', {
      name: 'Open Product Variant picker',
    })
    await user.click(trigger)
    await user.type(
      screen.getByRole('textbox', { name: 'Search Product Variants' }),
      'jackie',
    )
    await user.click(
      await screen.findByRole('button', { name: /Jackie.*PV-JACKIE/i }),
    )

    await user.click(trigger)
    await user.type(
      screen.getByRole('textbox', { name: 'Search Product Variants' }),
      'jackie',
    )
    expect(
      await screen.findByRole('button', { name: /Jackie.*PV-JACKIE/i }),
    ).toBeInTheDocument()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('suppresses stale eligibility while an identical search refreshes', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const queryClient = createTestQueryClient()
    let requestCount = 0
    let resolveRefresh: (response: Response) => void = () => undefined
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      requestCount += 1
      if (requestCount === 1) {
        return candidateResponse([
          eligibleCandidate('PV-JACKIE', 'Jackie Showroom'),
        ])
      }
      return new Promise((resolve) => {
        resolveRefresh = resolve
      })
    })

    renderDialog({ onSelect, queryClient })
    await user.type(
      screen.getByRole('textbox', { name: 'Search Product Variants' }),
      'jackie',
    )
    expect(
      await screen.findByRole('button', {
        name: /Jackie Showroom.*PV-JACKIE/i,
      }),
    ).toBeInTheDocument()

    await act(async () => {
      void queryClient.invalidateQueries()
    })
    await waitFor(() => expect(requestCount).toBe(2))

    expect(
      screen.getByText('Searching Product Variants...'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: /Jackie Showroom.*PV-JACKIE/i,
      }),
    ).not.toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()

    await act(async () => {
      resolveRefresh(
        new Response(
          JSON.stringify({
            items: [
              {
                ...eligibleCandidate('PV-JACKIE', 'Jackie Showroom'),
                selectable: false,
                outcome: 'implementation-exists',
                existingImplementation: {
                  id: 'BOM-USED24',
                  name: 'Existing construction',
                },
              },
            ],
            hasMore: false,
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 200 },
        ),
      )
    })
    const refreshedCandidate = await screen.findByRole('button', {
      name: /Jackie Showroom.*Existing construction.*BOM-USED24/i,
    })
    await user.click(refreshedCandidate)

    expect(onSelect).not.toHaveBeenCalled()
  })
})

function renderDialog({
  onSelect = () => undefined,
  productId,
  queryClient,
}: {
  onSelect?: () => void
  productId?: string
  queryClient?: QueryClient
} = {}) {
  return render(
    <ProductVariantCandidateDialog
      open
      productId={productId}
      token="token"
      onOpenChange={() => undefined}
      onSelect={onSelect}
    />,
    { wrapper: createQueryClientWrapper(queryClient) },
  )
}

function renderDialogHarness(onSelect: () => void = () => undefined) {
  return render(<DialogHarness onSelect={onSelect} />, {
    wrapper: createQueryClientWrapper(),
  })
}

function DialogHarness({ onSelect }: { onSelect: () => void }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen(true)} type="button">
        Open Product Variant picker
      </button>
      <ProductVariantCandidateDialog
        open={open}
        returnFocusRef={triggerRef}
        token="token"
        onOpenChange={setOpen}
        onSelect={onSelect}
      />
    </>
  )
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ message }), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })
}

function candidateResponse(
  items: ReturnType<typeof eligibleCandidate>[],
  hasMore = false,
) {
  return new Response(JSON.stringify({ items, hasMore }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
}

function eligibleCandidate(id: string, name: string) {
  return {
    id,
    name,
    status: 'active',
    product: {
      id: 'P-JACKIE',
      name: 'Jackie',
      availability: 'available',
    },
    selectable: true,
    outcome: 'eligible',
    existingImplementation: null,
  } as const
}
