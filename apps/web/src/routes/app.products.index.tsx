import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'

import { ProductManagementPage } from '@/features/products/product-management-page'

export const Route = createFileRoute('/app/products/')({
  component: ProductsIndexRoute,
})

function ProductsIndexRoute() {
  const navigate = useNavigate({ from: '/app/products' })
  const filters = useSearch({
    from: '/app/products',
  })

  return (
    <ProductManagementPage
      filters={filters}
      onFiltersChange={(changes, options) =>
        void navigate({
          to: '/app/products',
          search: (previousSearch) => ({ ...previousSearch, ...changes }),
          replace: options?.replace,
        })
      }
      onDismissDeletedFeedback={() =>
        void navigate({
          to: '/app/products',
          search: (previousSearch) => ({
            ...previousSearch,
            deletedProductName: undefined,
          }),
        })
      }
      showFilterPrototype={filters.filterPrototype === 'A'}
    />
  )
}
