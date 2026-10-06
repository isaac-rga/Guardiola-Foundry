import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  CreateProductRequest,
  GetProductResponse,
  InactivateProductRequest,
  ListProductsQuery,
  ListProductsResponse,
  ProductDetail,
} from '@guardiola-foundry/shared-types'

import { invalidateProductVariantCandidates } from '@/features/bills-of-materials/api/query-keys'
import {
  activateProduct,
  createProduct,
  deleteProduct,
  getProduct,
  inactivateProduct,
  listProducts,
  restoreProduct,
  updateProduct,
  type UpdateProductInput,
} from './endpoints'
import {
  decodeProductListQueryKey,
  productDetailQueryKey,
  productListQueryKey,
  productListQueryPrefix,
  productMatchesListQueryKey,
  productVariantsQueryPrefix,
} from '../query-keys'

export function useProductDetail(token: string, productId: string) {
  return useQuery({
    queryKey: productDetailQueryKey(productId),
    queryFn: () => getProduct(token, productId),
  })
}

export function useProductList(token: string, filters?: ListProductsQuery) {
  return useQuery({
    queryKey: productListQueryKey(filters),
    queryFn: () =>
      filters ? listProducts(token, filters) : listProducts(token),
    placeholderData: keepPreviousData,
  })
}

export function useCreateProduct(token: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: CreateProductRequest) =>
      createProduct(token, payload),
    onSuccess: (createdProduct) => {
      reconcileProductListCaches(queryClient, createdProduct)
    },
  })

  return {
    createProduct: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
  }
}

export function useRestoreProduct(token: string, productId: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => restoreProduct(token, productId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: productDetailQueryKey(productId),
        }),
        queryClient.invalidateQueries({
          queryKey: productListQueryPrefix,
          refetchType: 'all',
        }),
        invalidateProductVariantCandidates(queryClient),
      ])
    },
  })

  return {
    restoreProduct: mutation.mutateAsync,
    isRestoring: mutation.isPending,
    restoreError: mutation.error,
  }
}

export function useUpdateProduct(token: string, productId: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: UpdateProductInput) =>
      updateProduct(token, productId, payload),
    onSuccess: async (updatedProduct) => {
      queryClient.setQueryData<GetProductResponse>(
        productDetailQueryKey(productId),
        (currentData) => {
          if (currentData?.state !== 'active') return currentData
          return { ...currentData, product: updatedProduct }
        },
      )
      reconcileProductListCaches(queryClient, toProductSummary(updatedProduct))
      await invalidateProductVariantCandidates(queryClient)
    },
  })

  return {
    updateProduct: mutation.mutateAsync,
    isSaving: mutation.isPending,
    updateError: mutation.error,
  }
}

export function useProductAvailability(token: string, productId: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (action: { type: 'activate' } | ({ type: 'inactivate' } & InactivateProductRequest)) =>
      action.type === 'activate'
        ? activateProduct(token, productId)
        : inactivateProduct(token, productId, {
            inactivateVariants: action.inactivateVariants,
          }),
    onSuccess: async (updatedProduct, action) => {
      queryClient.setQueryData<GetProductResponse>(productDetailQueryKey(productId), (currentData) => {
        if (currentData?.state !== 'active') return currentData
        return { ...currentData, product: updatedProduct }
      })
      updateProductInListCaches(queryClient, updatedProduct)

      const invalidations = [invalidateProductVariantCandidates(queryClient)]

      if (action.type === 'inactivate' && action.inactivateVariants === true) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: productVariantsQueryPrefix(productId),
          })
        )
      }

      await Promise.all(invalidations)
    },
  })

  return {
    changeAvailability: mutation.mutateAsync,
    isChangingAvailability: mutation.isPending,
    availabilityError: mutation.error,
  }
}

export function useDeleteProduct(token: string, productId: string) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => deleteProduct(token, productId),
    onSuccess: async () => {
      queryClient.removeQueries({
        queryKey: productDetailQueryKey(productId),
      })
      for (const [
        queryKey,
        currentData,
      ] of queryClient.getQueriesData<ListProductsResponse>({
        queryKey: productListQueryPrefix,
      })) {
        const identity = decodeProductListQueryKey(queryKey)
        if (!currentData || !identity || identity.includeDeleted) continue

        queryClient.setQueryData<ListProductsResponse>(queryKey, {
          ...currentData,
          products: currentData.products.filter(
            (product) => product.id !== productId,
          ),
        })
      }
      await Promise.all([
        queryClient.invalidateQueries({
          predicate: (query) =>
            decodeProductListQueryKey(query.queryKey)?.includeDeleted === true,
          refetchType: 'all',
        }),
        invalidateProductVariantCandidates(queryClient),
      ])
    },
  })

  return {
    deleteProduct: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
  }
}

function updateProductInListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  updatedProduct: ProductDetail,
) {
  queryClient.setQueriesData<ListProductsResponse>(
    { queryKey: productListQueryPrefix },
    (currentData) => {
      if (!currentData) return currentData
      return {
        ...currentData,
        products: currentData.products.map((currentProduct) =>
          currentProduct.id === updatedProduct.id
            ? toProductSummary(updatedProduct)
            : currentProduct,
        ),
      }
    },
  )
}

function toProductSummary(
  product: ProductDetail,
): ListProductsResponse['products'][number] {
  return {
    id: product.id,
    name: product.name,
    lifecycleStatus: product.lifecycleStatus,
    productStatus: product.productStatus,
    deletedAt: product.deletedAt,
    productCategory: product.productCategory,
    collection: product.collection,
    createdAt: product.createdAt,
    createdBy: product.createdBy,
  }
}

function reconcileProductListCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  product: ListProductsResponse['products'][number],
) {
  for (const [
    queryKey,
    currentData,
  ] of queryClient.getQueriesData<ListProductsResponse>({
    queryKey: productListQueryPrefix,
  })) {
    if (!currentData) continue

    const otherProducts = currentData.products.filter(
      (currentProduct) => currentProduct.id !== product.id,
    )
    queryClient.setQueryData<ListProductsResponse>(queryKey, {
      ...currentData,
      products: productMatchesListQueryKey(product, queryKey)
        ? [product, ...otherProducts]
        : otherProducts,
    })
  }
}
