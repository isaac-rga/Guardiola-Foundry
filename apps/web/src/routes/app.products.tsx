import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/products')({
  validateSearch: (search) => ({
    deletedProductName:
      typeof search.deletedProductName === 'string' && search.deletedProductName.length > 0
        ? search.deletedProductName
        : undefined,
  }),
  component: ProductsRoute,
})

function ProductsRoute() {
  return <Outlet />
}
