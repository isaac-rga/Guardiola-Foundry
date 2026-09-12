import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
})

it('lists deleted Bills of Materials from the same origin when no API base URL is set', async () => {
  vi.stubEnv('VITE_API_URL', '')
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ billsOfMaterials: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  const { listBillsOfMaterials } = await import('./endpoints')

  await expect(listBillsOfMaterials('session-token', true)).resolves.toEqual({
    billsOfMaterials: [],
  })
  expect(fetchSpy).toHaveBeenCalledWith(
    `${window.location.origin}/bills-of-materials?includeDeleted=true`,
    expect.objectContaining({ method: 'GET' }),
  )
})
