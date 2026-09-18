import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('lists a filtered Bills of Materials catalog from the same origin when no API base URL is set', async () => {
  vi.stubEnv('VITE_API_URL', '')
  const body = {
    billsOfMaterials: [],
    summary: {
      totalAvailable: 0,
      templateCount: 0,
      implementationCount: 0,
      withoutProductVariantCount: 0,
      withUnverifiedLinesCount: 0,
    },
  }
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  const { listBillsOfMaterials } = await import('./endpoints')

  await expect(
    listBillsOfMaterials('session-token', {
      search: 'Jackie',
      kind: 'implementation',
      includeDeleted: true,
    }),
  ).resolves.toEqual(body)
  expect(fetchSpy).toHaveBeenCalledWith(
    `${window.location.origin}/bills-of-materials?search=Jackie&kind=implementation&includeDeleted=true`,
    expect.objectContaining({ method: 'GET' }),
  )
})
