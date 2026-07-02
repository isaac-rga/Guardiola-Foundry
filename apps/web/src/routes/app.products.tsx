import { createFileRoute } from '@tanstack/react-router'

import { ProductManagementPage } from '@/features/products/product-management-page'

export const Route = createFileRoute('/app/products')({
  component: ProductsRoute,
})

function ProductsRoute() {
  return <ProductManagementPage />
}
