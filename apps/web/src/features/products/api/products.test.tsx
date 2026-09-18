import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useProductVariantCandidates } from '@/features/bills-of-materials/api/bills-of-materials'
import { createQueryClientWrapper } from '@/test/query-client-wrapper'
import {
  deleteProduct,
  getProduct,
  listProducts,
  restoreProduct,
  updateProduct,
} from './endpoints'
import {
  useDeleteProduct,
  useProductDetail,
  useProductList,
  useRestoreProduct,
  useUpdateProduct,
} from './products'

vi.mock('./endpoints', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./endpoints')>()
  return {
    ...actual,
    deleteProduct: vi.fn(),
    getProduct: vi.fn(),
    listProducts: vi.fn(),
    restoreProduct: vi.fn(),
    updateProduct: vi.fn(),
  }
})

describe('Product mutations', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('owns Product detail and list query loading', async () => {
    const product = updatedProductFixture()
    vi.mocked(getProduct).mockResolvedValue({
      state: 'active',
      product,
      collections: [],
    })
    vi.mocked(listProducts).mockResolvedValue({
      collections: [],
      products: [
        {
          id: product.id,
          name: product.name,
          lifecycleStatus: product.lifecycleStatus,
          productStatus: product.productStatus,
          productCategory: product.productCategory,
          collection: product.collection,
          deletedAt: product.deletedAt,
          createdAt: product.createdAt,
          createdBy: product.createdBy,
        },
      ],
    })
    const { result } = renderHook(
      () => ({
        detail: useProductDetail('token', 'P-JACKIE'),
        list: useProductList('token'),
      }),
      { wrapper: createQueryClientWrapper() },
    )

    await waitFor(() => {
      expect(result.current.detail.isSuccess).toBe(true)
      expect(result.current.list.isSuccess).toBe(true)
    })
    expect(result.current.detail.data).toMatchObject({
      state: 'active',
      product: { id: 'P-JACKIE' },
    })
    expect(result.current.list.data?.products).toHaveLength(1)
    expect(getProduct).toHaveBeenCalledWith('token', 'P-JACKIE')
    expect(listProducts).toHaveBeenCalledWith('token')
  })

  it('owns Product cache synchronization and refreshes active Variant candidates', async () => {
    const candidateRequests: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      candidateRequests.push(String(input))
      return new Response(JSON.stringify({ items: [], hasMore: false }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    })
    vi.mocked(updateProduct).mockResolvedValue(updatedProductFixture())
    vi.mocked(deleteProduct).mockResolvedValue()
    vi.mocked(restoreProduct).mockResolvedValue()
    const { result } = renderHook(
      () => ({
        candidates: useProductVariantCandidates('token', 'jackie'),
        update: useUpdateProduct('token', 'P-JACKIE'),
        delete: useDeleteProduct('token', 'P-JACKIE'),
        restore: useRestoreProduct('token', 'P-JACKIE'),
      }),
      { wrapper: createQueryClientWrapper() },
    )

    await waitFor(() => expect(result.current.candidates.isSuccess).toBe(true))
    expect(candidateRequests).toHaveLength(1)

    await act(() =>
      result.current.update.updateProduct({
        name: 'Renamed Jackie',
        shortDescription: null,
        lifecycleStatus: 'approved',
        productStatus: 'active',
        productCategory: null,
        collectionId: null,
      }),
    )
    await waitFor(() => expect(candidateRequests).toHaveLength(2))
    await act(() => result.current.delete.deleteProduct())
    await waitFor(() => expect(candidateRequests).toHaveLength(3))
    await act(() => result.current.restore.restoreProduct())
    await waitFor(() => expect(candidateRequests).toHaveLength(4))
  })
})

function updatedProductFixture() {
  return {
    id: 'P-JACKIE',
    name: 'Renamed Jackie',
    shortDescription: null,
    lifecycleStatus: 'approved' as const,
    productStatus: 'active' as const,
    productCategory: null,
    collection: null,
    image: null,
    deletedAt: null,
    createdAt: '2026-09-15T12:00:00.000Z',
    createdBy: { id: 1, email: 'operator@example.com' },
  }
}
