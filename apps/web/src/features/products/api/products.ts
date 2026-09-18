import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  GetProductResponse,
  ListProductsResponse,
  ProductDetail,
} from '@guardiola-foundry/shared-types'

import { invalidateProductVariantCandidates } from '@/features/bills-of-materials/api/query-keys'
import {
  deleteProduct,
  getProduct,
  listProducts,
  restoreProduct,
  updateProduct,
  type UpdateProductInput,
} from './endpoints'
import { productDetailQueryKey, productListQueryKey } from '../query-keys'

export function useProductDetail(token: string, productId: string) {
  return useQuery({
    queryKey: productDetailQueryKey(productId),
    queryFn: () => getProduct(token, productId),
  })
}

export function useProductList(token: string) {
  return useQuery({
    queryKey: productListQueryKey(false),
    queryFn: () => listProducts(token),
  })
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
        queryClient.invalidateQueries({ queryKey: productListQueryKey(false) }),
        queryClient.invalidateQueries({ queryKey: productListQueryKey(true) }),
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
      updateProductInListCaches(queryClient, updatedProduct)
      await invalidateProductVariantCandidates(queryClient)
    },
  })

  return {
    updateProduct: mutation.mutateAsync,
    isSaving: mutation.isPending,
    updateError: mutation.error,
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
      queryClient.setQueryData<ListProductsResponse>(
        productListQueryKey(false),
        (currentData) => {
          if (!currentData) return currentData
          return {
            ...currentData,
            products: currentData.products.filter(
              (product) => product.id !== productId,
            ),
          }
        },
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productListQueryKey(true) }),
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
  for (const includeDeleted of [false, true]) {
    queryClient.setQueryData<ListProductsResponse>(
      productListQueryKey(includeDeleted),
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
