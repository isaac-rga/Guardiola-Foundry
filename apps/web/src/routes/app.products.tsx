import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/products')({
  validateSearch: (
    search,
  ): {
    deletedProductName?: string
    filterPrototype?: 'A'
  } => ({
    deletedProductName:
      typeof search.deletedProductName === 'string' && search.deletedProductName.length > 0
        ? search.deletedProductName
        : undefined,
    filterPrototype: search.filterPrototype === 'A' ? 'A' : undefined,
  }),
  component: ProductsRoute,
})

function ProductsRoute() {
  return <Outlet />
}
