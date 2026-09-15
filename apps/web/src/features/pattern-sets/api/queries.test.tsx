import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { usePatternSets } from './queries'

describe('Pattern Set query cache', () => {
  afterEach(() => vi.restoreAllMocks())

  it('invalidates only Pattern Set searches after a Pattern Set mutation', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) =>
      init?.method === 'POST'
        ? jsonResponse({
            id: 'PS-SKRT23',
            name: 'Skirt patterns',
            description: null,
            status: 'active',
            quantityProposals: [],
            createdBy: { id: 1, email: 'operator@example.com' },
            createdAt: '2026-09-14T12:00:00.000Z',
          })
        : jsonResponse({ patternSets: [] }),
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
    const { result } = renderHook(() => usePatternSets('token', false), {
      wrapper: createWrapper(queryClient),
    })

    await act(() =>
      result.current.savePatternSet({
        current: null,
        values: {
          name: 'Skirt patterns',
          description: null,
          quantityProposals: [],
        },
      }),
    )

    expect(
      queryClient.getQueryState(['pattern-sets', 'search', 'skirt'])
        ?.isInvalidated,
    ).toBe(true)
    expect(
      queryClient.getQueryState(['materials', 'search', 'silk'])?.isInvalidated,
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
