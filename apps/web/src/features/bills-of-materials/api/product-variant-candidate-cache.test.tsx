import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useProductVariants } from '@/features/products/api/product-variants'
import { createQueryClientWrapper } from '@/test/query-client-wrapper'
import {
  useAssociateBillOfMaterialsTemplateProduct,
  useApplyBillOfMaterialsTemplate,
  useCreateBillOfMaterials,
  useDeleteBillOfMaterials,
  useProductVariantCandidates,
  useRestoreBillOfMaterials,
  useUpdateBillOfMaterials,
} from './bills-of-materials'
import {
  associateBillOfMaterialsTemplateProduct,
  applyBillOfMaterialsTemplate,
  createBillOfMaterials,
  deleteBillOfMaterials,
  restoreBillOfMaterials,
  updateBillOfMaterials,
} from './endpoints'

vi.mock('./endpoints', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./endpoints')>()
  return {
    ...actual,
    associateBillOfMaterialsTemplateProduct: vi.fn(),
    applyBillOfMaterialsTemplate: vi.fn(),
    createBillOfMaterials: vi.fn(),
    deleteBillOfMaterials: vi.fn(),
    restoreBillOfMaterials: vi.fn(),
    updateBillOfMaterials: vi.fn(),
  }
})

describe('Product Variant candidate cache', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('refetches active candidate searches after a Product Variant mutation', async () => {
    const candidateRequests: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.includes('/product-variant-candidates')) {
        candidateRequests.push(url)
        return new Response(JSON.stringify({ items: [], hasMore: false }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      expect(init?.method).toBe('POST')
      return new Response(
        JSON.stringify({
          id: 'PV-JACKIE',
          productId: 'P-JACKIE',
          name: 'Jackie',
          status: 'active',
          deletedAt: null,
          createdAt: '2026-09-15T12:00:00.000Z',
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 201 },
      )
    })
    const { result } = renderHook(
      () => ({
        candidates: useProductVariantCandidates('token', 'jackie'),
        variants: useProductVariants('token', 'P-JACKIE', false, false),
      }),
      { wrapper: createQueryClientWrapper() },
    )

    await waitFor(() => expect(result.current.candidates.isSuccess).toBe(true))
    expect(candidateRequests).toHaveLength(1)

    await act(() =>
      result.current.variants.saveVariant({
        currentVariant: null,
        values: { name: 'Jackie', status: 'active' },
      }),
    )

    await waitFor(() => expect(candidateRequests).toHaveLength(2))
  })

  it('refetches active candidate searches after an Implementation update', async () => {
    const candidateRequests: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      candidateRequests.push(String(input))
      return new Response(JSON.stringify({ items: [], hasMore: false }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    })
    vi.mocked(updateBillOfMaterials).mockResolvedValue(
      {} as Awaited<ReturnType<typeof updateBillOfMaterials>>,
    )
    const { result } = renderHook(
      () => ({
        candidates: useProductVariantCandidates('token', 'jackie'),
        implementation: useUpdateBillOfMaterials('token', 'BOM-JACK2'),
      }),
      { wrapper: createQueryClientWrapper() },
    )

    await waitFor(() => expect(result.current.candidates.isSuccess).toBe(true))
    expect(candidateRequests).toHaveLength(1)

    await act(() =>
      result.current.implementation.updateBillOfMaterials({
        updatedAt: '2026-09-15T12:00:00.000Z',
        name: 'Renamed construction',
        description: null,
        lines: [],
      }),
    )

    await waitFor(() => expect(candidateRequests).toHaveLength(2))
  })

  it('does not reuse an identical candidate search across sessions', async () => {
    const candidateRequests: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      candidateRequests.push(String(input))
      return new Response(JSON.stringify({ items: [], hasMore: false }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    })
    const { result, rerender } = renderHook(
      ({ token }) => useProductVariantCandidates(token, 'jackie'),
      {
        initialProps: { token: 'first-session' },
        wrapper: createQueryClientWrapper(),
      },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    rerender({ token: 'second-session' })

    await waitFor(() => expect(candidateRequests).toHaveLength(2))
  })

  it('refreshes candidates after every candidate-affecting BOM mutation', async () => {
    const candidateRequests: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      candidateRequests.push(String(input))
      return new Response(JSON.stringify({ items: [], hasMore: false }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    })
    vi.mocked(deleteBillOfMaterials).mockResolvedValue()
    vi.mocked(restoreBillOfMaterials).mockResolvedValue(
      {} as Awaited<ReturnType<typeof restoreBillOfMaterials>>,
    )
    vi.mocked(createBillOfMaterials).mockResolvedValue(
      {} as Awaited<ReturnType<typeof createBillOfMaterials>>,
    )
    vi.mocked(applyBillOfMaterialsTemplate).mockResolvedValue(
      {} as Awaited<ReturnType<typeof applyBillOfMaterialsTemplate>>,
    )
    vi.mocked(associateBillOfMaterialsTemplateProduct).mockResolvedValue(
      {} as Awaited<ReturnType<typeof associateBillOfMaterialsTemplateProduct>>,
    )
    const { result } = renderHook(
      () => ({
        candidates: useProductVariantCandidates('token', 'jackie'),
        create: useCreateBillOfMaterials('token'),
        delete: useDeleteBillOfMaterials('token'),
        restore: useRestoreBillOfMaterials('token'),
        apply: useApplyBillOfMaterialsTemplate('token', 'BOM-TEMP24'),
        associate: useAssociateBillOfMaterialsTemplateProduct(
          'token',
          'BOM-TEMP24',
        ),
      }),
      { wrapper: createQueryClientWrapper() },
    )

    await waitFor(() => expect(result.current.candidates.isSuccess).toBe(true))
    expect(candidateRequests).toHaveLength(1)

    await act(() => result.current.delete.deleteBillOfMaterials('BOM-IMPL24'))
    await waitFor(() => expect(candidateRequests).toHaveLength(2))
    await act(() => result.current.restore.restoreBillOfMaterials('BOM-IMPL24'))
    await waitFor(() => expect(candidateRequests).toHaveLength(3))
    await act(() =>
      result.current.create.createBillOfMaterials({
        kind: 'implementation',
        name: 'Manual construction',
        description: null,
        productVariantId: 'PV-JACKIE',
        lines: [],
      }),
    )
    await waitFor(() => expect(candidateRequests).toHaveLength(4))
    await act(() =>
      result.current.apply.applyTemplate({
        name: 'Applied construction',
        productVariantId: 'PV-JACKIE',
      }),
    )
    await waitFor(() => expect(candidateRequests).toHaveLength(5))
    await act(() =>
      result.current.associate.associateProduct({ productId: 'P-JACKIE' }),
    )
    await waitFor(() => expect(candidateRequests).toHaveLength(6))
  })
})
