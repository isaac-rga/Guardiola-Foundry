import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'

import { ProductManagementPage } from '@/features/products/product-management-page'

export const Route = createFileRoute('/app/products/')({
  component: ProductsIndexRoute,
})

function ProductsIndexRoute() {
  const navigate = useNavigate({ from: '/app/products' })
  const { deletedProductName } = useSearch({ from: '/app/products' })

  return (
    <ProductManagementPage
      deletedProductName={deletedProductName}
      onDismissDeletedFeedback={() =>
        void navigate({
          to: '/app/products',
          search: (previousSearch) => ({
            ...previousSearch,
            deletedProductName: undefined,
          }),
        })
      }
    />
  )
}
