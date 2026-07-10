import { createFileRoute } from '@tanstack/react-router'

import { ProductEditPage } from '@/features/products/product-edit-page'

export const Route = createFileRoute('/app/products/$productId')({
  component: ProductEditRoute,
})

function ProductEditRoute() {
  const { productId } = Route.useParams()

  return <ProductEditPage productId={productId} />
}
