import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  ListProductsQuery,
  ListProductsResponse,
} from '@guardiola-foundry/shared-types'

import { useProductVariantCandidates } from '@/features/bills-of-materials/api/bills-of-materials'
import {
  createQueryClientWrapper,
  createTestQueryClient,
} from '@/test/query-client-wrapper'
import { productListQueryKey } from '../query-keys'
import {
  activateProduct,
  createProduct,
  deleteProduct,
  getProduct,
  inactivateProduct,
  listProductVariants,
  listProducts,
  restoreProduct,
  updateProduct,
} from './endpoints'
import {
  useDeleteProduct,
  useCreateProduct,
  useProductAvailability,
  useProductDetail,
  useProductList,
  useRestoreProduct,
  useUpdateProduct,
} from './products'
import { useProductVariants } from './product-variants'

vi.mock('./endpoints', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./endpoints')>()
  return {
    ...actual,
    activateProduct: vi.fn(),
    createProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getProduct: vi.fn(),
    inactivateProduct: vi.fn(),
    listProductVariants: vi.fn(),
    listProducts: vi.fn(),
    restoreProduct: vi.fn(),
    updateProduct: vi.fn(),
  }
})

describe('Product mutations', () => {
  afterEach(() => {
    vi.clearAllMocks()
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
      { wrapper: createQueryClientWrapper() }
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

  it('keeps Product list results distinct by effective search and deleted inclusion', async () => {
    vi.mocked(listProducts).mockImplementation(async (_token, filters) => ({
      collections: [],
      products: [
        {
          ...updatedProductFixture(),
          id: filters?.includeDeleted ? 'P-DELETED' : 'P-ACTIVE',
          name: filters?.search ?? 'All Products',
        },
      ],
    }))

    const { result } = renderHook(
      () => ({
        active: useProductList('token', { search: 'jackie' }),
        deleted: useProductList('token', {
          search: 'jackie',
          includeDeleted: true,
        }),
      }),
      { wrapper: createQueryClientWrapper() }
    )

    await waitFor(() => {
      expect(result.current.active.isSuccess).toBe(true)
      expect(result.current.deleted.isSuccess).toBe(true)
    })
    expect(result.current.active.data?.products[0]?.id).toBe('P-ACTIVE')
    expect(result.current.deleted.data?.products[0]?.id).toBe('P-DELETED')
    expect(listProducts).toHaveBeenCalledTimes(2)
  })

  it('moves a renamed Product across every cached search identity', async () => {
    const queryClient = createTestQueryClient()
    const originalProduct = {
      ...updatedProductFixture(),
      name: 'Jackie Gown',
    }
    const renamedProduct = updatedProductFixture()
    vi.mocked(updateProduct).mockResolvedValue(renamedProduct)

    for (const filters of [
      {},
      { search: 'gown' },
      { search: 'renamed' },
      { search: 'renamed', includeDeleted: true },
      { search: 'veil' },
    ]) {
      queryClient.setQueryData(productListQueryKey(filters), {
        collections: [],
        products:
          filters.search === 'renamed' || filters.search === 'veil'
            ? []
            : [originalProduct],
      })
    }

    const { result } = renderHook(() => useUpdateProduct('token', 'P-JACKIE'), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await act(() =>
      result.current.updateProduct({
        name: 'Renamed Jackie',
        shortDescription: null,
        lifecycleStatus: 'approved',
        productCategory: null,
        collectionId: null,
      }),
    )

    expect(cachedProductIds(queryClient, {})).toEqual(['P-JACKIE'])
    expect(cachedProductIds(queryClient, { search: 'gown' })).toEqual([])
    expect(cachedProductIds(queryClient, { search: 'renamed' })).toEqual([
      'P-JACKIE',
    ])
    expect(
      cachedProductIds(queryClient, {
        search: 'renamed',
        includeDeleted: true,
      }),
    ).toEqual(['P-JACKIE'])
    expect(cachedProductIds(queryClient, { search: 'veil' })).toEqual([])
  })

  it('removes a deleted Product from active identities and refreshes inactive historical identities', async () => {
    const queryClient = createTestQueryClient()
    const product = { ...updatedProductFixture(), name: 'Jackie Gown' }
    let isDeleted = false
    vi.mocked(deleteProduct).mockImplementation(async () => {
      isDeleted = true
    })
    vi.mocked(listProducts).mockImplementation(async (_token, filters) => ({
      collections: [],
      products:
        isDeleted && !filters?.includeDeleted
          ? []
          : [
              {
                ...product,
                deletedAt: isDeleted ? '2026-09-25T12:00:00.000Z' : null,
              },
            ],
    }))

    for (const filters of [
      {},
      { search: 'jackie' },
      { includeDeleted: true },
      { search: 'jackie', includeDeleted: true },
    ]) {
      await queryClient.prefetchQuery({
        queryKey: productListQueryKey(filters),
        queryFn: () => listProducts('token', filters),
      })
    }

    const { result } = renderHook(() => useDeleteProduct('token', 'P-JACKIE'), {
      wrapper: createQueryClientWrapper(queryClient),
    })

    await act(() => result.current.deleteProduct())

    expect(cachedProductIds(queryClient, {})).toEqual([])
    expect(cachedProductIds(queryClient, { search: 'jackie' })).toEqual([])
    expect(cachedProductIds(queryClient, { includeDeleted: true })).toEqual([
      'P-JACKIE',
    ])
    expect(
      cachedProductIds(queryClient, { search: 'jackie', includeDeleted: true }),
    ).toEqual(['P-JACKIE'])
    expect(
      queryClient.getQueryData<ListProductsResponse>(
        productListQueryKey({ includeDeleted: true }),
      )?.products[0]?.deletedAt,
    ).toBe('2026-09-25T12:00:00.000Z')
    expect(listProducts).toHaveBeenCalledTimes(6)
  })

  it('refreshes active and inactive Product-list identities after restoration', async () => {
    const queryClient = createTestQueryClient()
    const product = { ...updatedProductFixture(), name: 'Jackie Gown' }
    let isRestored = false
    vi.mocked(restoreProduct).mockImplementation(async () => {
      isRestored = true
    })
    vi.mocked(listProducts).mockImplementation(async (_token, filters) => {
      const matchesSearch =
        !filters?.search || product.name.toLowerCase().includes(filters.search)
      const isVisible = isRestored || filters?.includeDeleted

      return {
        collections: [],
        products:
          matchesSearch && isVisible
            ? [
                {
                  ...product,
                  deletedAt: isRestored ? null : '2026-09-25T12:00:00.000Z',
                },
              ]
            : [],
      }
    })

    for (const filters of [
      {},
      { search: 'jackie' },
      { includeDeleted: true },
      { search: 'veil', includeDeleted: true },
    ]) {
      await queryClient.prefetchQuery({
        queryKey: productListQueryKey(filters),
        queryFn: () => listProducts('token', filters),
      })
    }

    const { result } = renderHook(
      () => ({
        active: useProductList('token', { search: 'gown' }),
        restore: useRestoreProduct('token', 'P-JACKIE'),
      }),
      { wrapper: createQueryClientWrapper(queryClient) },
    )

    await waitFor(() => expect(result.current.active.isSuccess).toBe(true))
    expect(result.current.active.data?.products).toEqual([])

    await act(() => result.current.restore.restoreProduct())

    await waitFor(() => {
      expect(result.current.active.data?.products).toMatchObject([
        { id: 'P-JACKIE', deletedAt: null },
      ])
    })

    expect(cachedProductIds(queryClient, {})).toEqual(['P-JACKIE'])
    expect(cachedProductIds(queryClient, { search: 'jackie' })).toEqual([
      'P-JACKIE',
    ])
    expect(cachedProductIds(queryClient, { includeDeleted: true })).toEqual([
      'P-JACKIE',
    ])
    expect(
      queryClient.getQueryData<ListProductsResponse>(
        productListQueryKey({ includeDeleted: true }),
      )?.products[0]?.deletedAt,
    ).toBeNull()
    expect(
      cachedProductIds(queryClient, {
        search: 'veil',
        includeDeleted: true,
      }),
    ).toEqual([])
    expect(listProducts).toHaveBeenCalledTimes(10)
  })

  it('adds a created Product only to cached list identities that match its name', async () => {
    vi.mocked(listProducts).mockResolvedValue({ collections: [], products: [] })
    vi.mocked(createProduct).mockResolvedValue({
      ...updatedProductFixture(),
      id: 'P-CREATED',
      name: 'Celeste Gown',
    })

    const { result } = renderHook(
      () => ({
        all: useProductList('token'),
        gown: useProductList('token', { search: 'gown' }),
        veil: useProductList('token', { search: 'veil' }),
        includingDeleted: useProductList('token', { includeDeleted: true }),
        create: useCreateProduct('token'),
      }),
      { wrapper: createQueryClientWrapper() },
    )

    await waitFor(() => expect(listProducts).toHaveBeenCalledTimes(4))

    await act(() =>
      result.current.create.createProduct({
        name: 'Celeste Gown',
        lifecycleStatus: 'concept',
      }),
    )

    expect(result.current.all.data?.products).toHaveLength(1)
    expect(result.current.gown.data?.products).toHaveLength(1)
    expect(result.current.veil.data?.products).toHaveLength(0)
    expect(result.current.includingDeleted.data?.products).toHaveLength(1)
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
    vi.mocked(activateProduct).mockResolvedValue(updatedProductFixture())
    vi.mocked(inactivateProduct).mockResolvedValue({
      ...updatedProductFixture(),
      productStatus: 'inactive',
    })
    vi.mocked(deleteProduct).mockResolvedValue()
    vi.mocked(restoreProduct).mockResolvedValue()
    vi.mocked(listProductVariants).mockResolvedValue({ variants: [] })
    const { result } = renderHook(
      () => ({
        candidates: useProductVariantCandidates('token', 'jackie'),
        variants: useProductVariants('token', 'P-JACKIE', true, false),
        availability: useProductAvailability('token', 'P-JACKIE'),
        update: useUpdateProduct('token', 'P-JACKIE'),
        delete: useDeleteProduct('token', 'P-JACKIE'),
        restore: useRestoreProduct('token', 'P-JACKIE'),
      }),
      { wrapper: createQueryClientWrapper() }
    )

    await waitFor(() => {
      expect(result.current.candidates.isSuccess).toBe(true)
      expect(listProductVariants).toHaveBeenCalledTimes(1)
    })
    expect(candidateRequests).toHaveLength(1)

    await act(() =>
      result.current.update.updateProduct({
        name: 'Renamed Jackie',
        shortDescription: null,
        lifecycleStatus: 'approved',
        productCategory: null,
        collectionId: null,
      })
    )
    await waitFor(() => expect(candidateRequests).toHaveLength(2))
    await act(() => result.current.delete.deleteProduct())
    await waitFor(() => expect(candidateRequests).toHaveLength(3))
    await act(() => result.current.restore.restoreProduct())
    await waitFor(() => expect(candidateRequests).toHaveLength(4))
    await act(() =>
      result.current.availability.changeAvailability({
        type: 'inactivate',
        inactivateVariants: true,
      })
    )
    await waitFor(() => {
      expect(candidateRequests).toHaveLength(5)
      expect(listProductVariants).toHaveBeenCalledTimes(4)
    })
    await act(() => result.current.availability.changeAvailability({ type: 'activate' }))
    await waitFor(() => expect(candidateRequests).toHaveLength(6))
    expect(listProductVariants).toHaveBeenCalledTimes(4)
  })

  it('refreshes Product Variants after Product restoration can recover Base', async () => {
    vi.mocked(listProductVariants).mockResolvedValue({ variants: [] })
    vi.mocked(restoreProduct).mockResolvedValue()
    const { result } = renderHook(
      () => ({
        variants: useProductVariants('token', 'P-JACKIE', true, false),
        restore: useRestoreProduct('token', 'P-JACKIE'),
      }),
      { wrapper: createQueryClientWrapper() }
    )

    await waitFor(() => expect(listProductVariants).toHaveBeenCalledTimes(1))

    await act(() => result.current.restore.restoreProduct())

    await waitFor(() => expect(listProductVariants).toHaveBeenCalledTimes(2))
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

function cachedProductIds(
  queryClient: ReturnType<typeof createTestQueryClient>,
  filters: ListProductsQuery,
) {
  return (
    queryClient.getQueryData<ListProductsResponse>(productListQueryKey(filters))
      ?.products ?? []
  ).map((product) => product.id)
}
