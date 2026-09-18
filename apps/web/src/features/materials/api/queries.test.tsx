import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useMaterialSearch, useReplacePreferredSource } from './queries'

describe('Material query cache', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reuses an identical Material search within 30 seconds', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ items: [], hasMore: false }))
    const queryClient = createQueryClient()
    const wrapper = createWrapper(queryClient)

    const first = renderHook(() => useMaterialSearch('token', 'silk'), {
      wrapper,
    })
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true))
    first.unmount()
    const second = renderHook(() => useMaterialSearch('token', 'silk'), {
      wrapper,
    })
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true))

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('invalidates only Material searches after a Material relationship mutation', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({
        material: {
          id: 'M-0001',
          name: 'Silk',
          materialColor: 'ivory',
          materialUse: 'base-fabric',
          materialUnit: 'meter',
          comments: null,
          sourceRelationships: [],
        },
      }),
    )
    const queryClient = createQueryClient()
    queryClient.setQueryData(['materials', 'search', 'silk'], {
      items: [],
      hasMore: false,
    })
    queryClient.setQueryData(['pattern-sets', 'search', 'skirt'], {
      items: [],
      hasMore: false,
    })
    const { result } = renderHook(
      () => useReplacePreferredSource('token', 'M-0001'),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await act(() => result.current.mutateAsync({ sourceId: 'S-0002' }))

    expect(
      queryClient.getQueryState(['materials', 'search', 'silk'])?.isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryState(['pattern-sets', 'search', 'skirt'])
        ?.isInvalidated,
    ).toBe(false)
  })
})

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}
